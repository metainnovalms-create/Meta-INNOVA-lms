import { OfficerTimetable, OfficerTimetableSlot } from '@/types/officer';

const OFFICER_TIMETABLE_KEY = 'officer_timetables';

// Initial mock data with correct officer IDs
const initialMockOfficerTimetables: OfficerTimetable[] = [
  {
    officer_id: 'off-msd-001', // Mr. Atif Ansari - Modern School Vasant Vihar
    total_hours: 18,
    status: 'assigned',
    last_updated: '2024-02-10',
    slots: [
      {
        id: 'slot-msd-1',
        officer_id: 'off-msd-001',
        day: 'Monday',
        start_time: '08:00',
        end_time: '08:45',
        class: 'Grade 8 - Section A',
        subject: 'STEM Workshop - Robotics Basics',
        room: 'Innovation Lab 1',
        type: 'workshop',
        batch: 'Batch A',
        course_id: 'STEM-101',
        current_module_id: 'mod-stem-1',
      },
      {
        id: 'slot-msd-2',
        officer_id: 'off-msd-001',
        day: 'Monday',
        start_time: '08:45',
        end_time: '09:30',
        class: 'Grade 9 - Section B',
        subject: 'STEM Lab - IoT Projects',
        room: 'Electronics Lab',
        type: 'lab',
        batch: 'Batch B',
        course_id: 'IoT-202',
        current_module_id: 'mod-iot-1',
      },
      {
        id: 'slot-msd-3',
        officer_id: 'off-msd-001',
        day: 'Monday',
        start_time: '10:30',
        end_time: '11:15',
        class: 'Grade 10 - Section A',
        subject: 'AI & Machine Learning Intro',
        room: 'Computer Lab',
        type: 'workshop',
      },
      {
        id: 'slot-msd-4',
        officer_id: 'off-msd-001',
        day: 'Tuesday',
        start_time: '08:00',
        end_time: '08:45',
        class: 'Grade 7 - Section A',
        subject: 'Design Thinking Fundamentals',
        room: 'Room 201',
        type: 'workshop',
      },
      {
        id: 'slot-msd-5',
        officer_id: 'off-msd-001',
        day: 'Tuesday',
        start_time: '08:45',
        end_time: '09:30',
        class: 'Grade 8 - Section B',
        subject: 'Arduino Programming',
        room: 'Electronics Lab',
        type: 'lab',
        batch: 'Batch A',
      },
      {
        id: 'slot-msd-6',
        officer_id: 'off-msd-001',
        day: 'Wednesday',
        start_time: '08:00',
        end_time: '08:45',
        class: 'Grade 9 - Section A',
        subject: 'Data Science Basics',
        room: 'Computer Lab',
        type: 'workshop',
      },
      {
        id: 'slot-msd-7',
        officer_id: 'off-msd-001',
        day: 'Wednesday',
        start_time: '09:30',
        end_time: '10:15',
        class: 'Grade 6 - Section A',
        subject: 'Introduction to Electronics',
        room: 'Innovation Lab 1',
        type: 'lab',
      },
      {
        id: 'slot-msd-8',
        officer_id: 'off-msd-001',
        day: 'Thursday',
        start_time: '08:45',
        end_time: '09:30',
        class: 'Grade 11 - Section A',
        subject: 'Advanced Robotics',
        room: 'Innovation Lab 1',
        type: 'workshop',
      },
      {
        id: 'slot-msd-9',
        officer_id: 'off-msd-001',
        day: 'Friday',
        start_time: '08:00',
        end_time: '08:45',
        class: 'Grade 12 - Section A',
        subject: 'Project Review - Innovation Showcase',
        room: 'Auditorium',
        type: 'project_review',
      },
    ],
  },
  {
    officer_id: 'off-kga-001', // Mr. Saran T - Kikani Global Academy (Senior)
    total_hours: 20,
    status: 'assigned',
    last_updated: '2024-02-10',
    slots: [
      {
        id: 'slot-kga-s-1',
        officer_id: 'off-kga-001',
        day: 'Monday',
        start_time: '08:30',
        end_time: '09:15',
        class: 'Grade 8 - Section A',
        subject: 'STEM Workshop - Mechanical Design',
        room: 'Engineering Lab',
        type: 'workshop',
      },
      {
        id: 'slot-kga-s-2',
        officer_id: 'off-kga-001',
        day: 'Monday',
        start_time: '09:15',
        end_time: '10:00',
        class: 'Grade 9 - Section A',
        subject: 'CAD Modeling Basics',
        room: 'Design Studio',
        type: 'lab',
      },
      {
        id: 'slot-kga-s-3',
        officer_id: 'off-kga-001',
        day: 'Tuesday',
        start_time: '08:30',
        end_time: '09:15',
        class: 'Grade 10 - Section A',
        subject: 'Automation Systems',
        room: 'Engineering Lab',
        type: 'workshop',
      },
      {
        id: 'slot-kga-s-4',
        officer_id: 'off-kga-001',
        day: 'Wednesday',
        start_time: '09:15',
        end_time: '10:00',
        class: 'Grade 8 - Section B',
        subject: 'Prototype Development',
        room: 'Workshop',
        type: 'mentoring',
      },
      {
        id: 'slot-kga-s-5',
        officer_id: 'off-kga-001',
        day: 'Thursday',
        start_time: '11:00',
        end_time: '11:45',
        class: 'Grade 11 - Section A',
        subject: 'Innovation Projects Review',
        room: 'Conference Hall',
        type: 'project_review',
      },
      {
        id: 'slot-kga-s-6',
        officer_id: 'off-kga-001',
        day: 'Saturday',
        start_time: '08:30',
        end_time: '09:15',
        class: 'Grade 12 - Section A',
        subject: 'Innovation Boot Camp',
        room: 'Auditorium',
        type: 'workshop',
      },
    ],
  },
  {
    officer_id: 'off-kga-002', // Mr. Sreeram R - Kikani Global Academy
    total_hours: 15,
    status: 'assigned',
    last_updated: '2024-02-10',
    slots: [
      {
        id: 'slot-kga-r-1',
        officer_id: 'off-kga-002',
        day: 'Tuesday',
        start_time: '10:15',
        end_time: '11:00',
        class: 'Grade 7 - Section B',
        subject: 'Basic Electronics',
        room: 'Physics Lab',
        type: 'lab',
        batch: 'Batch A',
      },
      {
        id: 'slot-kga-r-2',
        officer_id: 'off-kga-002',
        day: 'Thursday',
        start_time: '08:30',
        end_time: '09:15',
        class: 'Grade 9 - Section B',
        subject: 'Robotics Programming',
        room: 'Engineering Lab',
        type: 'workshop',
      },
      {
        id: 'slot-kga-r-3',
        officer_id: 'off-kga-002',
        day: 'Friday',
        start_time: '09:15',
        end_time: '10:00',
        class: 'Grade 6 - Section C',
        subject: 'Introduction to STEM',
        room: 'Room A-103',
        type: 'workshop',
      },
      {
        id: 'slot-kga-r-4',
        officer_id: 'off-kga-002',
        day: 'Wednesday',
        start_time: '10:15',
        end_time: '11:00',
        class: 'Grade 7 - Section C',
        subject: 'Sensors & Automation',
        room: 'Electronics Lab',
        type: 'lab',
        batch: 'Batch B',
      },
      {
        id: 'slot-kga-r-5',
        officer_id: 'off-kga-002',
        day: 'Friday',
        start_time: '12:30',
        end_time: '13:15',
        class: 'Grade 8 - Section C',
        subject: 'STEM Fair Preparation',
        room: 'Conference Room',
        type: 'project_review',
      },
    ],
  },
];

// localStorage functions
export function loadOfficerTimetables(): OfficerTimetable[] {
  try {
    const stored = localStorage.getItem(OFFICER_TIMETABLE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading officer timetables:', error);
  }
  // Initialize with mock data if not in localStorage
  saveOfficerTimetables(initialMockOfficerTimetables);
  return initialMockOfficerTimetables;
}

export function saveOfficerTimetables(timetables: OfficerTimetable[]): void {
  try {
    localStorage.setItem(OFFICER_TIMETABLE_KEY, JSON.stringify(timetables));
  } catch (error) {
    console.error('Error saving officer timetables:', error);
  }
}

export function getOfficerTimetable(officerId: string): OfficerTimetable | undefined {
  const timetables = loadOfficerTimetables();
  return timetables.find(t => t.officer_id === officerId);
}

export function saveOfficerTimetable(officerId: string, timetable: OfficerTimetable): void {
  const timetables = loadOfficerTimetables();
  const index = timetables.findIndex(t => t.officer_id === officerId);
  if (index !== -1) {
    timetables[index] = timetable;
  } else {
    timetables.push(timetable);
  }
  saveOfficerTimetables(timetables);
}

export function updateMockOfficerTimetable(
  officerId: string, 
  slots: OfficerTimetableSlot[]
): void {
  const timetables = loadOfficerTimetables();
  const totalHours = slots.reduce((acc, slot) => {
    const start = parseInt(slot.start_time.split(':')[0]) * 60 + parseInt(slot.start_time.split(':')[1]);
    const end = parseInt(slot.end_time.split(':')[0]) * 60 + parseInt(slot.end_time.split(':')[1]);
    return acc + (end - start) / 60;
  }, 0);
  
  const updatedTimetable: OfficerTimetable = {
    officer_id: officerId,
    slots,
    total_hours: Math.round(totalHours),
    status: slots.length > 0 ? 'assigned' : 'not_assigned',
    last_updated: new Date().toISOString(),
  };

  const index = timetables.findIndex(t => t.officer_id === officerId);
  if (index !== -1) {
    timetables[index] = updatedTimetable;
  } else {
    timetables.push(updatedTimetable);
  }
  
  saveOfficerTimetables(timetables);
}

export function getOfficerTimetablesByInstitution(institutionId: string): OfficerTimetable[] {
  const timetables = loadOfficerTimetables();
  // Filter by officer ID prefix based on institution
  if (institutionId === 'inst-msd-001') {
    return timetables.filter(t => t.officer_id.startsWith('off-msd'));
  } else if (institutionId === 'inst-kga-001') {
    return timetables.filter(t => t.officer_id.startsWith('off-kga'));
  }
  return [];
}

// Legacy export for backward compatibility
export const mockOfficerTimetables = initialMockOfficerTimetables;
