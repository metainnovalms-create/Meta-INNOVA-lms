import { InstitutionEvent } from '@/types/calendar';
import { mockEvents } from '@/data/mockCalendarData';

// Mock service for calendar operations
// In production, these would be API calls to the backend

export const calendarService = {
  // Get all events
  getEvents: async (): Promise<InstitutionEvent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockEvents]), 300);
    });
  },

  // Get events by institution
  getEventsByInstitution: async (institutionId: string): Promise<InstitutionEvent[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = mockEvents.filter(
          e => e.institution_id === institutionId || !e.institution_id
        );
        resolve(filtered);
      }, 300);
    });
  },

  // Create new event
  createEvent: async (event: InstitutionEvent): Promise<InstitutionEvent> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockEvents.push(event);
        resolve(event);
      }, 300);
    });
  },

  // Update existing event
  updateEvent: async (id: string, updates: Partial<InstitutionEvent>): Promise<InstitutionEvent> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEvents.findIndex(e => e.id === id);
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        mockEvents[index] = { ...mockEvents[index], ...updates };
        resolve(mockEvents[index]);
      }, 300);
    });
  },

  // Delete event
  deleteEvent: async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEvents.findIndex(e => e.id === id);
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        mockEvents.splice(index, 1);
        resolve();
      }, 300);
    });
  },

  // Move event (drag and drop)
  moveEvent: async (id: string, newStart: Date, newEnd: Date): Promise<InstitutionEvent> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEvents.findIndex(e => e.id === id);
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        mockEvents[index] = {
          ...mockEvents[index],
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
        };
        resolve(mockEvents[index]);
      }, 300);
    });
  },
};
