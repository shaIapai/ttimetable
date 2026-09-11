import { UniversalEvent, FilterSettings } from '../types';
import { getInitialDemoEvents } from './demoData';
import { createEventSignature } from './excelParser';

const STORAGE_KEYS = {
  EVENTS: 'student_schedule_events_v1',
  SETTINGS: 'student_schedule_settings_v1',
  NOTES_MAP: 'student_schedule_notes_map_v1',
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

export interface MergeImportResult {
  events: UniversalEvent[];
  addedCount: number;
  updatedCount: number;
  preservedModificationsCount: number;
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
   * Load events from localStorage.
   */
  static getEvents(): UniversalEvent[] {
    try {
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

      // Update notes map for each event that has a note using canonical signature/importKey
      const map = this.getNotesMap();
      events.forEach((ev) => {
        if (ev.note) {
          const sig = ev.importKey || createEventSignature(ev);
          map[sig] = ev.note;
        }
      });
      localStorage.setItem(STORAGE_KEYS.NOTES_MAP, JSON.stringify(map));
    } catch (e) {
      console.error('Failed to save events to localStorage', e);
    }
  }

  /**
   * Merges imported events into the existing schedule:
   * 1. Preserves already existing weeks (e.g. week 1 + week 2).
   * 2. If an event is re-imported, does NOT create a duplicate (matches by stable importKey).
   * 3. Preserves user modifications (Requirement 5 & 6: manual edits, notes, reminders).
   */
  static mergeImportedEvents(incomingEvents: UniversalEvent[]): MergeImportResult {
    const existingEvents = this.getEvents();
    const existingByImportKey = new Map<string, UniversalEvent>();
    const existingBySignature = new Map<string, UniversalEvent>();

    // Index existing events by their stable importKey and by signature
    existingEvents.forEach((ev) => {
      if (ev.importKey) {
        existingByImportKey.set(ev.importKey, ev);
      }
      const sig = createEventSignature(ev);
      existingBySignature.set(sig, ev);
    });

    let addedCount = 0;
    let updatedCount = 0;
    let preservedModificationsCount = 0;

    const resultEvents = [...existingEvents];
    const notesMap = this.getNotesMap();

    incomingEvents.forEach((incoming) => {
      const incomingKey = incoming.importKey || createEventSignature(incoming);
      incoming.importKey = incomingKey;

      // Find existing match: first by stable importKey, then by signature fallback
      const existing = existingByImportKey.get(incomingKey) || existingBySignature.get(incomingKey);

      if (existing) {
        // Event already exists in schedule!
        const index = resultEvents.findIndex((e) => e.id === existing.id);
        if (index >= 0) {
          if (existing.isUserModified) {
            // Requirement 5 & 6: The student customized this event manually (room, time, title, note, reminder)
            // DO NOT overwrite user's modifications with Excel data!
            resultEvents[index] = {
              ...existing,
              importKey: existing.importKey || incomingKey,
            };
            preservedModificationsCount++;
          } else {
            // Unmodified event: update details from Excel while preserving notes, reminders, and ID
            resultEvents[index] = {
              ...incoming,
              id: existing.id,
              importKey: existing.importKey || incomingKey,
              note: existing.note || incoming.note || notesMap[incomingKey],
              reminder:
                existing.reminder && existing.reminder !== 'none'
                  ? existing.reminder
                  : incoming.reminder,
              isUserModified: false,
              updatedAt: new Date().toISOString(),
            };
            updatedCount++;
          }
        }
      } else {
        // Brand new event (e.g. newly imported week)
        const noteFromMap = notesMap[incomingKey];
        if (noteFromMap && !incoming.note) {
          incoming.note = noteFromMap;
        }
        resultEvents.push(incoming);
        existingByImportKey.set(incomingKey, incoming);
        addedCount++;
      }
    });

    this.saveEvents(resultEvents);

    return {
      events: resultEvents,
      addedCount,
      updatedCount,
      preservedModificationsCount,
    };
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
   * Clear all events (for empty state testing)
   */
  static clearAllEvents(): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  }

  /**
   * Load demo sample schedule
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
