import { UniversalEvent, FilterSettings } from '../types';
import { getInitialDemoEvents } from './demoData';

const STORAGE_KEYS = {
  EVENTS: 'student_schedule_events_v1',
  SETTINGS: 'student_schedule_settings_v1',
  NOTES_MAP: 'student_schedule_notes_map_v1',
  HAS_INITIALIZED: 'student_schedule_initialized_v1',
};

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  mySubgroup: '4',
  hideOtherSubgroups: true,
  hideElectives: false,
  hideOtherElectives: true,
  hideDuplicates: true,
  showPersonalEvents: true,
  timeRangeStart: 8,
  timeRangeEnd: 20,
};

/**
 * Creates note signature to preserve user notes across Excel re-imports
 */
export function getNoteSignature(event: Partial<UniversalEvent>): string {
  const date = event.date || '';
  const time = event.startTime || '';
  const title = (event.title || '').trim().toLowerCase();
  return `${date}|${time}|${title}`;
}

export class StorageService {
  /**
   * Load filter and user preferences
   */
  static getSettings(): FilterSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_FILTER_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    return DEFAULT_FILTER_SETTINGS;
  }

  /**
   * Save filter and user preferences
   */
  static saveSettings(settings: FilterSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  /**
   * Get all persistent notes mapping: signature -> note text
   */
  static getNotesMap(): Record<string, string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTES_MAP);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse notes map', e);
    }
    return {};
  }

  /**
   * Update or remove a note in persistent map
   */
  static setNote(signature: string, note: string): void {
    try {
      const map = this.getNotesMap();
      if (note.trim()) {
        map[signature] = note.trim();
      } else {
        delete map[signature];
      }
      localStorage.setItem(STORAGE_KEYS.NOTES_MAP, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to update notes map', e);
    }
  }

  /**
   * Load events from localStorage. On first launch, initializes with demo events
   */
  static getEvents(): UniversalEvent[] {
    try {
      const initialized = localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED);
      if (!initialized) {
        // First run initialization with realistic timetable 26.М16-мо
        const demoEvents = getInitialDemoEvents();
        this.saveEvents(demoEvents);
        localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, 'true');
        return demoEvents;
      }

      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load events from localStorage', e);
    }
    return [];
  }

  /**
   * Save events list to localStorage and update persistent notes map
   */
  static saveEvents(events: UniversalEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));

      // Update notes map for each event that has a note
      const map = this.getNotesMap();
      events.forEach((ev) => {
        if (ev.note) {
          const sig = getNoteSignature(ev);
          map[sig] = ev.note;
        }
      });
      localStorage.setItem(STORAGE_KEYS.NOTES_MAP, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }

  /**
   * Save or update a single event
   */
  static upsertEvent(event: UniversalEvent): UniversalEvent[] {
    const events = this.getEvents();
    const index = events.findIndex((e) => e.id === event.id);

    event.updatedAt = new Date().toISOString();
    if (!event.createdAt) {
      event.createdAt = event.updatedAt;
    }

    if (index >= 0) {
      events[index] = event;
    } else {
      events.push(event);
    }

    this.saveEvents(events);
    return events;
  }

  /**
   * Delete an event by ID
   */
  static deleteEvent(id: string): UniversalEvent[] {
    const events = this.getEvents().filter((e) => e.id !== id);
    this.saveEvents(events);
    return events;
  }

  /**
   * Clear all events (testing empty state)
   */
  static clearAllEvents(): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  }

  /**
   * Reset to initial 26.М16-мо sample schedule
   */
  static resetToDemo(): UniversalEvent[] {
    const demo = getInitialDemoEvents();
    this.saveEvents(demo);
    this.saveSettings(DEFAULT_FILTER_SETTINGS);
    return demo;
  }

  /**
   * Export all data as JSON
   */
  static exportBackup(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      notesMap: this.getNotesMap(),
      events: this.getEvents(),
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import data from JSON backup
   */
  static importBackup(jsonString: string): { success: boolean; count: number } {
    try {
      const payload = JSON.parse(jsonString);
      if (Array.isArray(payload.events)) {
        if (payload.settings) {
          this.saveSettings({ ...DEFAULT_FILTER_SETTINGS, ...payload.settings });
        }
        if (payload.notesMap) {
          localStorage.setItem(STORAGE_KEYS.NOTES_MAP, JSON.stringify(payload.notesMap));
        }
        this.saveEvents(payload.events);
        return { success: true, count: payload.events.length };
      }
    } catch (e) {
      console.error('Failed to import backup', e);
    }
    return { success: false, count: 0 };
  }
}
