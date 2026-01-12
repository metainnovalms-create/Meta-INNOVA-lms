export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context_used?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export const mockOfficerChatConversations: ChatConversation[] = [
  {
    id: 'officer-chat-1',
    title: 'Class 6A Performance Analysis',
    created_at: '2024-11-20T09:00:00Z',
    updated_at: '2024-11-20T09:15:00Z',
    messages: [
      {
        id: 'msg-o-1',
        role: 'user',
        content: 'How is Class 6A performing this month?',
        timestamp: '2024-11-20T09:00:00Z'
      },
      {
        id: 'msg-o-2',
        role: 'assistant',
        content: '**Class 6A Performance Summary (November 2024)**\n\n📊 **Overall Performance:**\n• Average Score: 78%\n• Class Rank: 3rd out of 8 sections\n• Students: 25 (22 active, 3 on leave)\n\n✅ **Strengths:**\n• High engagement in STEM projects (92%)\n• Good attendance rate (88%)\n• Strong performance in Math (avg 82%)\n\n⚠️ **Areas of Concern:**\n• 5 students below 60% average\n• Assignment submission rate: 76%\n• 3 students with attendance < 75%\n\n🎯 **Top Performers:**\n1. Aarav Sharma - 94%\n2. Ananya Verma - 91%\n3. Vivaan Gupta - 89%\n\n⚠️ **Students Needing Attention:**\n• Rahul Kumar (58%) - struggling with Math\n• Priya Singh (62%) - low assignment submission\n• Karthik Reddy (65%) - attendance issues\n\nWould you like detailed insights on any specific student or subject?',
        timestamp: '2024-11-20T09:00:45Z',
        context_used: ['class_performance', 'student_grades', 'attendance', 'assignments']
      }
    ]
  },
  {
    id: 'officer-chat-2',
    title: 'Innovation Projects Status',
    created_at: '2024-11-18T14:30:00Z',
    updated_at: '2024-11-18T14:50:00Z',
    messages: [
      {
        id: 'msg-o-3',
        role: 'user',
        content: 'Which students are currently working on innovation projects?',
        timestamp: '2024-11-18T14:30:00Z'
      },
      {
        id: 'msg-o-4',
        role: 'assistant',
        content: '**Active Innovation Projects (Kikani Global Academy)**\n\n📌 **Total Active Projects:** 12\n📌 **Students Involved:** 48 students\n📌 **SDG Goals Addressed:** 8 different goals\n\n---\n\n**🚀 On Track Projects (8):**\n\n1. **Smart Waste Segregation System**\n   • Team Lead: Aarav Sharma (Grade 6A)\n   • Members: 4 students\n   • Progress: 65%\n   • SDG Goal: 12 (Responsible Consumption)\n   • Next Milestone: Hardware testing (Dec 5)\n\n2. **Solar-Powered Water Purifier**\n   • Team Lead: Ananya Verma (Grade 7B)\n   • Members: 5 students\n   • Progress: 72%\n   • SDG Goal: 6 (Clean Water)\n   • Status: Prototype completed ✅\n\n3. **AI-Based Crop Disease Detection**\n   • Team Lead: Vivaan Gupta (Grade 8A)\n   • Members: 6 students\n   • Progress: 58%\n   • SDG Goal: 2 (Zero Hunger)\n\n---\n\n**⚠️ At-Risk Projects (4):**\n\n1. **Smart Traffic Management**\n   • Team Lead: Rahul Kumar (Grade 7A)\n   • Members: 4 students\n   • Progress: 28% (Behind schedule)\n   • Issue: Team coordination problems\n   • **Action Needed:** Mentor meeting scheduled\n\n2. **Eco-Friendly Packaging**\n   • Team Lead: Priya Singh (Grade 6B)\n   • Members: 3 students\n   • Progress: 15% (Delayed)\n   • Issue: Material procurement delays\n\n---\n\n**📊 Statistics:**\n• Average Progress: 54%\n• On-Time Projects: 67%\n• Student Engagement: High (92%)\n• Next Review Date: November 30\n\nWould you like detailed information about any specific project?',
        timestamp: '2024-11-18T14:31:00Z',
        context_used: ['projects', 'student_participation', 'sdg_goals']
      }
    ]
  },
  {
    id: 'officer-chat-3',
    title: 'Students Needing Attention',
    created_at: '2024-11-15T10:00:00Z',
    updated_at: '2024-11-15T10:20:00Z',
    messages: [
      {
        id: 'msg-o-5',
        role: 'user',
        content: 'Show me students across all my classes who need more attention',
        timestamp: '2024-11-15T10:00:00Z'
      },
      {
        id: 'msg-o-6',
        role: 'assistant',
        content: '**Students Requiring Additional Support**\n\n🔴 **Priority - Immediate Action (8 students)**\n\n1. **Rahul Kumar** (Grade 7A, Roll: 7A015)\n   • Academic: 58% (Below threshold)\n   • Attendance: 82%\n   • Concerns: Math & Science struggling\n   • Last Project: Not participating\n   • **Suggested Action:** One-on-one tutoring, parent meeting\n\n2. **Priya Singh** (Grade 6B, Roll: 6B023)\n   • Academic: 62%\n   • Attendance: 79%\n   • Concerns: Low assignment submission (45%)\n   • Engagement: Decreasing trend\n   • **Suggested Action:** Counseling session, peer mentor\n\n3. **Karthik Reddy** (Grade 8C, Roll: 8C012)\n   • Academic: 65%\n   • Attendance: 71% (Critical)\n   • Concerns: Frequent absences, disengagement\n   • **Suggested Action:** Parent conference, attendance intervention\n\n---\n\n🟡 **Moderate - Monitor Closely (15 students)**\n\n4. **Sneha Patel** (Grade 7B, Roll: 7B019)\n   • Academic: 68%\n   • Attendance: 85%\n   • Concerns: Recent performance drop\n   • Note: Was a strong performer (85%) until October\n   • **Suggested Action:** Check-in conversation\n\n5. **Arjun Mehta** (Grade 6A, Roll: 6A008)\n   • Academic: 70%\n   • Attendance: 88%\n   • Concerns: Project participation low\n   • **Suggested Action:** Encourage innovation club\n\n---\n\n📊 **Summary by Concern Type:**\n• Academic Performance: 18 students\n• Attendance Issues: 12 students\n• Low Engagement: 9 students\n• Project Non-participation: 7 students\n• Behavioral Concerns: 3 students\n\n**Recommended Actions:**\n1. Schedule parent-teacher meetings for Priority students\n2. Implement peer mentoring program\n3. Create targeted study groups for Math/Science\n4. Increase project engagement activities\n5. Regular check-ins (weekly for Priority, bi-weekly for Moderate)\n\nWould you like to see detailed intervention plans for specific students?',
        timestamp: '2024-11-15T10:01:30Z',
        context_used: ['student_performance', 'attendance', 'engagement_metrics', 'project_participation']
      }
    ]
  },
  {
    id: 'officer-chat-4',
    title: 'Top Performers Recognition',
    created_at: '2024-11-12T11:30:00Z',
    updated_at: '2024-11-12T11:45:00Z',
    messages: [
      {
        id: 'msg-o-7',
        role: 'user',
        content: 'Who are my top performing students?',
        timestamp: '2024-11-12T11:30:00Z'
      },
      {
        id: 'msg-o-8',
        role: 'assistant',
        content: '**Top 10 Students by Overall Performance**\n\n🏆 **Excellence Category (90%+)**\n\n1. **Aarav Sharma** - Grade 6A\n   • Overall: 94%\n   • Strengths: Math (96%), Science (95%), Innovation Projects\n   • Projects: Leading Smart Waste Segregation (65% complete)\n   • Attendance: 97%\n   • Recommendation: Advanced STEM program candidate\n\n2. **Ananya Verma** - Grade 7B\n   • Overall: 91%\n   • Strengths: Science (94%), English (92%), Leadership\n   • Projects: Solar Water Purifier - Prototype done ✅\n   • Attendance: 95%\n   • Recommendation: Science Olympiad team\n\n3. **Vivaan Gupta** - Grade 8A\n   • Overall: 89%\n   • Strengths: AI/ML (93%), Programming (91%)\n   • Projects: AI Crop Disease Detection\n   • Attendance: 93%\n   • Recommendation: Coding competition prep\n\n---\n\n⭐ **High Achievers (85-89%)**\n\n4. **Diya Kapoor** - Grade 7A (88%)\n5. **Aryan Malhotra** - Grade 6B (87%)\n6. **Ishita Rao** - Grade 8B (87%)\n7. **Rohan Chatterjee** - Grade 7C (86%)\n8. **Meera Iyer** - Grade 6A (86%)\n9. **Kabir Singh** - Grade 8A (85%)\n10. **Tanvi Desai** - Grade 7B (85%)\n\n---\n\n📈 **Recognition Opportunities:**\n• Monthly Star Student Awards: Top 3\n• Project Showcase: All innovation project leads\n• Peer Mentorship: Pair with students needing support\n• Advanced Courses: Recommend for next semester\n• Letter of Recognition: Send to parents\n\n**Engagement Stats:**\n• Average XP: 2,450 points\n• Badges Earned: 15-20 per student\n• Project Completion: 100%\n• Community Impact: High\n\nThese students exemplify excellence and can serve as peer mentors!',
        timestamp: '2024-11-12T11:31:15Z',
        context_used: ['student_grades', 'projects', 'attendance', 'gamification']
      }
    ]
  },
  {
    id: 'officer-chat-5',
    title: 'Class Comparison Analysis',
    created_at: '2024-11-10T15:00:00Z',
    updated_at: '2024-11-10T15:25:00Z',
    messages: [
      {
        id: 'msg-o-9',
        role: 'user',
        content: 'Compare performance between Grade 7A and Grade 7B',
        timestamp: '2024-11-10T15:00:00Z'
      },
      {
        id: 'msg-o-10',
        role: 'assistant',
        content: '**Grade 7 Sections Comparison (November 2024)**\n\n📊 **Overall Metrics:**\n\n| Metric | Grade 7A | Grade 7B | Winner |\n|--------|----------|----------|--------|\n| Average Score | 76% | 82% | 🏆 7B |\n| Attendance | 84% | 89% | 🏆 7B |\n| Project Participation | 68% | 85% | 🏆 7B |\n| Assignment Submission | 78% | 91% | 🏆 7B |\n| Students Count | 28 | 26 | - |\n\n---\n\n**📚 Subject-wise Breakdown:**\n\n**Mathematics:**\n• Grade 7A: 74% avg\n• Grade 7B: 80% avg\n• Analysis: 7B shows stronger foundational understanding\n\n**Science:**\n• Grade 7A: 78% avg\n• Grade 7B: 85% avg\n• Analysis: 7B has better lab participation\n\n**English:**\n• Grade 7A: 81% avg\n• Grade 7B: 83% avg\n• Analysis: Similar performance, both strong\n\n**Innovation Projects:**\n• Grade 7A: 2 active projects (1 at-risk)\n• Grade 7B: 3 active projects (all on-track)\n• Analysis: 7B demonstrates better project management\n\n---\n\n**🎯 Key Insights:**\n\n**Grade 7A Strengths:**\n• Creative thinking in English assignments\n• Individual excellence (3 students in top 10)\n• Strong peer relationships\n\n**Grade 7A Challenges:**\n• Lower engagement in group activities\n• 6 students below 60% threshold\n• Attendance consistency issues\n\n**Grade 7B Strengths:**\n• Exceptional teamwork and collaboration\n• High assignment completion rates\n• Strong STEM performance\n• Consistent attendance\n\n**Grade 7B Challenges:**\n• Less individual standout performers\n• Can improve creative/critical thinking\n\n---\n\n**💡 Recommendations:**\n\n**For Grade 7A:**\n1. Introduce collaborative learning activities\n2. Focus on Math fundamentals remediation\n3. Implement attendance improvement program\n4. Pair struggling students with peer mentors from 7B\n\n**For Grade 7B:**\n1. Introduce advanced problem-solving challenges\n2. Encourage individual leadership opportunities\n3. Maintain current strategies (they\'re working!)\n4. Consider as model class for new teaching methods\n\n**Cross-Section Activities:**\n• Joint innovation project competition\n• Inter-section study groups\n• Peer mentoring exchange program\n\nBoth sections have unique strengths - we can leverage them for mutual growth!',
        timestamp: '2024-11-10T15:02:30Z',
        context_used: ['class_analytics', 'subject_performance', 'attendance', 'projects']
      }
    ]
  },
  {
    id: 'officer-chat-6',
    title: 'Attendance Intervention Plan',
    created_at: '2024-11-08T10:15:00Z',
    updated_at: '2024-11-08T10:30:00Z',
    messages: [
      {
        id: 'msg-o-11',
        role: 'user',
        content: 'Which students have low attendance that I need to address?',
        timestamp: '2024-11-08T10:15:00Z'
      },
      {
        id: 'msg-o-12',
        role: 'assistant',
        content: '**Attendance Intervention Report (November 2024)**\n\n🔴 **Critical (<75% attendance) - 8 students**\n\n1. **Karthik Reddy** - Grade 8C\n   • Attendance: 71% (15 absences)\n   • Pattern: Frequent Monday/Friday absences\n   • Academic Impact: Grade dropped from 78% to 65%\n   • Action: Parent meeting scheduled Nov 9\n   • Reason: Medical issues (unverified)\n\n2. **Tanisha Mehta** - Grade 6B\n   • Attendance: 73% (14 absences)\n   • Pattern: Irregular, no clear pattern\n   • Academic Impact: Minimal (still at 82%)\n   • Action: Wellness check needed\n   • Reason: Family circumstances\n\n3. **Siddharth Jain** - Grade 7A\n   • Attendance: 72% (15 absences)\n   • Pattern: Extended absence (1 week)\n   • Academic Impact: Missed major assessment\n   • Action: Catch-up plan required\n   • Reason: Family travel\n\n---\n\n🟡 **At-Risk (75-80% attendance) - 12 students**\n\n4. **Priya Singh** - Grade 6B (79%)\n5. **Amit Kumar** - Grade 7C (78%)\n6. **Riya Gupta** - Grade 8A (77%)\n7. **Harsh Patel** - Grade 6A (76%)\n8. **Sneha Sharma** - Grade 7B (76%)\n\n---\n\n**📋 Intervention Strategy:**\n\n**Immediate Actions (This Week):**\n1. Send attendance alerts to parents of Critical students\n2. Schedule face-to-face meetings with parents\n3. Create makeup assignment plans for missed work\n4. Connect with school counselor for at-risk students\n\n**Short-term (2-4 weeks):**\n1. Weekly attendance monitoring\n2. Peer buddy system for reintegration\n3. Flexible catch-up sessions after school\n4. Identify and address root causes\n\n**Long-term Prevention:**\n1. Monthly attendance recognition program\n2. Early warning system (trigger at 85%)\n3. Parent communication portal for daily updates\n4. Attendance improvement incentives\n\n---\n\n**📊 Attendance Patterns Analysis:**\n\n**Most Common Reasons:**\n• Medical issues: 35%\n• Family circumstances: 28%\n• No reason provided: 22%\n• Transportation issues: 10%\n• Other: 5%\n\n**Day-wise Trends:**\n• Monday absences: Highest (32%)\n• Friday absences: Second highest (26%)\n• Mid-week: Lowest (14% average)\n\n**Impact on Performance:**\n• Students with <75% attendance average 12% lower grades\n• Strong correlation between attendance and project participation\n• Engagement drops significantly after 3+ consecutive absences\n\n---\n\n**✅ Success Stories:**\n\n**Arjun Reddy** - Improved from 68% to 88%\n• Intervention: Daily check-ins + parent partnership\n• Timeline: 6 weeks\n• Strategy can be replicated!\n\nWould you like me to draft communication templates for parents?',
        timestamp: '2024-11-08T10:17:45Z',
        context_used: ['attendance_records', 'student_performance', 'intervention_history']
      }
    ]
  }
];
