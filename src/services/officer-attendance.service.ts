/**
 * Officer Attendance Service - Supabase Integration
 * Handles GPS-based check-in/check-out for officers with database persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, getAddressFromCoordinates } from '@/utils/locationHelpers';

export interface OfficerAttendanceRecord {
  id: string;
  officer_id: string;
  institution_id: string;
  date: string;
  check_in_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_address: string | null;
  check_in_distance_meters: number | null;
  check_in_validated: boolean | null;
  check_out_time: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_address: string | null;
  check_out_distance_meters: number | null;
  check_out_validated: boolean | null;
  total_hours_worked: number | null;
  overtime_hours: number | null;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckInParams {
  officer_id: string;
  institution_id: string;
  latitude: number;
  longitude: number;
  institution_latitude: number;
  institution_longitude: number;
  attendance_radius_meters: number;
  skip_gps?: boolean;
}

export interface CheckOutParams {
  officer_id: string;
  institution_id: string;
  latitude: number;
  longitude: number;
  institution_latitude: number;
  institution_longitude: number;
  attendance_radius_meters: number;
  normal_working_hours: number;
  skip_gps?: boolean;
}

export interface InstitutionGPSSettings {
  id: string;
  name: string;
  gps_location: {
    latitude: number;
    longitude: number;
  } | null;
  attendance_radius_meters: number;
  check_in_time: string;
  check_out_time: string;
  normal_working_hours: number;
}

/**
 * Get institution GPS settings for attendance validation
 * Reads GPS from address.gps_location (primary) or settings.gps_location (fallback)
 */
export const getInstitutionGPSSettings = async (institutionId: string): Promise<InstitutionGPSSettings | null> => {
  const { data, error } = await supabase
    .from('institutions')
    .select('id, name, settings, address')
    .eq('id', institutionId)
    .single();

  if (error || !data) {
    console.error('Error fetching institution GPS settings:', error);
    return null;
  }

  const settings = data.settings as Record<string, unknown> || {};
  const address = data.address as Record<string, unknown> || {};
  
  // Try to get GPS from address first (set during institution creation), then fallback to settings
  const addressGps = address.gps_location as { latitude: number; longitude: number } | undefined;
  const settingsGps = settings.gps_location as { latitude: number; longitude: number } | undefined;
  const gpsLocation = addressGps || settingsGps || null;
  
  // Get attendance radius from address first, then settings
  const addressRadius = address.attendance_radius_meters as number | undefined;
  const settingsRadius = settings.attendance_radius_meters as number | undefined;
  const attendanceRadius = addressRadius || settingsRadius || 1500;

  return {
    id: data.id,
    name: data.name,
    gps_location: gpsLocation,
    attendance_radius_meters: attendanceRadius,
    check_in_time: (settings.check_in_time as string) || '09:00',
    check_out_time: (settings.check_out_time as string) || '17:00',
    normal_working_hours: (settings.normal_working_hours as number) || 8,
  };
};

/**
 * Create auto-generated overtime request
 */
const createAutoOvertimeRequest = async (
  officerId: string,
  institutionId: string,
  date: string,
  overtimeHours: number,
  attendanceId: string
): Promise<void> => {
  try {
    // Get officer details for the request
    const { data: officer } = await supabase
      .from('officers')
      .select('user_id, full_name, hourly_rate, overtime_rate_multiplier')
      .eq('id', officerId)
      .single();

    if (!officer) return;

    const overtimeRate = officer.overtime_rate_multiplier || 1.5;
    const hourlyRate = officer.hourly_rate || 0;
    const calculatedPay = overtimeHours * hourlyRate * overtimeRate;

    await supabase.from('overtime_requests').insert({
      user_id: officer.user_id,
      user_type: 'officer',
      officer_id: officerId,
      institution_id: institutionId,
      date: date,
      requested_hours: Math.round(overtimeHours * 100) / 100,
      reason: 'Auto-generated: Extended work hours beyond tolerance',
      status: 'pending',
      overtime_rate: overtimeRate,
      calculated_pay: Math.round(calculatedPay * 100) / 100,
      source: 'auto_generated',
      attendance_id: attendanceId,
    });
  } catch (error) {
    console.error('Error creating auto overtime request:', error);
  }
};

/**
 * Get officer's today attendance record
 */
export const getOfficerTodayAttendance = async (
  officerId: string,
  institutionId: string
): Promise<OfficerAttendanceRecord | null> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('officer_attendance')
    .select('*')
    .eq('officer_id', officerId)
    .eq('institution_id', institutionId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching today attendance:', error);
    return null;
  }

  return data as OfficerAttendanceRecord | null;
};

/**
 * Record officer check-in with GPS validation
 */
export const recordCheckIn = async (params: CheckInParams): Promise<{
  success: boolean;
  validated: boolean;
  distance: number;
  record?: OfficerAttendanceRecord;
  error?: string;
}> => {
  const today = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toISOString();

  // If GPS is skipped, record without location validation
  if (params.skip_gps) {
    const { data, error } = await supabase
      .from('officer_attendance')
      .upsert({
        officer_id: params.officer_id,
        institution_id: params.institution_id,
        date: today,
        check_in_time: checkInTime,
        check_in_latitude: null,
        check_in_longitude: null,
        check_in_address: null,
        check_in_distance_meters: null,
        check_in_validated: null,
        status: 'checked_in',
      }, {
        onConflict: 'officer_id,institution_id,date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording check-in:', error);
      return { success: false, validated: false, distance: 0, error: error.message };
    }

    return {
      success: true,
      validated: false,
      distance: 0,
      record: data as OfficerAttendanceRecord,
    };
  }

  // Calculate distance from institution
  const distance = calculateDistance(
    params.latitude,
    params.longitude,
    params.institution_latitude,
    params.institution_longitude
  );

  const isValidated = distance <= params.attendance_radius_meters;

  // Try to get address (non-blocking)
  let address: string | null = null;
  try {
    address = await getAddressFromCoordinates(params.latitude, params.longitude);
  } catch (e) {
    console.warn('Could not fetch address:', e);
  }

  // Insert or update (upsert) the attendance record
  const { data, error } = await supabase
    .from('officer_attendance')
    .upsert({
      officer_id: params.officer_id,
      institution_id: params.institution_id,
      date: today,
      check_in_time: checkInTime,
      check_in_latitude: params.latitude,
      check_in_longitude: params.longitude,
      check_in_address: address,
      check_in_distance_meters: Math.round(distance),
      check_in_validated: isValidated,
      status: 'checked_in',
    }, {
      onConflict: 'officer_id,institution_id,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording check-in:', error);
    return { success: false, validated: false, distance, error: error.message };
  }

  return {
    success: true,
    validated: isValidated,
    distance: Math.round(distance),
    record: data as OfficerAttendanceRecord,
  };
};

/**
 * Record officer check-out with GPS validation
 */
export const recordCheckOut = async (params: CheckOutParams): Promise<{
  success: boolean;
  validated: boolean;
  distance: number;
  hoursWorked: number;
  overtimeHours: number;
  record?: OfficerAttendanceRecord;
  error?: string;
}> => {
  const today = new Date().toISOString().split('T')[0];
  const checkOutTime = new Date().toISOString();

  // Get existing record to calculate hours
  const existingRecord = await getOfficerTodayAttendance(params.officer_id, params.institution_id);
  
  if (!existingRecord || existingRecord.status !== 'checked_in') {
    return {
      success: false,
      validated: false,
      distance: 0,
      hoursWorked: 0,
      overtimeHours: 0,
      error: 'No check-in record found for today',
    };
  }

  // Calculate hours worked
  const checkInDate = new Date(existingRecord.check_in_time!);
  const checkOutDate = new Date(checkOutTime);
  const hoursWorked = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
  
  // Tolerance: 15 minutes after expected checkout time before counting as overtime
  const TOLERANCE_MINUTES = 15;
  const toleranceHours = TOLERANCE_MINUTES / 60;
  const overtimeHours = Math.max(0, hoursWorked - params.normal_working_hours - toleranceHours);
  const hasOvertime = overtimeHours > 0;

  // If GPS is skipped, record without location validation
  if (params.skip_gps) {
    const { data, error } = await supabase
      .from('officer_attendance')
      .update({
        check_out_time: checkOutTime,
        check_out_latitude: null,
        check_out_longitude: null,
        check_out_address: null,
        check_out_distance_meters: null,
        check_out_validated: null,
        total_hours_worked: Math.round(hoursWorked * 100) / 100,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        overtime_auto_generated: hasOvertime,
        status: 'checked_out',
      })
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (error) {
      console.error('Error recording check-out:', error);
      return {
        success: false,
        validated: false,
        distance: 0,
        hoursWorked: 0,
        overtimeHours: 0,
        error: error.message,
      };
    }

    // Auto-create overtime request if overtime detected
    if (hasOvertime && data) {
      await createAutoOvertimeRequest(
        existingRecord.officer_id,
        params.institution_id,
        today,
        overtimeHours,
        existingRecord.id
      );
    }

    return {
      success: true,
      validated: false,
      distance: 0,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      record: data as OfficerAttendanceRecord,
    };
  }

  // Calculate distance from institution
  const distance = calculateDistance(
    params.latitude,
    params.longitude,
    params.institution_latitude,
    params.institution_longitude
  );

  const isValidated = distance <= params.attendance_radius_meters;

  // Try to get address (non-blocking)
  let address: string | null = null;
  try {
    address = await getAddressFromCoordinates(params.latitude, params.longitude);
  } catch (e) {
    console.warn('Could not fetch address:', e);
  }

  // Update the attendance record
  const { data, error } = await supabase
    .from('officer_attendance')
    .update({
      check_out_time: checkOutTime,
      check_out_latitude: params.latitude,
      check_out_longitude: params.longitude,
      check_out_address: address,
      check_out_distance_meters: Math.round(distance),
      check_out_validated: isValidated,
      total_hours_worked: Math.round(hoursWorked * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      overtime_auto_generated: hasOvertime,
      status: 'checked_out',
    })
    .eq('id', existingRecord.id)
    .select()
    .single();

  if (error) {
    console.error('Error recording check-out:', error);
    return {
      success: false,
      validated: false,
      distance,
      hoursWorked: 0,
      overtimeHours: 0,
      error: error.message,
    };
  }

  // Auto-create overtime request if overtime detected
  if (hasOvertime && data) {
    await createAutoOvertimeRequest(
      existingRecord.officer_id,
      params.institution_id,
      today,
      overtimeHours,
      existingRecord.id
    );
  }

  return {
    success: true,
    validated: isValidated,
    distance: Math.round(distance),
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    record: data as OfficerAttendanceRecord,
  };
};

/**
 * Get officer's monthly attendance records
 */
export const getOfficerMonthlyAttendance = async (
  officerId: string,
  month: string // yyyy-MM
): Promise<OfficerAttendanceRecord[]> => {
  const startDate = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('officer_attendance')
    .select('*')
    .eq('officer_id', officerId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching monthly attendance:', error);
    return [];
  }

  return (data || []) as OfficerAttendanceRecord[];
};

/**
 * Get all officer attendance for an institution in a month
 */
export const getInstitutionMonthlyAttendance = async (
  institutionId: string,
  month: string // yyyy-MM
): Promise<OfficerAttendanceRecord[]> => {
  const startDate = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('officer_attendance')
    .select('*')
    .eq('institution_id', institutionId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching institution attendance:', error);
    return [];
  }

  return (data || []) as OfficerAttendanceRecord[];
};

/**
 * Get all officer attendance records for a month (CEO view)
 */
export const getAllOfficerAttendanceForMonth = async (
  month: string // yyyy-MM
): Promise<OfficerAttendanceRecord[]> => {
  const startDate = `${month}-01`;
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('officer_attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all attendance:', error);
    return [];
  }

  return (data || []) as OfficerAttendanceRecord[];
};

/**
 * Get today's attendance for all officers (CEO view)
 */
export const getAllTodayAttendance = async (): Promise<OfficerAttendanceRecord[]> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('officer_attendance')
    .select('*')
    .eq('date', today)
    .order('check_in_time', { ascending: true });

  if (error) {
    console.error('Error fetching today attendance:', error);
    return [];
  }

  return (data || []) as OfficerAttendanceRecord[];
};
