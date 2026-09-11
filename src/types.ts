export type EventType = 'pair' | 'personal' | 'deadline' | 'reminder';

export type LessonType = 
  | 'lecture'        // Лекция
  | 'seminar'        // Семинар
  | 'practice'       // Практическое занятие
  | 'lab'            // Лабораторная работа
  | 'consultation'   // Консультация
  | 'exam'           // Зачет / Экзамен
  | 'other';         // Другое

export type ReminderOption = 'none' | '10min' | '30min' | '1hour' | '1day';

export type EventSource = 'imported' | 'manual';

export interface UniversalEvent {
  id: string;
  title: string;
  date: string; // ISO date format: YYYY-MM-DD
  startTime: string; // HH:mm format, e.g. "11:10"
  endTime: string; // HH:mm format, e.g. "12:40"
  eventType: EventType;
  lessonType?: LessonType;
  lessonTypeName?: string; // Russian display name e.g. "Лекция", "Практическое занятие"
  teacher?: string;
  location?: string; // Room / auditorium, e.g. "138"
  address?: string; // Full address, e.g. "Смольный проезд, д. 1, лит. Б"
  subgroup?: string; // e.g. "4", "1", "2" or empty if for whole group
  isElective?: boolean;
  note?: string;
  reminder?: ReminderOption;
  source: EventSource;
  isUserModified?: boolean; // Set to true if manually edited by the user
  importedFrom?: string; // e.g. "Расписание_26.М16-мо_07-14_сент.xlsx"
  createdAt: string;
  updatedAt: string;
  color?: string;
  hasDateError?: boolean;
  dateErrorMessage?: string;
}

export interface FilterSettings {
  mySubgroup: string; // e.g. "4"
  hideOtherSubgroups: boolean; // hide lessons of subgroups != mySubgroup
  hideElectives: boolean; // hide all electives
  hideOtherElectives: boolean; // hide electives that belong to other subgroups
  hideDuplicates: boolean; // deduplicate matching pairs
  showPersonalEvents: boolean;
  timeRangeStart: number; // e.g. 8 (08:00)
  timeRangeEnd: number; // e.g. 21 (21:00)
}

export interface ImportPreviewItem {
  id: string;
  event: UniversalEvent;
  selected: boolean;
  matchesUserRules: boolean;
  reason?: string;
  isDuplicate?: boolean;
  hasExistingNote?: boolean;
  hasDateError?: boolean;
}

export interface ImportResult {
  fileName: string;
  groupName?: string;
  dateRangeText?: string;
  totalFound: number;
  recognizedCount: number;
  totalDuplicates: number;
  hasDateErrors: boolean;
  items: ImportPreviewItem[];
}

export type CalendarViewMode = 'week' | 'day' | 'month' | 'list';
