/**
 * Company Office GPS Configuration
 * Used for validating meta staff check-in/check-out locations
 */

export interface CompanyOfficeGPS {
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  address: string;
}

export const companyOfficeGPS: CompanyOfficeGPS = {
  name: 'Meta-Innova Head Office',
  latitude: 28.6139, // Connaught Place, New Delhi
  longitude: 77.2090,
  radius_meters: 100, // 100 meters radius for office building
  address: 'Connaught Place, New Delhi - 110001',
};

/**
 * Working hours configuration for meta staff
 */
export const companyWorkingHours = {
  normal_hours_per_day: 8,
  overtime_multiplier: 1.5,
  check_in_start_time: '08:00',
  check_in_end_time: '20:00',
};
