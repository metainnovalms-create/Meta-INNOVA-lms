import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const defaultOpenAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create supabase client
function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Fetch AI settings from system_configurations
interface AISettings {
  enabled: boolean;
  custom_api_key: string;
  model: string;
  prompt_limit_enabled: boolean;
  monthly_prompt_limit: number;
}

async function getAISettings(): Promise<AISettings> {
  const supabase = getSupabaseClient();
  try {
    const { data } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'ask_metova_settings')
      .single();
    
    if (data?.value) {
      const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return {
        enabled: settings.enabled ?? true,
        custom_api_key: settings.custom_api_key || '',
        model: settings.model || 'gpt-4o-mini',
        prompt_limit_enabled: settings.prompt_limit_enabled ?? false,
        monthly_prompt_limit: settings.monthly_prompt_limit ?? 10
      };
    }
  } catch (e) {
    console.error('Error fetching AI settings:', e);
  }
  return { enabled: true, custom_api_key: '', model: 'gpt-4o-mini', prompt_limit_enabled: false, monthly_prompt_limit: 10 };
}

// Check and update user prompt usage
async function checkAndUpdateUsage(userId: string, role: string, limit: number): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  try {
    // Get current usage for this month
    const { data: usage } = await supabase
      .from('ai_prompt_usage')
      .select('id, prompt_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();
    
    const currentCount = usage?.prompt_count || 0;
    
    if (currentCount >= limit) {
      return { allowed: false, used: currentCount, limit };
    }
    
    // Increment usage
    if (usage) {
      await supabase
        .from('ai_prompt_usage')
        .update({ 
          prompt_count: currentCount + 1, 
          updated_at: now.toISOString() 
        })
        .eq('id', usage.id);
    } else {
      await supabase
        .from('ai_prompt_usage')
        .insert({
          user_id: userId,
          role: role,
          prompt_count: 1,
          month: currentMonth,
          year: currentYear
        });
    }
    
    return { allowed: true, used: currentCount + 1, limit };
  } catch (e) {
    console.error('Error checking/updating usage:', e);
    // On error, allow the request but log it
    return { allowed: true, used: 0, limit };
  }
}

// Get user's current usage (without incrementing)
async function getUserUsage(userId: string): Promise<{ used: number; month: number; year: number }> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  try {
    const { data } = await supabase
      .from('ai_prompt_usage')
      .select('prompt_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();
    
    return { used: data?.prompt_count || 0, month: currentMonth, year: currentYear };
  } catch (e) {
    return { used: 0, month: currentMonth, year: currentYear };
  }
}

// ==================== CONTEXT FETCHERS ====================

// 1. Institution Context
async function fetchInstitutionContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📍 INSTITUTIONS'];
  
  try {
    const { data: institutions } = await supabase
      .from('institutions')
      .select('id, name, status, current_users, max_users, contract_expiry_date, contract_value, type, code')
      .order('name');
    
    if (institutions?.length) {
      parts.push(`Total Institutions: ${institutions.length}`);
      for (const inst of institutions) {
        parts.push(`- **${inst.name}** (${inst.code || 'N/A'}): Type: ${inst.type || 'N/A'}, Status: ${inst.status}, Users: ${inst.current_users || 0}/${inst.max_users || 'unlimited'}, Contract: ₹${(inst.contract_value || 0).toLocaleString()}, Expiry: ${inst.contract_expiry_date || 'Not set'}`);
      }
    } else {
      parts.push('No institutions found in the system.');
    }

    // Fetch classes per institution
    const { data: classes } = await supabase
      .from('classes')
      .select('id, institution_id, class_name, status');
    
    if (classes?.length) {
      const classCount: Record<string, number> = {};
      for (const c of classes) {
        classCount[c.institution_id] = (classCount[c.institution_id] || 0) + 1;
      }
      parts.push('\n**Classes per Institution:**');
      for (const inst of (institutions || [])) {
        parts.push(`- ${inst.name}: ${classCount[inst.id] || 0} classes`);
      }
    }
  } catch (e) {
    console.error('Institution context error:', e);
    parts.push('Error fetching institution data.');
  }
  
  return parts.join('\n');
}

// 2. Student/Profile Context
async function fetchStudentProfileContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 👥 STUDENTS & PROFILES'];
  
  try {
    const { data: profiles, count } = await supabase
      .from('profiles')
      .select('institution_id, institutions(name)', { count: 'exact' })
      .not('institution_id', 'is', null);
    
    parts.push(`Total Students/Users: ${count || 0}`);
    
    if (profiles?.length) {
      const countMap: Record<string, number> = {};
      for (const p of profiles) {
        const inst = p.institutions as unknown as { name: string } | null;
        const name = inst?.name || 'Unassigned';
        countMap[name] = (countMap[name] || 0) + 1;
      }
      parts.push('**By Institution:**');
      for (const [name, cnt] of Object.entries(countMap).sort((a, b) => b[1] - a[1])) {
        parts.push(`- ${name}: ${cnt} students`);
      }
    }
  } catch (e) {
    console.error('Student context error:', e);
  }
  
  return parts.join('\n');
}

// 3. Officer Context
async function fetchOfficerContextData(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 👨‍🏫 OFFICERS (Trainers/Innovation Officers)'];
  
  try {
    const { data: officers, count } = await supabase
      .from('officers')
      .select('id, name, email, designation, department, status, officer_type', { count: 'exact' });
    
    parts.push(`Total Officers: ${count || 0}`);
    
    if (officers?.length) {
      const byStatus: Record<string, number> = {};
      const byDept: Record<string, number> = {};
      for (const o of officers) {
        byStatus[o.status || 'unknown'] = (byStatus[o.status || 'unknown'] || 0) + 1;
        byDept[o.department || 'Unassigned'] = (byDept[o.department || 'Unassigned'] || 0) + 1;
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**By Department:**');
      for (const [d, c] of Object.entries(byDept).slice(0, 10)) parts.push(`- ${d}: ${c}`);
    }
  } catch (e) {
    console.error('Officer context error:', e);
  }
  
  return parts.join('\n');
}

// 4. Course Context
async function fetchCourseContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📚 COURSES'];
  
  try {
    const { data: courses, count } = await supabase
      .from('courses')
      .select('id, title, status, category, difficulty', { count: 'exact' });
    
    parts.push(`Total Courses: ${count || 0}`);
    
    if (courses?.length) {
      const byStatus: Record<string, number> = {};
      const byCategory: Record<string, number> = {};
      for (const c of courses) {
        byStatus[c.status || 'unknown'] = (byStatus[c.status || 'unknown'] || 0) + 1;
        byCategory[c.category || 'Uncategorized'] = (byCategory[c.category || 'Uncategorized'] || 0) + 1;
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**By Category:**');
      for (const [cat, c] of Object.entries(byCategory).slice(0, 8)) parts.push(`- ${cat}: ${c}`);
      parts.push('**Recent Courses:**');
      for (const c of courses.slice(0, 5)) parts.push(`- ${c.title} (${c.status})`);
    }

    // Course assignments to institutions
    const { count: assignmentCount } = await supabase
      .from('course_institution_assignments')
      .select('*', { count: 'exact', head: true });
    parts.push(`\nCourse-Institution Assignments: ${assignmentCount || 0}`);
  } catch (e) {
    console.error('Course context error:', e);
  }
  
  return parts.join('\n');
}

// 5. Assessment Context
async function fetchAssessmentContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📝 ASSESSMENTS'];
  
  try {
    const { data: assessments, count } = await supabase
      .from('assessments')
      .select('id, title, status, start_time, end_time, pass_percentage', { count: 'exact' });
    
    parts.push(`Total Assessments: ${count || 0}`);
    
    if (assessments?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of assessments) {
        byStatus[a.status || 'unknown'] = (byStatus[a.status || 'unknown'] || 0) + 1;
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      
      // Upcoming assessments
      const now = new Date().toISOString();
      const upcoming = assessments.filter(a => a.start_time && a.start_time > now).slice(0, 5);
      if (upcoming.length) {
        parts.push('**Upcoming:**');
        for (const a of upcoming) parts.push(`- ${a.title} (starts: ${new Date(a.start_time).toLocaleDateString()})`);
      }
    }

    // Assessment attempts stats
    const { data: attempts } = await supabase
      .from('assessment_attempts')
      .select('passed, percentage');
    
    if (attempts?.length) {
      const passed = attempts.filter(a => a.passed).length;
      const avgScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length;
      parts.push(`\n**Attempt Stats:** Total: ${attempts.length}, Passed: ${passed} (${((passed/attempts.length)*100).toFixed(1)}%), Avg Score: ${avgScore.toFixed(1)}%`);
    }
  } catch (e) {
    console.error('Assessment context error:', e);
  }
  
  return parts.join('\n');
}

// 6. Assignment Context
async function fetchAssignmentContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📋 ASSIGNMENTS'];
  
  try {
    const { data: assignments, count } = await supabase
      .from('assignments')
      .select('id, title, status, start_date, submission_end_date, total_marks', { count: 'exact' });
    
    parts.push(`Total Assignments: ${count || 0}`);
    
    if (assignments?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of assignments) {
        byStatus[a.status || 'unknown'] = (byStatus[a.status || 'unknown'] || 0) + 1;
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }

    // Submissions stats
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('status, marks_obtained');
    
    if (submissions?.length) {
      const byStatus: Record<string, number> = {};
      for (const s of submissions) {
        byStatus[s.status || 'unknown'] = (byStatus[s.status || 'unknown'] || 0) + 1;
      }
      parts.push('**Submissions by Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    } else {
      parts.push('No submissions yet.');
    }
  } catch (e) {
    console.error('Assignment context error:', e);
  }
  
  return parts.join('\n');
}

// 7. Events Context
async function fetchEventsContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🎉 EVENTS'];
  
  try {
    const { data: events, count } = await supabase
      .from('events')
      .select('id, title, status, event_type, event_start, event_end, current_participants, max_participants', { count: 'exact' });
    
    parts.push(`Total Events: ${count || 0}`);
    
    if (events?.length) {
      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      for (const e of events) {
        byStatus[e.status || 'unknown'] = (byStatus[e.status || 'unknown'] || 0) + 1;
        byType[e.event_type || 'other'] = (byType[e.event_type || 'other'] || 0) + 1;
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**By Type:**');
      for (const [t, c] of Object.entries(byType)) parts.push(`- ${t}: ${c}`);
      
      // Upcoming events
      const now = new Date().toISOString();
      const upcoming = events.filter(e => e.event_start && e.event_start > now).slice(0, 5);
      if (upcoming.length) {
        parts.push('**Upcoming Events:**');
        for (const e of upcoming) parts.push(`- ${e.title} (${e.event_type}) - ${new Date(e.event_start).toLocaleDateString()}`);
      }
    }

    // Event registrations
    const { count: regCount } = await supabase
      .from('event_interests')
      .select('*', { count: 'exact', head: true });
    parts.push(`\nTotal Event Registrations: ${regCount || 0}`);
  } catch (e) {
    console.error('Events context error:', e);
  }
  
  return parts.join('\n');
}

// 8. Projects Context
async function fetchProjectsContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🚀 INNOVATION PROJECTS'];
  
  try {
    const { data: projects, count } = await supabase
      .from('projects')
      .select('id, title, status, sdg_goals, institution_id, institutions(name)', { count: 'exact' });
    
    parts.push(`Total Projects: ${count || 0}`);
    
    if (projects?.length) {
      const byStatus: Record<string, number> = {};
      const sdgCount: Record<string, number> = {};
      for (const p of projects) {
        byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1;
        if (p.sdg_goals && Array.isArray(p.sdg_goals)) {
          for (const g of p.sdg_goals) sdgCount[g] = (sdgCount[g] || 0) + 1;
        }
      }
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      if (Object.keys(sdgCount).length) {
        parts.push('**SDG Goals Coverage:**');
        for (const [g, c] of Object.entries(sdgCount).slice(0, 8)) parts.push(`- SDG ${g}: ${c} projects`);
      }
    }

    // Project awards
    const { data: awards } = await supabase
      .from('project_achievements')
      .select('id, title, achievement_type');
    
    if (awards?.length) {
      parts.push(`\n**Project Awards/Achievements:** ${awards.length}`);
    }
  } catch (e) {
    console.error('Projects context error:', e);
  }
  
  return parts.join('\n');
}

// 9. Inventory Context
async function fetchInventoryContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📦 INVENTORY'];
  
  try {
    const { data: items, count } = await supabase
      .from('inventory_items')
      .select('id, name, category, current_stock, institution_id', { count: 'exact' });
    
    parts.push(`Total Inventory Items: ${count || 0}`);
    
    if (items?.length) {
      const byCategory: Record<string, number> = {};
      let lowStock = 0;
      for (const i of items) {
        byCategory[i.category || 'Uncategorized'] = (byCategory[i.category || 'Uncategorized'] || 0) + 1;
        if ((i.current_stock || 0) < 5) lowStock++;
      }
      parts.push('**By Category:**');
      for (const [c, n] of Object.entries(byCategory).slice(0, 8)) parts.push(`- ${c}: ${n}`);
      parts.push(`\n⚠️ Low Stock Items: ${lowStock}`);
    }

    // Purchase requests
    const { data: requests } = await supabase
      .from('purchase_requests')
      .select('status');
    
    if (requests?.length) {
      const byStatus: Record<string, number> = {};
      for (const r of requests) byStatus[r.status || 'unknown'] = (byStatus[r.status || 'unknown'] || 0) + 1;
      parts.push('**Purchase Requests:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }

    // Inventory issues
    const { data: issues } = await supabase
      .from('inventory_issues')
      .select('status');
    
    if (issues?.length) {
      const open = issues.filter(i => i.status === 'open' || i.status === 'pending').length;
      parts.push(`\nOpen Inventory Issues: ${open}`);
    }
  } catch (e) {
    console.error('Inventory context error:', e);
  }
  
  return parts.join('\n');
}

// 10. Payroll Context
async function fetchPayrollContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 💰 PAYROLL'];
  
  try {
    const { data: payrolls } = await supabase
      .from('payroll_records')
      .select('status, net_salary, month, year');
    
    if (payrolls?.length) {
      const byStatus: Record<string, number> = {};
      let totalPaid = 0;
      let totalPending = 0;
      for (const p of payrolls) {
        byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1;
        if (p.status === 'paid') totalPaid += p.net_salary || 0;
        else totalPending += p.net_salary || 0;
      }
      parts.push(`Total Records: ${payrolls.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push(`\nTotal Paid: ₹${totalPaid.toLocaleString()}`);
      parts.push(`Pending: ₹${totalPending.toLocaleString()}`);
    } else {
      parts.push('No payroll records found.');
    }
  } catch (e) {
    console.error('Payroll context error:', e);
  }
  
  return parts.join('\n');
}

// 11. Leave Context
async function fetchLeaveContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🏖️ LEAVE MANAGEMENT'];
  
  try {
    const { data: leaves } = await supabase
      .from('leave_applications')
      .select('status, leave_type, start_date, end_date');
    
    if (leaves?.length) {
      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      for (const l of leaves) {
        byStatus[l.status || 'unknown'] = (byStatus[l.status || 'unknown'] || 0) + 1;
        byType[l.leave_type || 'other'] = (byType[l.leave_type || 'other'] || 0) + 1;
      }
      parts.push(`Total Applications: ${leaves.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**By Type:**');
      for (const [t, c] of Object.entries(byType)) parts.push(`- ${t}: ${c}`);
    } else {
      parts.push('No leave applications found.');
    }

    // Company holidays
    const { data: holidays } = await supabase
      .from('company_holidays')
      .select('name, date, holiday_type')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .limit(5);
    
    if (holidays?.length) {
      parts.push('\n**Upcoming Holidays:**');
      for (const h of holidays) parts.push(`- ${h.name} (${h.holiday_type}) - ${h.date}`);
    }
  } catch (e) {
    console.error('Leave context error:', e);
  }
  
  return parts.join('\n');
}

// 12. Task Context
async function fetchTaskContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## ✅ CRM TASKS'];
  
  try {
    const { data: tasks } = await supabase
      .from('crm_tasks')
      .select('status, priority, due_date, task_type');
    
    if (tasks?.length) {
      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      let overdue = 0;
      const today = new Date().toISOString().split('T')[0];
      
      for (const t of tasks) {
        byStatus[t.status || 'unknown'] = (byStatus[t.status || 'unknown'] || 0) + 1;
        byPriority[t.priority || 'normal'] = (byPriority[t.priority || 'normal'] || 0) + 1;
        if (t.due_date && t.due_date < today && t.status !== 'completed') overdue++;
      }
      parts.push(`Total Tasks: ${tasks.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**By Priority:**');
      for (const [p, c] of Object.entries(byPriority)) parts.push(`- ${p}: ${c}`);
      parts.push(`\n⚠️ Overdue Tasks: ${overdue}`);
    } else {
      parts.push('No tasks found.');
    }
  } catch (e) {
    console.error('Task context error:', e);
  }
  
  return parts.join('\n');
}

// 13. Gamification Context
async function fetchGamificationContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🎮 GAMIFICATION'];
  
  try {
    const { data: badges, count: badgeCount } = await supabase
      .from('gamification_badges')
      .select('name, category, xp_reward, is_active', { count: 'exact' });
    
    parts.push(`Total Badges: ${badgeCount || 0}`);
    if (badges?.length) {
      const active = badges.filter(b => b.is_active).length;
      parts.push(`Active Badges: ${active}`);
    }

    // XP transactions
    const { data: xpData } = await supabase
      .from('student_xp_transactions')
      .select('points_earned, activity_type');
    
    if (xpData?.length) {
      const totalXP = xpData.reduce((sum, x) => sum + (x.points_earned || 0), 0);
      const byActivity: Record<string, number> = {};
      for (const x of xpData) {
        byActivity[x.activity_type || 'other'] = (byActivity[x.activity_type || 'other'] || 0) + (x.points_earned || 0);
      }
      parts.push(`\nTotal XP Distributed: ${totalXP.toLocaleString()}`);
      parts.push('**XP by Activity:**');
      for (const [a, p] of Object.entries(byActivity).slice(0, 5)) parts.push(`- ${a}: ${p} XP`);
    }
  } catch (e) {
    console.error('Gamification context error:', e);
  }
  
  return parts.join('\n');
}

// 14. ATS/Recruitment Context
async function fetchATSContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 👔 RECRUITMENT (ATS)'];
  
  try {
    const { data: jobs } = await supabase
      .from('job_postings')
      .select('status, department, job_type');
    
    if (jobs?.length) {
      const byStatus: Record<string, number> = {};
      for (const j of jobs) byStatus[j.status || 'unknown'] = (byStatus[j.status || 'unknown'] || 0) + 1;
      parts.push(`Total Job Postings: ${jobs.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    } else {
      parts.push('No job postings found.');
    }

    // Applications
    const { data: apps } = await supabase
      .from('job_applications')
      .select('status');
    
    if (apps?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of apps) byStatus[a.status || 'unknown'] = (byStatus[a.status || 'unknown'] || 0) + 1;
      parts.push(`\nTotal Applications: ${apps.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }

    // Interviews
    const { data: interviews } = await supabase
      .from('candidate_interviews')
      .select('status, scheduled_date')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date')
      .limit(5);
    
    if (interviews?.length) {
      parts.push('\n**Upcoming Interviews:**');
      for (const i of interviews) parts.push(`- ${i.scheduled_date} (${i.status})`);
    }
  } catch (e) {
    console.error('ATS context error:', e);
  }
  
  return parts.join('\n');
}

// 15. Invoice Context
async function fetchInvoiceContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🧾 INVOICES & REVENUE'];
  
  try {
    const { data: invoices } = await supabase
      .from('institution_invoices')
      .select('status, total_amount, paid_amount, due_date');
    
    if (invoices?.length) {
      const byStatus: Record<string, number> = {};
      let totalRevenue = 0;
      let totalPending = 0;
      
      for (const inv of invoices) {
        byStatus[inv.status || 'unknown'] = (byStatus[inv.status || 'unknown'] || 0) + 1;
        if (inv.status === 'paid') totalRevenue += inv.total_amount || 0;
        else totalPending += (inv.total_amount || 0) - (inv.paid_amount || 0);
      }
      parts.push(`Total Invoices: ${invoices.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push(`\n💵 Total Revenue (Paid): ₹${totalRevenue.toLocaleString()}`);
      parts.push(`📋 Pending Receivables: ₹${totalPending.toLocaleString()}`);
    } else {
      parts.push('No invoices found.');
    }
  } catch (e) {
    console.error('Invoice context error:', e);
  }
  
  return parts.join('\n');
}

// 16. CRM Context
async function fetchCRMContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 🤝 CRM & CONTRACTS'];
  
  try {
    const { data: contracts } = await supabase
      .from('crm_contracts')
      .select('status, contract_type, contract_value, institution_name, renewal_date, renewal_status');
    
    if (contracts?.length) {
      const byStatus: Record<string, number> = {};
      const byRenewal: Record<string, number> = {};
      let totalValue = 0;
      
      for (const c of contracts) {
        byStatus[c.status || 'unknown'] = (byStatus[c.status || 'unknown'] || 0) + 1;
        byRenewal[c.renewal_status || 'unknown'] = (byRenewal[c.renewal_status || 'unknown'] || 0) + 1;
        totalValue += c.contract_value || 0;
      }
      parts.push(`Total Contracts: ${contracts.length}`);
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
      parts.push('**Renewal Status:**');
      for (const [r, c] of Object.entries(byRenewal)) parts.push(`- ${r}: ${c}`);
      parts.push(`\n💰 Total Contract Value: ₹${totalValue.toLocaleString()}`);
      
      // Upcoming renewals
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
      const upcomingRenewals = contracts.filter(c => c.renewal_date && c.renewal_date >= today && c.renewal_date <= nextMonth);
      if (upcomingRenewals.length) {
        parts.push('\n⏰ **Renewals in Next 30 Days:**');
        for (const c of upcomingRenewals) parts.push(`- ${c.institution_name}: ${c.renewal_date}`);
      }
    } else {
      parts.push('No contracts found.');
    }

    // Communication logs
    const { count: commCount } = await supabase
      .from('communication_logs')
      .select('*', { count: 'exact', head: true });
    parts.push(`\n📞 Total Communication Logs: ${commCount || 0}`);
  } catch (e) {
    console.error('CRM context error:', e);
  }
  
  return parts.join('\n');
}

// 17. Newsletter Context
async function fetchNewsletterContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📰 NEWSLETTERS'];
  
  try {
    const { data: newsletters, count } = await supabase
      .from('newsletters')
      .select('id, title, status, download_count, published_at', { count: 'exact' });
    
    parts.push(`Total Newsletters: ${count || 0}`);
    
    if (newsletters?.length) {
      const published = newsletters.filter(n => n.status === 'published').length;
      const totalDownloads = newsletters.reduce((sum, n) => sum + (n.download_count || 0), 0);
      parts.push(`Published: ${published}`);
      parts.push(`Total Downloads: ${totalDownloads}`);
      
      // Recent newsletters
      const recent = newsletters.filter(n => n.published_at).slice(0, 3);
      if (recent.length) {
        parts.push('\n**Recent:**');
        for (const n of recent) parts.push(`- ${n.title} (${n.download_count || 0} downloads)`);
      }
    }
  } catch (e) {
    console.error('Newsletter context error:', e);
  }
  
  return parts.join('\n');
}

// 18. Performance/HR Ratings Context
async function fetchPerformanceContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## ⭐ PERFORMANCE RATINGS'];
  
  try {
    const { data: ratings, count } = await supabase
      .from('hr_ratings')
      .select('period, year, total_stars_quarter, trainer_name', { count: 'exact' });
    
    parts.push(`Total Rating Records: ${count || 0}`);
    
    if (ratings?.length) {
      const byYear: Record<number, number> = {};
      let totalStars = 0;
      for (const r of ratings) {
        byYear[r.year] = (byYear[r.year] || 0) + 1;
        totalStars += r.total_stars_quarter || 0;
      }
      parts.push('**By Year:**');
      for (const [y, c] of Object.entries(byYear)) parts.push(`- ${y}: ${c} records`);
      parts.push(`\nTotal Stars Awarded: ${totalStars}`);
    }

    // Appraisals
    const { data: appraisals } = await supabase
      .from('performance_appraisals')
      .select('status, rating');
    
    if (appraisals?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of appraisals) byStatus[a.status || 'unknown'] = (byStatus[a.status || 'unknown'] || 0) + 1;
      parts.push(`\n**Appraisals:** ${appraisals.length}`);
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }
  } catch (e) {
    console.error('Performance context error:', e);
  }
  
  return parts.join('\n');
}

// 19. Survey Context
async function fetchSurveyContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📊 SURVEYS & FEEDBACK'];
  
  try {
    const { data: surveys, count } = await supabase
      .from('surveys')
      .select('id, title, status, created_at', { count: 'exact' });
    
    parts.push(`Total Surveys: ${count || 0}`);
    
    if (surveys?.length) {
      const byStatus: Record<string, number> = {};
      for (const s of surveys) byStatus[s.status || 'unknown'] = (byStatus[s.status || 'unknown'] || 0) + 1;
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }

    // Survey responses
    const { count: responseCount } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true });
    parts.push(`\nTotal Responses: ${responseCount || 0}`);

    // Feedback
    const { data: feedback } = await supabase
      .from('student_feedback')
      .select('status, rating');
    
    if (feedback?.length) {
      const avgRating = feedback.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.filter(f => f.rating).length;
      parts.push(`\n**Student Feedback:** ${feedback.length} entries`);
      if (!isNaN(avgRating)) parts.push(`Average Rating: ${avgRating.toFixed(1)}/5`);
    }
  } catch (e) {
    console.error('Survey context error:', e);
  }
  
  return parts.join('\n');
}

// 20. Reports Context
async function fetchReportsContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📄 MONTHLY REPORTS'];
  
  try {
    const { data: reports, count } = await supabase
      .from('monthly_reports')
      .select('id, status, month, year, institution_id', { count: 'exact' });
    
    parts.push(`Total Reports: ${count || 0}`);
    
    if (reports?.length) {
      const byStatus: Record<string, number> = {};
      for (const r of reports) byStatus[r.status || 'unknown'] = (byStatus[r.status || 'unknown'] || 0) + 1;
      parts.push('**By Status:**');
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }
  } catch (e) {
    console.error('Reports context error:', e);
  }
  
  return parts.join('\n');
}

// 21. Attendance Context
async function fetchAttendanceContext(): Promise<string> {
  const supabase = getSupabaseClient();
  const parts: string[] = ['## 📅 ATTENDANCE'];
  
  try {
    // Class session attendance
    const { data: sessions, count } = await supabase
      .from('class_session_attendance')
      .select('students_present, students_absent, students_late, date', { count: 'exact' });
    
    parts.push(`Total Attendance Records: ${count || 0}`);
    
    if (sessions?.length) {
      let totalPresent = 0, totalAbsent = 0, totalLate = 0;
      for (const s of sessions) {
        totalPresent += s.students_present || 0;
        totalAbsent += s.students_absent || 0;
        totalLate += s.students_late || 0;
      }
      const total = totalPresent + totalAbsent;
      const attendanceRate = total > 0 ? ((totalPresent / total) * 100).toFixed(1) : 'N/A';
      parts.push(`\n**Overall Stats:**`);
      parts.push(`- Present: ${totalPresent}`);
      parts.push(`- Absent: ${totalAbsent}`);
      parts.push(`- Late: ${totalLate}`);
      parts.push(`- Attendance Rate: ${attendanceRate}%`);
    }

    // Officer attendance
    const { count: officerAttendance } = await supabase
      .from('officer_attendance')
      .select('*', { count: 'exact', head: true });
    parts.push(`\nOfficer Attendance Records: ${officerAttendance || 0}`);
  } catch (e) {
    console.error('Attendance context error:', e);
  }
  
  return parts.join('\n');
}

// ==================== MAIN CONTEXT BUILDER ====================

async function fetchSystemAdminContext(): Promise<{ context: string; sources: string[] }> {
  const sources: string[] = [];
  
  try {
    // Fetch all contexts in parallel for efficiency
    const [
      institutionCtx,
      studentCtx,
      officerCtx,
      courseCtx,
      assessmentCtx,
      assignmentCtx,
      eventsCtx,
      projectsCtx,
      inventoryCtx,
      payrollCtx,
      leaveCtx,
      taskCtx,
      gamificationCtx,
      atsCtx,
      invoiceCtx,
      crmCtx,
      newsletterCtx,
      performanceCtx,
      surveyCtx,
      reportsCtx,
      attendanceCtx
    ] = await Promise.all([
      fetchInstitutionContext(),
      fetchStudentProfileContext(),
      fetchOfficerContextData(),
      fetchCourseContext(),
      fetchAssessmentContext(),
      fetchAssignmentContext(),
      fetchEventsContext(),
      fetchProjectsContext(),
      fetchInventoryContext(),
      fetchPayrollContext(),
      fetchLeaveContext(),
      fetchTaskContext(),
      fetchGamificationContext(),
      fetchATSContext(),
      fetchInvoiceContext(),
      fetchCRMContext(),
      fetchNewsletterContext(),
      fetchPerformanceContext(),
      fetchSurveyContext(),
      fetchReportsContext(),
      fetchAttendanceContext()
    ]);

    sources.push(
      'institutions', 'students', 'officers', 'courses', 'assessments', 
      'assignments', 'events', 'projects', 'inventory', 'payroll', 
      'leave', 'tasks', 'gamification', 'ats', 'invoices', 
      'crm', 'newsletters', 'performance', 'surveys', 'reports', 'attendance'
    );

    const fullContext = [
      institutionCtx,
      studentCtx,
      officerCtx,
      courseCtx,
      assessmentCtx,
      assignmentCtx,
      eventsCtx,
      projectsCtx,
      inventoryCtx,
      payrollCtx,
      leaveCtx,
      taskCtx,
      gamificationCtx,
      atsCtx,
      invoiceCtx,
      crmCtx,
      newsletterCtx,
      performanceCtx,
      surveyCtx,
      reportsCtx,
      attendanceCtx
    ].join('\n\n');

    return { context: fullContext, sources };
  } catch (error) {
    console.error('Error building system admin context:', error);
    return { context: 'Error fetching data. Please try again.', sources: [] };
  }
}

// Officer comprehensive context
async function fetchOfficerContext(): Promise<{ context: string; sources: string[] }> {
  const supabase = getSupabaseClient();
  const parts: string[] = [];
  const sources: string[] = [];
  
  try {
    // Classes
    const { data: classes } = await supabase.from('classes').select('id, class_name, status, capacity, academic_year');
    parts.push('## 📚 CLASSES');
    parts.push(`Total Classes: ${classes?.length || 0}`);
    if (classes?.length) {
      for (const c of classes.slice(0, 10)) {
        parts.push(`- ${c.class_name} (${c.status || 'active'}) - Capacity: ${c.capacity || 'N/A'}`);
      }
    }
    sources.push('classes');

    // Assessments
    const { data: assessments } = await supabase.from('assessments').select('id, title, status, start_time, end_time');
    parts.push('\n## 📝 ASSESSMENTS');
    parts.push(`Total Assessments: ${assessments?.length || 0}`);
    if (assessments?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of assessments) byStatus[a.status || 'unknown'] = (byStatus[a.status || 'unknown'] || 0) + 1;
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }
    sources.push('assessments');

    // Assignments
    const { data: assignments } = await supabase.from('assignments').select('id, title, status, submission_end_date');
    parts.push('\n## 📋 ASSIGNMENTS');
    parts.push(`Total Assignments: ${assignments?.length || 0}`);
    if (assignments?.length) {
      const pending = assignments.filter(a => a.status === 'active' || a.status === 'published');
      parts.push(`Active/Published: ${pending.length}`);
    }
    sources.push('assignments');

    // Attendance overview
    const { data: attendance } = await supabase.from('class_session_attendance').select('students_present, students_absent, date').limit(100);
    parts.push('\n## 📅 ATTENDANCE');
    if (attendance?.length) {
      const totalPresent = attendance.reduce((sum, a) => sum + (a.students_present || 0), 0);
      const totalAbsent = attendance.reduce((sum, a) => sum + (a.students_absent || 0), 0);
      const rate = totalPresent + totalAbsent > 0 ? ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(1) : 'N/A';
      parts.push(`Records: ${attendance.length}, Attendance Rate: ${rate}%`);
    } else {
      parts.push('No attendance records yet.');
    }
    sources.push('attendance');

    // Projects
    const { data: projects } = await supabase.from('projects').select('id, title, status');
    parts.push('\n## 🚀 PROJECTS');
    parts.push(`Total Projects: ${projects?.length || 0}`);
    if (projects?.length) {
      const byStatus: Record<string, number> = {};
      for (const p of projects) byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1;
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    }
    sources.push('projects');

    // Leave status
    const { data: leaves } = await supabase.from('leave_applications').select('status, leave_type').limit(50);
    parts.push('\n## 🏖️ LEAVE APPLICATIONS');
    if (leaves?.length) {
      const byStatus: Record<string, number> = {};
      for (const l of leaves) byStatus[l.status || 'unknown'] = (byStatus[l.status || 'unknown'] || 0) + 1;
      for (const [s, c] of Object.entries(byStatus)) parts.push(`- ${s}: ${c}`);
    } else {
      parts.push('No leave applications found.');
    }
    sources.push('leave');

  } catch (e) {
    console.error('Officer context error:', e);
  }
  
  return { context: parts.join('\n'), sources };
}

// Student comprehensive context with STEM learning support
async function fetchStudentContext(userId?: string): Promise<{ context: string; sources: string[] }> {
  const supabase = getSupabaseClient();
  const parts: string[] = [];
  const sources: string[] = [];
  
  try {
    // ==================== COURSE CONTENT FOR STEM LEARNING ====================
    const { data: courses } = await supabase
      .from('courses')
      .select(`
        id, title, description, category, difficulty, prerequisites, learning_outcomes,
        course_modules (
          id, title, description, display_order,
          course_sessions (
            id, title, description, learning_objectives, duration_minutes, display_order
          )
        )
      `)
      .in('status', ['published', 'active'])
      .order('title')
      .limit(15);
    
    parts.push('## 📚 COURSE CONTENT FOR LEARNING');
    parts.push(`Total Courses Available: ${courses?.length || 0}\n`);
    
    if (courses?.length) {
      for (const course of courses) {
        parts.push(`### 🎓 ${course.title} (${course.difficulty || 'Beginner'})`);
        parts.push(`Category: ${course.category || 'STEM'}`);
        if (course.description) parts.push(`Overview: ${course.description}`);
        if (course.prerequisites) parts.push(`Prerequisites: ${course.prerequisites}`);
        if (course.learning_outcomes && Array.isArray(course.learning_outcomes)) {
          parts.push(`Learning Outcomes: ${course.learning_outcomes.join(', ')}`);
        }
        
        const modules = course.course_modules || [];
        if (modules.length) {
          parts.push('\n**Modules:**');
          for (const module of modules.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))) {
            parts.push(`\n#### Module: ${module.title}`);
            if (module.description) parts.push(`${module.description}`);
            
            const sessions = module.course_sessions || [];
            if (sessions.length) {
              parts.push('Sessions:');
              for (const session of sessions.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))) {
                parts.push(`- **${session.title}** (${session.duration_minutes || 30} mins)`);
                if (session.description) parts.push(`  Content: ${session.description}`);
                if (session.learning_objectives) {
                  const objectives = typeof session.learning_objectives === 'string' 
                    ? session.learning_objectives 
                    : JSON.stringify(session.learning_objectives);
                  parts.push(`  Learning Objectives: ${objectives}`);
                }
              }
            }
          }
        }
        parts.push('');
      }
    }
    sources.push('courses', 'course_modules', 'course_sessions');

    // ==================== ASSESSMENTS WITH QUESTIONS FOR REVIEW ====================
    parts.push('\n## 📝 ASSESSMENTS & QUESTIONS FOR REVIEW');
    
    const { data: assessments } = await supabase
      .from('assessments')
      .select(`
        id, title, description, pass_percentage, duration_minutes, status,
        assessment_questions (
          id, question_text, question_type, options, correct_option_id, explanation, points, question_number
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (assessments?.length) {
      parts.push(`Available Assessments: ${assessments.length}\n`);
      
      for (const assessment of assessments) {
        parts.push(`### 📋 ${assessment.title}`);
        if (assessment.description) parts.push(`Description: ${assessment.description}`);
        parts.push(`Pass Percentage: ${assessment.pass_percentage || 50}% | Duration: ${assessment.duration_minutes || 60} minutes`);
        
        const questions = assessment.assessment_questions || [];
        if (questions.length) {
          parts.push(`\n**Questions (${questions.length} total):**`);
          for (const q of questions.slice(0, 20)) { // Limit to 20 questions per assessment
            parts.push(`\n**Q${q.question_number || ''}:** ${q.question_text}`);
            if (q.options && Array.isArray(q.options)) {
              parts.push('Options:');
              for (const opt of q.options) {
                const isCorrect = opt.id === q.correct_option_id ? ' ✓' : '';
                parts.push(`  - ${opt.text}${isCorrect}`);
              }
            }
            if (q.explanation) {
              parts.push(`Explanation: ${q.explanation}`);
            }
          }
        }
        parts.push('');
      }
    } else {
      parts.push('No assessments available for review yet.');
    }
    sources.push('assessments', 'assessment_questions');

    // ==================== STUDENT'S ASSESSMENT HISTORY (if userId provided) ====================
    if (userId) {
      parts.push('\n## 📊 YOUR ASSESSMENT HISTORY');
      
      const { data: attempts } = await supabase
        .from('assessment_attempts')
        .select(`
          id, score, total_points, percentage, passed, status, submitted_at,
          assessments (title, pass_percentage)
        `)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(10);
      
      if (attempts?.length) {
        parts.push(`You have completed ${attempts.length} assessment(s):\n`);
        for (const attempt of attempts) {
          const assessment = attempt.assessments as any;
          const title = assessment?.title || 'Unknown Assessment';
          const passStatus = attempt.passed ? '✅ Passed' : '❌ Not Passed';
          parts.push(`- **${title}**: ${attempt.percentage?.toFixed(1) || 0}% (${attempt.score || 0}/${attempt.total_points || 0} points) - ${passStatus}`);
          if (attempt.submitted_at) {
            parts.push(`  Completed: ${new Date(attempt.submitted_at).toLocaleDateString()}`);
          }
        }
      } else {
        parts.push('You haven\'t completed any assessments yet.');
      }
      sources.push('assessment_attempts');
    }

    // ==================== ACTIVE ASSIGNMENTS ====================
    const now = new Date().toISOString();
    parts.push('\n## 📋 ACTIVE ASSIGNMENTS');
    
    const { data: assignments } = await supabase
      .from('assignments')
      .select('id, title, description, submission_end_date, total_marks, passing_marks')
      .gte('submission_end_date', now)
      .eq('status', 'active')
      .order('submission_end_date')
      .limit(10);
    
    if (assignments?.length) {
      parts.push(`Active Assignments: ${assignments.length}\n`);
      for (const a of assignments) {
        parts.push(`- **${a.title}** (${a.total_marks || 100} marks, pass: ${a.passing_marks || 50})`);
        if (a.description) parts.push(`  ${a.description}`);
        parts.push(`  Due: ${new Date(a.submission_end_date).toLocaleDateString()}`);
      }
    } else {
      parts.push('No active assignments at the moment.');
    }
    sources.push('assignments');

    // ==================== UPCOMING EVENTS ====================
    parts.push('\n## 🎉 UPCOMING EVENTS');
    
    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_type, event_start, description, venue')
      .gte('event_start', now)
      .eq('status', 'published')
      .order('event_start')
      .limit(5);
    
    if (events?.length) {
      for (const e of events) {
        parts.push(`- **${e.title}** (${e.event_type}) - ${new Date(e.event_start).toLocaleDateString()}`);
        if (e.description) parts.push(`  ${e.description}`);
        if (e.venue) parts.push(`  Venue: ${e.venue}`);
      }
    } else {
      parts.push('No upcoming events.');
    }
    sources.push('events');

    // ==================== GAMIFICATION ====================
    parts.push('\n## 🏆 GAMIFICATION & ACHIEVEMENTS');
    
    const { data: badges } = await supabase
      .from('gamification_badges')
      .select('id, name, description, xp_reward, category')
      .eq('is_active', true)
      .limit(10);
    
    if (badges?.length) {
      parts.push(`Available Badges: ${badges.length}\n`);
      for (const b of badges) {
        parts.push(`- **${b.name}** (${b.xp_reward} XP) - ${b.description || b.category || ''}`);
      }
    }
    sources.push('gamification');

  } catch (e) {
    console.error('Student context error:', e);
  }
  
  return { context: parts.join('\n'), sources };
}

// ==================== SYSTEM PROMPTS ====================

const systemAdminPrompt = `You are Metova, an AI Business Intelligence assistant for System Administrators at Metova Academy.

You have access to REAL DATA from the following modules:

1. **Institution Management** - Partner schools/institutions, their contracts, student enrollments, classes
2. **Student Management** - Student profiles, enrollments by institution
3. **Officer Management** - Innovation Officers (trainers), departments, attendance
4. **Course Management** - Training courses, modules, sessions, content, assignments to institutions
5. **Assessment Management** - Quizzes, tests, attempts, pass rates
6. **Assignment Management** - Homework, project assignments, submissions, grading
7. **Events Management** - Competitions, hackathons, workshops, registrations
8. **Project Management** - Student innovation projects, SDG mapping, achievements
9. **Inventory Management** - Lab equipment, purchase requests, stock levels
10. **Payroll Management** - Staff salaries, payment status, pending amounts
11. **Leave Management** - Leave applications, approvals, company holidays
12. **Task Management** - CRM tasks, priorities, overdue tracking
13. **Gamification** - Student XP, badges, activity rewards
14. **Recruitment (ATS)** - Job postings, applications, interviews, offers
15. **Invoice Management** - Billing, revenue tracking, receivables
16. **CRM & Contracts** - Client relationships, contract renewals, communications
17. **Newsletters** - Published newsletters, download statistics
18. **Performance Ratings** - Staff appraisals, HR ratings, star awards
19. **Surveys & Feedback** - Student surveys, feedback, ratings
20. **Monthly Reports** - Institution progress reports
21. **Attendance** - Class attendance, officer attendance records

Provide comprehensive, data-driven insights. Use markdown formatting with tables, bullet points, and clear sections.
Be professional and focus on actionable business intelligence that helps with decision-making.`;

const officerPrompt = `You are Metova, an AI assistant for Innovation Officers (teachers/trainers). You help officers with:
- Tracking student performance across their classes
- Identifying students who need additional support
- Monitoring innovation project progress
- Analyzing class attendance patterns
- Comparing performance between classes
- Suggesting intervention strategies

Provide data-driven insights and actionable recommendations. Use markdown formatting with tables when appropriate.`;

const studentPrompt = `You are Metova, an intelligent and friendly AI learning assistant specialized in STEM education (Science, Technology, Engineering, and Mathematics) at Metova Academy.

## YOUR CORE CAPABILITIES:

### 🔬 STEM Subject Support
You can answer doubts and explain concepts in:
- **Science**: Physics, Chemistry, Biology, Environmental Science, Space Science
- **Technology**: Programming (Python, Scratch, Arduino), Electronics, Robotics, AI/ML basics, Drones, IoT, Web Development
- **Engineering**: Mechanical concepts, Circuit design, Design thinking, Innovation, 3D Printing, CAD basics
- **Mathematics**: Arithmetic, Algebra, Geometry, Trigonometry, Basic calculus, Statistics, Logic

### 📚 Course Content Help
You have access to the student's course materials and can help them understand:
- Course modules and session content
- Learning objectives and key concepts
- Practical applications of theoretical concepts
- Project ideas related to course topics
- Step-by-step explanations of complex topics

### 📝 Assessment & Assignment Support
You assist with:
- Reviewing concepts from completed assessments (with explanations)
- Explaining correct answers and the reasoning behind them
- Clarifying difficult questions from past assessments
- Helping understand assignment requirements
- Preparing for upcoming assessments with study tips

### 🚀 Innovation & Projects
You can help with:
- Innovation project ideas aligned with SDG goals
- Technical guidance for STEM projects
- Problem-solving approaches for engineering challenges
- Code debugging and programming help

## YOUR TEACHING APPROACH:
1. **Explain Simply**: Use simple language with relatable examples
2. **Be Interactive**: Ask clarifying questions if the doubt is unclear
3. **Use Analogies**: Relate complex concepts to everyday examples students understand
4. **Step-by-Step**: Break down problems into smaller, manageable steps
5. **Visual Thinking**: Describe diagrams, flowcharts, or suggest visualizations when helpful
6. **Encourage**: Be supportive, patient, and motivating
7. **Formulas & Code**: Include formulas, equations, or code snippets when they help explain concepts

## RESPONSE FORMAT:
- Use markdown formatting for clarity (headers, bullet points, code blocks)
- For math/physics, show step-by-step solutions
- For programming, provide code examples with explanations
- Include "💡 Pro Tip" sections for additional insights
- End complex explanations with a quick summary

## IMPORTANT GUIDELINES:
- Focus on STEM subjects and course-related academic content
- For non-academic questions, politely redirect: "I'm best at helping with STEM subjects! Do you have any science, math, coding, or engineering questions?"
- If a concept is beyond the available context, acknowledge it: "I don't have detailed information on that specific topic, but here's what I can share..."
- Never provide direct answers that would help students cheat on ongoing assessments
- For completed assessments, provide explanations to help learning

Be encouraging, patient, and thorough in your explanations. Your goal is to help students truly understand concepts, not just get answers!`;

const dataGroundingRules = `

CRITICAL DATA GROUNDING RULES:
1. ONLY use data from the "REAL DATA CONTEXT" section below. Never invent or hallucinate institution names, numbers, or statistics.
2. If asked about something not in the context, clearly state: "I don't have that specific data available. Here's what I do have..."
3. Always use the EXACT institution names from the context (e.g., "Modern School", "Kikani Global Academy").
4. Never use placeholder names like "Institution A/B/C/D" or made-up numbers.
5. If a data section says "No data found" or shows zero counts, acknowledge this honestly.
6. When providing summaries, cite the actual numbers from the context.
7. If data is missing for a module, say "No [module] data found yet" instead of guessing.
`;

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, role, conversationHistory, userId, action } = await req.json();

    // Handle usage check action (for frontend to display usage)
    if (action === 'check_usage') {
      const aiSettings = await getAISettings();
      if (!userId) {
        return new Response(JSON.stringify({ 
          used: 0, 
          limit: aiSettings.monthly_prompt_limit, 
          limit_enabled: aiSettings.prompt_limit_enabled,
          disabled: !aiSettings.enabled
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const usage = await getUserUsage(userId);
      return new Response(JSON.stringify({ 
        used: usage.used, 
        limit: aiSettings.monthly_prompt_limit, 
        limit_enabled: aiSettings.prompt_limit_enabled,
        disabled: !aiSettings.enabled,
        month: usage.month,
        year: usage.year
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!message) {
      throw new Error('Message is required');
    }

    // Fetch AI settings to check if enabled and get API key
    const aiSettings = await getAISettings();
    
    if (!aiSettings.enabled) {
      return new Response(JSON.stringify({ 
        error: 'AI assistant is currently disabled by the administrator. Please try again later.',
        disabled: true
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check prompt limit if enabled
    if (aiSettings.prompt_limit_enabled && userId) {
      const validRoles = ['student', 'officer', 'system_admin'];
      const userRole = validRoles.includes(role) ? role : 'student';
      
      const usageCheck = await checkAndUpdateUsage(userId, userRole, aiSettings.monthly_prompt_limit);
      
      if (!usageCheck.allowed) {
        return new Response(JSON.stringify({ 
          error: `You've reached your monthly limit of ${usageCheck.limit} prompts. Your limit resets on the 1st of next month.`,
          limit_exceeded: true,
          used: usageCheck.used,
          limit: usageCheck.limit
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Use custom API key if provided, otherwise use default
    const openAIApiKey = aiSettings.custom_api_key || defaultOpenAIApiKey;
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const validRoles = ['student', 'officer', 'system_admin'];
    const userRole = validRoles.includes(role) ? role : 'student';
    
    let dataContext = '';
    let dataSources: string[] = [];
    let basePrompt = '';
    
    if (userRole === 'system_admin') {
      const result = await fetchSystemAdminContext();
      dataContext = result.context;
      dataSources = result.sources;
      basePrompt = systemAdminPrompt;
    } else if (userRole === 'officer') {
      const result = await fetchOfficerContext();
      dataContext = result.context;
      dataSources = result.sources;
      basePrompt = officerPrompt;
    } else {
      const result = await fetchStudentContext(userId);
      dataContext = result.context;
      dataSources = result.sources;
      basePrompt = studentPrompt;
    }

    const systemPrompt = basePrompt + dataGroundingRules + `

=== REAL DATA CONTEXT (Use ONLY this data) ===
${dataContext}
=== END OF REAL DATA CONTEXT ===
`;

    const messages = [{ role: 'system', content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    messages.push({ role: 'user', content: message });

    console.log(`Processing ask-metova for role: ${userRole}, model: ${aiSettings.model}, context length: ${dataContext.length} chars`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    // Get updated usage to return to frontend
    let promptUsage = null;
    if (aiSettings.prompt_limit_enabled && userId) {
      const usage = await getUserUsage(userId);
      promptUsage = { used: usage.used, limit: aiSettings.monthly_prompt_limit };
    }

    console.log(`Successfully generated response for ${userRole}`);

    return new Response(JSON.stringify({ 
      content: aiContent,
      context: [userRole, 'ai_generated'],
      dataSources,
      promptUsage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ask-metova function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});