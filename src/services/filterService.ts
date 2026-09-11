import { UniversalEvent, FilterSettings } from '../types';
import { createEventSignature } from './excelParser';

export class FilterService {
  /**
   * Filters events according to user filter settings and active search keyword
   */
  static filterEvents(
    events: UniversalEvent[],
    settings: FilterSettings,
    searchQuery = ''
  ): UniversalEvent[] {
    let result = [...events];

    // Filter personal events
    if (!settings.showPersonalEvents) {
      result = result.filter((e) => e.eventType === 'pair');
    }

    // Deduplication if enabled
    if (settings.hideDuplicates) {
      const seen = new Set<string>();
      result = result.filter((e) => {
        const sig = createEventSignature(e);
        if (seen.has(sig)) {
          return false;
        }
        seen.add(sig);
        return true;
      });
    }

    // Subgroup and Elective rules
    result = result.filter((e) => {
      // Non-pair events (personal, deadline, reminder) pass through
      if (e.eventType !== 'pair') return true;

      // Check electives
      if (e.isElective && settings.hideElectives) {
        return false;
      }

      // If user has chosen a specific subgroup (e.g. "4")
      if (settings.mySubgroup && settings.mySubgroup !== 'all') {
        // If lesson has a subgroup specified
        if (e.subgroup) {
          const isMySubgroup = e.subgroup.trim() === settings.mySubgroup.trim();

          // If it's another subgroup
          if (!isMySubgroup) {
            if (e.isElective && settings.hideOtherElectives) {
              return false;
            }
            if (settings.hideOtherSubgroups) {
              return false;
            }
          }
        }
      }

      return true;
    });

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        return (
          e.title.toLowerCase().includes(q) ||
          (e.teacher && e.teacher.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.address && e.address.toLowerCase().includes(q)) ||
          (e.note && e.note.toLowerCase().includes(q)) ||
          (e.lessonTypeName && e.lessonTypeName.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }

  /**
   * Returns list of unique subgroups found across all events
   */
  static getAvailableSubgroups(events: UniversalEvent[]): string[] {
    const subgroups = new Set<string>();
    events.forEach((e) => {
      if (e.subgroup) {
        subgroups.add(e.subgroup.trim());
      }
    });
    return Array.from(subgroups).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }

  /**
   * Sort events chronologically (date, then startTime)
   */
  static sortChronologically(events: UniversalEvent[]): UniversalEvent[] {
    return [...events].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }
}
