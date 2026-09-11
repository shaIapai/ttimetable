import * as XLSX from 'xlsx';
import { UniversalEvent, LessonType, ImportPreviewItem, ImportResult, FilterSettings } from '../types';

/**
 * Normalizes text: trims, removes excess inner whitespace and carriage returns
 */
export function cleanText(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps Russian month names to month numbers (0-indexed)
 */
const RU_MONTHS: Record<string, number> = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

/**
 * Parses Russian date strings such as:
 * "понедельник 7 сентября 2026", "понедельник, 7 сентября", "07.09.2026", "2026-09-07"
 */
export function parseDateString(raw: string, defaultYear = 2026): string | null {
  const text = cleanText(raw).toLowerCase();
  if (!text) return null;

  // Check ISO format YYYY-MM-DD
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Check DD.MM.YYYY or DD.MM
  const dotMatch = text.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0');
    const month = dotMatch[2].padStart(2, '0');
    let year = dotMatch[3] ? parseInt(dotMatch[3], 10) : defaultYear;
    if (year < 100) year += 2000;
    return `${year}-${month}-${day}`;
  }

  // Check textual date: e.g. "понедельник 7 сентября" or "7 сентября 2026"
  for (const [monthName, monthIndex] of Object.entries(RU_MONTHS)) {
    if (text.includes(monthName)) {
      // Find the day number preceding or near the month name
      const regex = new RegExp(`(\\d{1,2})\\s+${monthName}(?:\\s+(\\d{4}))?`);
      const match = text.match(regex);
      if (match) {
        const day = parseInt(match[1], 10);
        const year = match[2] ? parseInt(match[2], 10) : defaultYear;
        const mm = String(monthIndex + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }
  }

  return null;
}

/**
 * Normalizes time string e.g. "11:10–12:40" or "11:10 - 12:40" or "11.10-12.40"
 */
export function parseTimeInterval(raw: string): { startTime: string; endTime: string } | null {
  const text = cleanText(raw).replace(/\./g, ':');
  // Matches "HH:MM - HH:MM" or "HH:MM–HH:MM"
  const match = text.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  if (match) {
    const start = match[1].padStart(5, '0');
    const end = match[2].padStart(5, '0');
    return { startTime: start, endTime: end };
  }
  return null;
}

/**
 * Extracts subgroup number from text (e.g. "Подгруппа 4", "п/г 2", "1 подгруппа")
 */
export function extractSubgroup(text: string): string | undefined {
  const clean = text.toLowerCase();
  const patterns = [
    /подгрупп[аые]\s*([0-9]+)/i,
    /п\/г\s*([0-9]+)/i,
    /([0-9]+)\s*[-–]?\s*я?\s*подгрупп[аые]/i,
    /group\s*([0-9]+)/i,
  ];

  for (const pat of patterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      return m[1];
    }
  }

  return undefined;
}

/**
 * Detects lesson type (Lecture, Seminar, Practice, Lab, etc.)
 */
export function detectLessonType(text: string): { type: LessonType; label: string } {
  const lower = text.toLowerCase();

  if (lower.includes('лекция') || lower.includes('лек.')) {
    return { type: 'lecture', label: 'Лекция' };
  }
  if (lower.includes('семинар') || lower.includes('сем.')) {
    return { type: 'seminar', label: 'Семинар' };
  }
  if (lower.includes('практическ') || lower.includes('практика') || lower.includes('пр.')) {
    return { type: 'practice', label: 'Практическое занятие' };
  }
  if (lower.includes('лабораторн') || lower.includes('лаб.')) {
    return { type: 'lab', label: 'Лабораторная работа' };
  }
  if (lower.includes('консультация') || lower.includes('конс.')) {
    return { type: 'consultation', label: 'Консультация' };
  }
  if (lower.includes('зачет') || lower.includes('зачёт') || lower.includes('экзамен') || lower.includes('аттестация')) {
    return { type: 'exam', label: 'Аттестация / Экзамен' };
  }

  return { type: 'other', label: 'Занятие' };
}

/**
 * Cleans the subject title by removing extraneous prefixes like "Электив. Основная траектория."
 * and trailing lesson type / subgroup markers.
 */
export function cleanSubjectTitle(raw: string): { title: string; isElective: boolean } {
  let text = cleanText(raw);
  let isElective = false;

  if (/электив/i.test(text)) {
    isElective = true;
  }

  // Strip common university prefixes
  text = text.replace(/^электив[\.\s\-]+/i, '');
  text = text.replace(/^основная траектория[\.\s\-]+/i, '');
  text = text.replace(/^элективная дисциплина[\.\s\-]+/i, '');

  // Strip trailing lesson types if attached
  text = text.replace(/,\s*(лекция|семинар|практическое занятие|лабораторная работа).*$/i, '');
  // Strip trailing subgroup mentions
  text = text.replace(/\s*подгруппа\s*\d+.*$/i, '');
  text = text.replace(/\s*п\/г\s*\d+.*$/i, '');

  return {
    title: text.trim(),
    isElective,
  };
}

/**
 * Extracts room number and full address from location string
 * e.g., "Смольный проезд, д. 1, лит. Б, 138" -> location: "138", address: "Смольный проезд, д. 1, лит. Б"
 */
export function parseLocation(raw: string): { location: string; address: string } {
  const text = cleanText(raw);
  if (!text) return { location: '', address: '' };

  // Check if there is an explicit auditorium number, e.g. "ауд. 138", "комн. 204", "138"
  const audMatch = text.match(/(?:ауд(?:итория)?\.?\s*|комн(?:ата)?\.?\s*|пом(?:ещение)?\.?\s*)?([0-9]+[а-яА-Яa-zA-Z\-]*)/);
  
  // Look for room at the end or after comma
  const parts = text.split(',').map((s) => s.trim());
  let location = '';
  let address = text;

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (/^([0-9]+[а-яА-Яa-zA-Z\-]*|ауд\b|спортзал\b|актовый зал)/i.test(lastPart)) {
      location = lastPart.replace(/^ауд\.?\s*/i, '');
      address = parts.slice(0, parts.length - 1).join(', ');
    } else if (audMatch && audMatch[1]) {
      location = audMatch[1];
    }
  } else if (audMatch && audMatch[1]) {
    location = audMatch[1];
  }

  return { location, address };
}

/**
 * Creates unique signature for duplicate detection
 * (same date, time, title, room, teacher)
 */
export function createEventSignature(event: Partial<UniversalEvent>): string {
  const d = event.date || '';
  const st = event.startTime || '';
  const et = event.endTime || '';
  const title = (event.title || '').toLowerCase().trim();
  const room = (event.location || '').toLowerCase().trim();
  const teacher = (event.teacher || '').toLowerCase().trim();
  return `${d}|${st}-${et}|${title}|${room}|${teacher}`;
}

/**
 * Parses XLSX binary / arrayBuffer into structured events
 */
export function parseExcelWorkbook(
  data: ArrayBuffer | Uint8Array,
  fileName: string,
  userSettings: FilterSettings,
  existingNotesMap: Record<string, string> = {}
): ImportResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of rows
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

  let groupName = '';
  let dateRangeText = '';
  let lastKnownDate: string | null = null;
  const rawEvents: UniversalEvent[] = [];

  // Inspect first 10 rows for group name and date range
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const rowStr = rawRows[r].map(cleanText).join(' ');
    const groupMatch = rowStr.match(/(\d{2}\.[а-яА-Яa-zA-Z0-9\-]+)/);
    if (groupMatch && !groupName) {
      groupName = groupMatch[1];
    }
    const rangeMatch = rowStr.match(/(\d{1,2}\s+[а-яА-Я]+\s+\d{4}\s*[-–—]\s*\d{1,2}\s+[а-яА-Я]+\s+\d{4})/i);
    if (rangeMatch && !dateRangeText) {
      dateRangeText = rangeMatch[1];
    }
  }

  // Find header row or column indices
  // Standard columns: Дата | Время | Название | Места проведения | Преподаватели
  let dateCol = 0;
  let timeCol = 1;
  let titleCol = 2;
  let locationCol = 3;
  let teacherCol = 4;

  // Let's detect column indices by checking for headers
  for (let r = 0; r < Math.min(15, rawRows.length); r++) {
    const row = rawRows[r];
    for (let c = 0; c < row.length; c++) {
      const val = cleanText(row[c]).toLowerCase();
      if (val.includes('дата') || val.includes('день')) dateCol = c;
      if (val.includes('время') || val.includes('часы')) timeCol = c;
      if (val.includes('название') || val.includes('предмет') || val.includes('дисциплин')) titleCol = c;
      if (val.includes('мест') || val.includes('ауд') || val.includes('адрес')) locationCol = c;
      if (val.includes('преподават') || val.includes('фио')) teacherCol = c;
    }
  }

  // Iterate rows
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const dateCell = cleanText(row[dateCol]);
    const timeCell = cleanText(row[timeCol]);
    const titleCell = cleanText(row[titleCol]);
    const locationCell = cleanText(row[locationCol]);
    const teacherCell = cleanText(row[teacherCol]);

    // Check if this row contains a new date definition
    const parsedDate = parseDateString(dateCell);
    if (parsedDate) {
      lastKnownDate = parsedDate;
    }

    // Time cell check: is this a lesson row?
    const parsedTime = parseTimeInterval(timeCell);
    if (!parsedTime) {
      // Row might be a header or day separator without time
      continue;
    }

    // If we have a time but no date yet, skip or use default
    const eventDate = lastKnownDate || '2026-09-07';

    // Subgroup extraction
    const combinedText = `${titleCell} ${locationCell} ${teacherCell}`;
    const subgroup = extractSubgroup(combinedText);

    // Clean title and elective
    const { title, isElective } = cleanSubjectTitle(titleCell);
    if (!title) continue;

    // Lesson type
    const { type: lessonType, label: lessonTypeName } = detectLessonType(`${titleCell} ${locationCell}`);

    // Parse location & address
    const { location, address } = parseLocation(locationCell);

    // Existing note retention
    const signature = `${eventDate}|${parsedTime.startTime}-${parsedTime.endTime}|${title.toLowerCase()}`;
    const existingNote = existingNotesMap[signature] || '';

    const newEvent: UniversalEvent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title,
      date: eventDate,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      eventType: 'pair',
      lessonType,
      lessonTypeName,
      teacher: cleanText(teacherCell),
      location,
      address,
      subgroup,
      isElective,
      note: existingNote,
      reminder: 'none',
      source: 'imported',
      importedFrom: fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    rawEvents.push(newEvent);
  }

  // Deduplication
  const seenSignatures = new Set<string>();
  const deduplicatedEvents: UniversalEvent[] = [];
  let duplicatesCount = 0;

  for (const ev of rawEvents) {
    const sig = createEventSignature(ev);
    if (seenSignatures.has(sig)) {
      duplicatesCount++;
    } else {
      seenSignatures.add(sig);
      deduplicatedEvents.push(ev);
    }
  }

  // Build Preview Items with rules matching
  const previewItems: ImportPreviewItem[] = deduplicatedEvents.map((ev) => {
    let matchesRules = true;
    let reason = 'Подходит для расписания';

    // Rule 1: Subgroups
    if (ev.subgroup) {
      if (userSettings.mySubgroup && userSettings.mySubgroup !== 'all') {
        if (ev.subgroup !== userSettings.mySubgroup) {
          if (userSettings.hideOtherSubgroups) {
            matchesRules = false;
            reason = `Другая подгруппа (${ev.subgroup})`;
          }
        } else {
          reason = `Ваша подгруппа (${ev.subgroup})`;
        }
      }
    } else {
      reason = 'Общее занятие группы';
    }

    // Rule 2: Electives of other subgroups or all electives
    if (ev.isElective) {
      if (userSettings.hideElectives) {
        matchesRules = false;
        reason = 'Электив (скрыт правилом)';
      } else if (ev.subgroup && userSettings.mySubgroup && ev.subgroup !== userSettings.mySubgroup && userSettings.hideOtherElectives) {
        matchesRules = false;
        reason = `Электив другой подгруппы (${ev.subgroup})`;
      }
    }

    return {
      id: ev.id,
      event: ev,
      selected: matchesRules, // pre-select if matches user rules
      matchesUserRules: matchesRules,
      reason,
      hasExistingNote: Boolean(ev.note),
    };
  });

  return {
    fileName,
    groupName: groupName || '26.М16-мо',
    dateRangeText: dateRangeText || '7 сентября 2026 – 14 сентября 2026',
    totalFound: rawEvents.length,
    totalDuplicates: duplicatesCount,
    items: previewItems,
  };
}
