import { supabase } from '@/integrations/supabase/client';

// Types matching database schema
export interface HRRatingProject {
  id: string;
  hr_rating_id: string;
  project_title: string;
  competition_level: string | null;
  result: string | null;
  stars_earned: number;
  verified_by_hr: boolean;
  verified_date: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface HRRating {
  id: string;
  trainer_id: string;
  trainer_name: string;
  employee_id: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  total_stars_quarter: number;
  cumulative_stars_year: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined projects
  project_ratings?: HRRatingProject[];
}

export type CreateHRRatingData = Omit<HRRating, 'id' | 'created_at' | 'updated_at' | 'project_ratings'> & {
  project_ratings?: Omit<HRRatingProject, 'id' | 'hr_rating_id' | 'created_at'>[];
};

export type UpdateHRRatingData = Partial<CreateHRRatingData>;

// Fetch all HR ratings with projects
export async function getHRRatings(): Promise<HRRating[]> {
  const { data: ratings, error } = await supabase
    .from('hr_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch projects for each rating
  const ratingIds = ratings.map(r => r.id);
  if (ratingIds.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from('hr_rating_projects')
    .select('*')
    .in('hr_rating_id', ratingIds);

  if (projectsError) throw projectsError;

  // Map projects to ratings
  return ratings.map(rating => ({
    ...rating,
    period: rating.period as HRRating['period'],
    project_ratings: (projects || []).filter(p => p.hr_rating_id === rating.id) as HRRatingProject[]
  })) as HRRating[];
}

// Get single HR rating by ID
export async function getHRRatingById(id: string): Promise<HRRating | null> {
  const { data: rating, error } = await supabase
    .from('hr_ratings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const { data: projects, error: projectsError } = await supabase
    .from('hr_rating_projects')
    .select('*')
    .eq('hr_rating_id', id);

  if (projectsError) throw projectsError;

  return {
    ...rating,
    period: rating.period as HRRating['period'],
    project_ratings: (projects || []) as HRRatingProject[]
  } as HRRating;
}

// Create new HR rating with projects
export async function createHRRating(data: CreateHRRatingData): Promise<HRRating> {
  const { project_ratings, ...ratingData } = data;

  // Calculate total stars from projects
  const totalStars = project_ratings?.reduce((sum, p) => sum + p.stars_earned, 0) || 0;

  const { data: rating, error } = await supabase
    .from('hr_ratings')
    .insert({
      trainer_id: ratingData.trainer_id,
      trainer_name: ratingData.trainer_name,
      employee_id: ratingData.employee_id,
      period: ratingData.period,
      year: ratingData.year,
      total_stars_quarter: totalStars,
      cumulative_stars_year: ratingData.cumulative_stars_year || totalStars,
      created_by: ratingData.created_by
    })
    .select()
    .single();

  if (error) throw error;

  // Insert projects if any
  if (project_ratings && project_ratings.length > 0) {
    const projectsToInsert = project_ratings.map(p => ({
      hr_rating_id: rating.id,
      project_title: p.project_title,
      competition_level: p.competition_level,
      result: p.result,
      stars_earned: p.stars_earned,
      verified_by_hr: p.verified_by_hr,
      verified_date: p.verified_date,
      verified_by: p.verified_by
    }));

    const { error: projectsError } = await supabase
      .from('hr_rating_projects')
      .insert(projectsToInsert);

    if (projectsError) throw projectsError;
  }

  // Update cumulative stars for the year
  await updateCumulativeStars(rating.trainer_id, rating.year);

  return getHRRatingById(rating.id) as Promise<HRRating>;
}

// Update HR rating with projects
export async function updateHRRating(id: string, data: UpdateHRRatingData): Promise<HRRating> {
  const { project_ratings, ...ratingData } = data;

  // Calculate total stars from projects if provided
  const totalStars = project_ratings?.reduce((sum, p) => sum + p.stars_earned, 0);

  const updatePayload: Record<string, unknown> = {};
  
  if (ratingData.trainer_id !== undefined) updatePayload.trainer_id = ratingData.trainer_id;
  if (ratingData.trainer_name !== undefined) updatePayload.trainer_name = ratingData.trainer_name;
  if (ratingData.employee_id !== undefined) updatePayload.employee_id = ratingData.employee_id;
  if (ratingData.period !== undefined) updatePayload.period = ratingData.period;
  if (ratingData.year !== undefined) updatePayload.year = ratingData.year;
  if (totalStars !== undefined) updatePayload.total_stars_quarter = totalStars;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from('hr_ratings')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
  }

  // Update projects if provided
  if (project_ratings !== undefined) {
    // Delete existing projects
    await supabase.from('hr_rating_projects').delete().eq('hr_rating_id', id);

    // Insert new projects
    if (project_ratings.length > 0) {
      const projectsToInsert = project_ratings.map(p => ({
        hr_rating_id: id,
        project_title: p.project_title,
        competition_level: p.competition_level,
        result: p.result,
        stars_earned: p.stars_earned,
        verified_by_hr: p.verified_by_hr,
        verified_date: p.verified_date,
        verified_by: p.verified_by
      }));

      const { error: projectsError } = await supabase
        .from('hr_rating_projects')
        .insert(projectsToInsert);

      if (projectsError) throw projectsError;
    }
  }

  // Get the rating to update cumulative stars
  const updatedRating = await getHRRatingById(id);
  if (updatedRating) {
    await updateCumulativeStars(updatedRating.trainer_id, updatedRating.year);
  }

  return getHRRatingById(id) as Promise<HRRating>;
}

// Delete HR rating (cascade deletes projects)
export async function deleteHRRating(id: string): Promise<void> {
  // Get the rating first to update cumulative stars after deletion
  const rating = await getHRRatingById(id);

  const { error } = await supabase
    .from('hr_ratings')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Update cumulative stars for the year
  if (rating) {
    await updateCumulativeStars(rating.trainer_id, rating.year);
  }
}

// Get ratings by trainer
export async function getRatingsByTrainer(trainerId: string): Promise<HRRating[]> {
  const { data: ratings, error } = await supabase
    .from('hr_ratings')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('year', { ascending: false })
    .order('period', { ascending: true });

  if (error) throw error;

  const ratingIds = ratings.map(r => r.id);
  if (ratingIds.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from('hr_rating_projects')
    .select('*')
    .in('hr_rating_id', ratingIds);

  if (projectsError) throw projectsError;

  return ratings.map(rating => ({
    ...rating,
    period: rating.period as HRRating['period'],
    project_ratings: (projects || []).filter(p => p.hr_rating_id === rating.id) as HRRatingProject[]
  })) as HRRating[];
}

// Get ratings by period and year
export async function getRatingsByPeriod(period: string, year: number): Promise<HRRating[]> {
  const { data: ratings, error } = await supabase
    .from('hr_ratings')
    .select('*')
    .eq('period', period)
    .eq('year', year)
    .order('trainer_name', { ascending: true });

  if (error) throw error;

  const ratingIds = ratings.map(r => r.id);
  if (ratingIds.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from('hr_rating_projects')
    .select('*')
    .in('hr_rating_id', ratingIds);

  if (projectsError) throw projectsError;

  return ratings.map(rating => ({
    ...rating,
    period: rating.period as HRRating['period'],
    project_ratings: (projects || []).filter(p => p.hr_rating_id === rating.id) as HRRatingProject[]
  })) as HRRating[];
}

// Calculate and update cumulative stars for a trainer in a year
export async function updateCumulativeStars(trainerId: string, year: number): Promise<void> {
  // Get all ratings for the trainer in the year
  const { data: ratings, error } = await supabase
    .from('hr_ratings')
    .select('id, total_stars_quarter')
    .eq('trainer_id', trainerId)
    .eq('year', year);

  if (error) throw error;

  // Calculate cumulative stars
  const cumulative = ratings.reduce((sum, r) => sum + r.total_stars_quarter, 0);

  // Update all ratings for this trainer/year with the new cumulative
  const { error: updateError } = await supabase
    .from('hr_ratings')
    .update({ cumulative_stars_year: cumulative })
    .eq('trainer_id', trainerId)
    .eq('year', year);

  if (updateError) throw updateError;
}

// Get cumulative stars for a trainer in a year
export async function getCumulativeStars(trainerId: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('hr_ratings')
    .select('total_stars_quarter')
    .eq('trainer_id', trainerId)
    .eq('year', year);

  if (error) throw error;

  return data.reduce((sum, r) => sum + r.total_stars_quarter, 0);
}

// Verify a project rating by HR
export async function verifyProjectRating(projectId: string, verifiedBy: string): Promise<void> {
  const { error } = await supabase
    .from('hr_rating_projects')
    .update({
      verified_by_hr: true,
      verified_date: new Date().toISOString(),
      verified_by: verifiedBy
    })
    .eq('id', projectId);

  if (error) throw error;
}
