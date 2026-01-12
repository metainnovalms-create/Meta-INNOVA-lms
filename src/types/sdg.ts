export type SDGGoal = 
  | 'SDG1' | 'SDG2' | 'SDG3' | 'SDG4' | 'SDG5' | 'SDG6'
  | 'SDG7' | 'SDG8' | 'SDG9' | 'SDG10' | 'SDG11' | 'SDG12'
  | 'SDG13' | 'SDG14' | 'SDG15' | 'SDG16' | 'SDG17';

export interface SDGInfo {
  id: SDGGoal;
  number: number;
  title: string;
  description: string;
  color: string; // Official UN SDG color
  icon_url?: string;
}

export interface SDGMapping {
  entity_type: 'course' | 'project';
  entity_id: string;
  sdg_goals: SDGGoal[];
  mapped_at: string;
  mapped_by: string;
}

export interface SDGAnalytics {
  sdg_goal: SDGGoal;
  sdg_info: SDGInfo;
  course_count: number;
  project_count: number;
  total_students_impacted: number;
  total_officers_involved: number;
}
