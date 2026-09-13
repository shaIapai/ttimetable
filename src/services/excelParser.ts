import * as XLSX from 'xlsx';
import { UniversalEvent, LessonType, ImportPreviewItem, ImportResult, FilterSettings } from '../types';

/**
 * Normalizes text: trims, removes excess inner whitespace and carriage returns
 */
export function cleanText(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\r\n\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps Russian month names to month numbers (0-indexed)
 */
const RU_MONTHS: Record<string, number> = {
  января: 0,
  январь: 0,
  янв: 0,
  февраля: 1,
  февраль: 1,
  фев: 1,
  марта: 2,
  март: 2,
  мар: 2,
  апреля: 3,
  апрель: 3,
  апр: 3,
  мая: 4,
  май: 4,
  июня: 5,
  июнь: 5,
  июн: 5,
  июля: 6,
  июль: 6,
  июл: 6,
  августа: 7,
  август: 7,
  авг: 7,
  сентября: 8,
  сентябрь: 8,
  сен: 8,
  сент: 8,
  октября: 9,
  октябрь: 9,
  окт: 9,
  ноября: 10,
  ноябрь: 10,
  ноя: 10,
  нояб: 10,
  декабря: 11,
  декабрь: 11,
  дек: 11,
};

/**
 * Parses Russian date strings dynamically without a hardcoded year.
 * Searches for explicit year in the string, or uses the dynamically detected documentYear.
 * Returns null if the year cannot be determined (never silently defaults to current year).
 */
export function parseDateString(raw: unknown, documentYear?: number): string | null {
  if (raw === null || raw === undefined) return null;

  // Handle Excel Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle Excel numeric date (e.g. 45000+)
  if (typeof raw === 'number' && raw > 30000 && raw < 60000) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(raw);
      if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${dateObj.y}-${m}-${d}`;
      }
    } catch {
      // fallback to text parsing
    }
  }

  const text = cleanText(raw).toLowerCase();
  if (!text) return null;

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 2. Dot format with explicit 4-digit or 2-digit year: DD.MM.YYYY or DD.MM.YY
  const dotWithYearMatch = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
  if (dotWithYearMatch) {
    const d = parseInt(dotWithYearMatch[1], 10);
    const m = parseInt(dotWithYearMatch[2], 10);
    let year = parseInt(dotWithYearMatch[3], 10);
    if (year < 100) year += 2000;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && year >= 2000 && year <= 2099) {
      const dd = String(d).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // 3. Dot format without year: DD.MM (e.g. "07.09")
  // Only valid if documentYear is known!
  const dotNoYearMatch = text.match(/\b(\d{1,2})\.(\d{1,2})\b/);
  if (dotNoYearMatch && !text.includes(':')) {
    if (!documentYear) {
      // Requirement 2: Cannot determine year unambiguously, do not guess
      return null;
    }
    const d = parseInt(dotNoYearMatch[1], 10);
    const m = parseInt(dotNoYearMatch[2], 10);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      const dd = String(d).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return `${documentYear}-${mm}-${dd}`;
    }
  }

  // 4. Textual date e.g. "понедельник 7 сентября 2026", "7 сентября 2026 г.", "7 сентября", "07 сен 2025"
  for (const [monthName, monthIndex] of Object.entries(RU_MONTHS)) {
    if (text.includes(monthName)) {
      // Look for day number before or around the month name
      const regex = new RegExp(`(?:^|[^0-9])(\\d{1,2})\\s*(?:-?[а-я]{1,2})?\\s+${monthName}(?:\\s+(\\d{4}))?`);
      const match = text.match(regex);
      if (match) {
        const day = parseInt(match[1], 10);
        if (day >= 1 && day <= 31) {
          const year = match[2] ? parseInt(match[2], 10) : documentYear;
          if (!year) {
            // Requirement 2: No year in cell and no documentYear -> do not guess
            return null;
          }
          const mm = String(monthIndex + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          return `${year}-${mm}-${dd}`;
        }
      }
    }
  }

  return null;
}

/**
 * Normalizes time string e.g. "11:10–12:40", "11:10 - 12:40", "11.10–12.40"
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

  // Single time "11:10" -> assumes 90 min pair duration
  const singleMatch = text.match(/\b(\d{1,2}:\d{2})\b/);
  if (singleMatch) {
    const start = singleMatch[1].padStart(5, '0');
    const [h, m] = start.split(':').map((n) => parseInt(n, 10));
    const endMinutes = h * 60 + m + 90;
    const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    return { startTime: start, endTime: `${endH}:${endM}` };
  }

  return null;
}

/**
 * Extracts subgroup number from text (e.g. "Подгруппа 4", "п/г 2", "1 подгруппа", "4-я подгруппа")
 */
export function extractSubgroup(text: string): string | undefined {
  if (!text) return undefined;
  const clean = text.toLowerCase();

  const patterns = [
    /подгрупп[аые]\s*(?:№\s*)?([0-9]+)/i,
    /п\s*\/\s*г\s*(?:№\s*)?([0-9]+)/i,
    /([0-9]+)\s*[-–—]?\s*(?:я|ая)?\s*подгрупп[аые]/i,
    /subgroup\s*(?:№\s*)?([0-9]+)/i,
    /group\s*(?:№\s*)?([0-9]+)/i,
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
  if (
    lower.includes('зачет') ||
    lower.includes('зачёт') ||
    lower.includes('экзамен') ||
    lower.includes('аттестация')
  ) {
    return { type: 'exam', label: 'Аттестация / Экзамен' };
  }

  return { type: 'other', label: 'Занятие' };
}

/**
 * Cleans the subject title: removes trailing lesson types and trailing subgroup mentions,
 * but PRESERVES the full course name (including "Электив. Основная траектория." if present in official title).
 */
export function cleanSubjectTitle(raw: string): { title: string; isElective: boolean; embeddedTeacher?: string } {
  const original = String(raw || '');
  const isElective = /электив|по выбору|основная траектория/i.test(original);

  // Normalize newlines and whitespace
  let text = cleanText(original);

  // Check if there is an embedded teacher in title (e.g. "(доц. Барышников Д. Н.)" or ", доц. Барышников Д. Н.")
  let embeddedTeacher: string | undefined = undefined;
  const embeddedTeacherMatch = text.match(
    /(?:,\s*|\s*\(\s*|\s*\/\s*|\s*преподаватель:\s*)(?:(?:преп(?:одаватель)?|доц(?:ент)?|проф(?:ессор)?|ст(?:\.|\s+)?преп)?\.?\s*)?([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s*[А-ЯЁ]\.?)(?:\s*\))?/i
  );
  if (embeddedTeacherMatch && embeddedTeacherMatch[1]) {
    embeddedTeacher = embeddedTeacherMatch[1].trim();
    // Remove the embedded teacher part from text
    text = text.replace(embeddedTeacherMatch[0], ' ').trim();
  }

  // Strip subgroup references from title (e.g. "Подгруппа 4", "п/г 2", "4 подгруппа")
  text = text.replace(/,?\s*(?:подгрупп[аые]\s*№?\s*\d+|п\s*\/\s*г\s*№?\s*\d+|\d+\s*[-–—]?(?:я|ая)?\s*подгрупп[аые])(?:\s*|$)/gi, ' ');

  // Strip trailing lesson types if attached at the end (e.g. ", практическое занятие", ", семинар")
  text = text.replace(/,?\s*(?:практическое занятие|семинар|лекция|лабораторная работа|консультация|зачет|зачёт|экзамен)\s*$/gi, '');

  // Strip parenthetical lesson types at end (e.g. "(практическое занятие)")
  text = text.replace(/\s*\((?:практическое занятие|семинар|лекция|лабораторная работа|консультация|зачет|зачёт|экзамен)\)\s*$/gi, '');

  // Clean trailing commas, semicolons, colons, dashes or periods
  text = text.replace(/[,;:\-\s]+$/, '').trim();

  return {
    title: text,
    isElective,
    embeddedTeacher,
  };
}

/**
 * Checks whether a text is solely auxiliary metadata (e.g. "Подгруппа 4" or "практическое занятие")
 * without a substantive subject title.
 */
export function isAuxiliaryText(raw: string): boolean {
  const text = cleanText(raw).toLowerCase();
  if (!text) return true;

  // Patterns matching purely metadata rows
  const auxiliaryOnlyPatterns = [
    /^(?:подгрупп[аые]\s*\d+|п\/г\s*\d+|\d+\s*подгруппа)$/i,
    /^(?:лекция|семинар|практическое занятие|лабораторная работа|консультация)$/i,
    /^(?:практическое занятие|семинар|лекция)\s*,?\s*(?:подгрупп[аые]\s*\d+|п\/г\s*\d+)?$/i,
    /^(?:подгрупп[аые]\s*\d+|п\/г\s*\d+)\s*,?\s*(?:практическое занятие|семинар|лекция)?$/i,
    /^(?:подгруппа|п\/г)$/i,
  ];

  return auxiliaryOnlyPatterns.some((pattern) => pattern.test(text));
}

/**
 * Extracts room number and full address from location string
 */
export function parseLocation(raw: string): { location: string; address: string } {
  const text = cleanText(raw);
  if (!text) return { location: '', address: '' };

  const audMatch = text.match(
    /(?:ауд(?:итория)?\.?\s*|комн(?:ата)?\.?\s*|пом(?:ещение)?\.?\s*)?([0-9]+[а-яА-Яa-zA-Z\-]*)/
  );

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
 * Creates a stable deterministic identity key for duplicate detection and re-import matching.
 * Implements requirement 3:
 * Single canonical signature used for:
 * - importKey
 * - notes lookup and persistence
 * - duplicate detection
 * - re-import matching
 * Accounts for: date + time + normalized title + lessonType + subgroup
 */
export function createEventSignature(event: Partial<UniversalEvent>): string {
  const d = (event.date || '').trim();
  const st = (event.startTime || '').trim();
  const et = (event.endTime || '').trim();
  const title = (event.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const lessonType = (event.lessonType || 'other').toLowerCase().trim();
  const subgroup = (event.subgroup || '').toLowerCase().trim();
  return `${d}|${st}-${et}|${title}|${lessonType}|${subgroup}`;
}

// Discipline and course subject keywords used to prevent false positive teacher matching
const DISCIPLINE_KEYWORDS = [
  'проблем',
  'теори',
  'международн',
  'политик',
  'истори',
  'дипломат',
  'безопасност',
  'эконом',
  'исследован',
  'анализ',
  'язык',
  'литератур',
  'философ',
  'математик',
  'информатик',
  'технолог',
  'систем',
  'управлен',
  'введен',
  'основ',
  'культур',
  'право',
  'юриспруд',
  'семинар',
  'лекци',
  'практик',
  'лабораторн',
  'консультац',
  'электив',
  'траектори',
  'дисциплин',
  'подгрупп',
];

const TEACHER_TITLE_REGEX =
  /(?:^|[\s,;(/])(?:проф(?:ессор)?|доц(?:ент)?|ст(?:\.|\s+)?преп(?:одаватель)?|преп(?:одаватель)?|преподователь|асс(?:истент)?|зав(?:\.|\s+)?каф(?:едрой)?|академик|д(?:\.[а-яё]+)?\.?\s*н\.?|к(?:\.[а-яё]+)?\.?\s*н\.?)(?:\.|\s|$)/i;

const RUSSIAN_SURNAME_INITIALS_REGEX =
  /(?:^|[\s,;(/])([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s*[А-ЯЁ]\.?)(?:$|[\s,;)/])/;

const RUSSIAN_INITIALS_SURNAME_REGEX =
  /(?:^|[\s,;(/])([А-ЯЁ]\.\s*[А-ЯЁ]\.?\s+[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?)(?:$|[\s,;)/])/;

const RUSSIAN_FULL_3NAME_REGEX =
  /(?:^|[\s,;(/])([А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]*(?:ович|евич|ич|овна|евна|ична|инична))(?:$|[\s,;)/])/i;

/**
 * Accurately determines if a given text string represents a teacher name or academic rank.
 */
export function isLikelyTeacher(raw: string): boolean {
  const text = cleanText(raw);
  if (!text || text.length < 3 || text.length > 80) return false;
  const lower = text.toLowerCase();

  // If it's solely a room number or address without explicit teacher prefix
  if (
    /(?:^|[\s,])(?:ауд\.?\s*\d+|д\.\s*\d+|лит\.|комн|каб\.?\s*\d+)/i.test(lower) &&
    !TEACHER_TITLE_REGEX.test(text)
  ) {
    return false;
  }

  const hasTeacherPrefix = TEACHER_TITLE_REGEX.test(text);
  const hasDisciplineWord = DISCIPLINE_KEYWORDS.some((kw) => lower.includes(kw));

  // If it contains discipline/course terms and does not have an explicit teacher prefix
  if (hasDisciplineWord && !hasTeacherPrefix) {
    return false;
  }

  if (hasTeacherPrefix) return true;
  if (RUSSIAN_SURNAME_INITIALS_REGEX.test(text) || RUSSIAN_INITIALS_SURNAME_REGEX.test(text)) return true;
  if (RUSSIAN_FULL_3NAME_REGEX.test(text)) return true;

  return false;
}

/**
 * Checks if a candidate string is NOT a teacher (e.g. it is the subject title, prefix of subject,
 * discipline description, or purely lesson metadata).
 */
export function isNotTeacher(raw: string, subjectTitle?: string): boolean {
  const text = cleanText(raw);
  if (!text) return true;
  const lowerCandidate = text.toLowerCase();

  // 1. Check against subject title
  if (subjectTitle) {
    const lowerTitle = cleanText(subjectTitle).toLowerCase();
    if (
      lowerCandidate === lowerTitle ||
      lowerTitle.startsWith(lowerCandidate) ||
      lowerCandidate.startsWith(lowerTitle)
    ) {
      return true;
    }
    // Substring with substantial length (>= 12 chars)
    if (lowerCandidate.length >= 12 && lowerTitle.includes(lowerCandidate)) {
      return true;
    }
    if (lowerTitle.length >= 12 && lowerCandidate.includes(lowerTitle)) {
      return true;
    }

    // Word overlap test: if >= 40% of words (length >= 4) in candidate are in title
    const candidateWords = lowerCandidate
      .replace(/[^а-яёa-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    if (candidateWords.length >= 2) {
      const matchCount = candidateWords.filter((w) => lowerTitle.includes(w)).length;
      if (matchCount / candidateWords.length >= 0.4) {
        return true;
      }
    }
  }

  // 2. Purely lesson types / metadata
  if (
    /^(?:семинар|лекция|практическое занятие|лабораторная работа|консультация|зачет|зачёт|экзамен|электив|траектория|подгруппа\s*\d+)$/i.test(
      text
    )
  ) {
    return true;
  }

  // 3. Contains discipline keywords and NO teacher prefixes or initials
  const hasDisciplineWord = DISCIPLINE_KEYWORDS.some((kw) => lowerCandidate.includes(kw));
  const hasTeacherPrefix = TEACHER_TITLE_REGEX.test(text);
  const hasInitials =
    RUSSIAN_SURNAME_INITIALS_REGEX.test(text) || RUSSIAN_INITIALS_SURNAME_REGEX.test(text);

  if (hasDisciplineWord && !hasTeacherPrefix && !hasInitials) {
    return true;
  }

  return false;
}

/**
 * Searches across all cells of a row for a cell that represents a genuine teacher.
 */
export function findTeacherInRow(
  row: unknown[],
  subjectTitle: string,
  excludeCols: number[] = []
): { teacher: string; colIndex: number } | null {
  if (!row || !Array.isArray(row)) return null;

  for (let c = 0; c < row.length; c++) {
    if (excludeCols.includes(c)) continue;
    const cellVal = cleanText(row[c]);
    if (!cellVal) continue;

    if (isLikelyTeacher(cellVal) && !isNotTeacher(cellVal, subjectTitle)) {
      return { teacher: cellVal, colIndex: c };
    }
  }

  return null;
}

/**
 * Detects whether a column header cell signifies the teacher/instructor column.
 */
export function isTeacherHeader(cellText: string): boolean {
  const norm = cleanText(cellText).toLowerCase().replace(/[\s\.\-_/]+/g, '');
  if (!norm) return false;

  // Never match discipline or location headers as teacher
  if (
    norm.includes('название') ||
    norm.includes('дисциплин') ||
    norm.includes('предмет') ||
    norm.includes('кратк') ||
    norm.includes('мест') ||
    norm.includes('ауд') ||
    norm.includes('адрес')
  ) {
    return false;
  }

  if (norm.includes('фио') || norm.includes('fio')) return true;
  if (
    /(?:препод|педагог|лектор|учител|ведящ|teacher|educator|lecturer|professor|instructor|staff|ппс)/i.test(
      cellText
    )
  ) {
    return true;
  }
  if (/(?:^|[^а-яА-ЯёЁa-zA-Z0-9])преп(?:\.|\b|[^а-яА-ЯёЁa-zA-Z0-9]|$)/i.test(cellText)) {
    return true;
  }
  return false;
}

export function isDateHeader(cellText: string): boolean {
  const norm = cleanText(cellText).toLowerCase().replace(/[\s\.\-_/]+/g, '');
  if (!norm) return false;
  return (
    norm.includes('дата') ||
    norm.includes('день') ||
    norm.includes('число') ||
    /(?:^|[^а-яА-ЯёЁa-zA-Z0-9])(?:date|day)(?:[^а-яА-ЯёЁa-zA-Z0-9]|$)/i.test(cellText)
  );
}

export function isTimeHeader(cellText: string): boolean {
  const norm = cleanText(cellText).toLowerCase().replace(/[\s\.\-_/]+/g, '');
  if (!norm) return false;
  return (
    norm.includes('время') ||
    norm.includes('часы') ||
    norm.includes('пара') ||
    norm.includes('начало') ||
    /(?:^|[^а-яА-ЯёЁa-zA-Z0-9])(?:time|period)(?:[^а-яА-ЯёЁa-zA-Z0-9]|$)/i.test(cellText)
  );
}

export function isTitleHeader(cellText: string): boolean {
  const norm = cleanText(cellText).toLowerCase().replace(/[\s\.\-_/]+/g, '');
  if (!norm) return false;
  if (norm.includes('кратк') || norm.includes('сокращ') || norm.includes('short')) return false;
  if (isTeacherHeader(cellText)) return false;
  return (
    norm.includes('название') ||
    norm.includes('предмет') ||
    norm.includes('дисциплин') ||
    norm.includes('курс') ||
    norm.includes('тема') ||
    /(?:subject|discipline|course|title)/i.test(cellText)
  );
}

export function isLocationHeader(cellText: string): boolean {
  const norm = cleanText(cellText).toLowerCase().replace(/[\s\.\-_/]+/g, '');
  if (!norm) return false;
  if (isTeacherHeader(cellText)) return false;
  return (
    norm.includes('мест') ||
    norm.includes('ауд') ||
    norm.includes('адрес') ||
    norm.includes('помещен') ||
    norm.includes('корпус') ||
    /(?:location|room|place|auditorium)/i.test(cellText)
  );
}

interface HeaderScores {
  score: number;
  dateCol?: number;
  timeCol?: number;
  titleCol?: number;
  locationCol?: number;
  teacherCol?: number;
}

function scoreHeaderRow(row: unknown[]): HeaderScores {
  let score = 0;
  let dateCol: number | undefined;
  let timeCol: number | undefined;
  let titleCol: number | undefined;
  let locationCol: number | undefined;
  let teacherCol: number | undefined;

  for (let c = 0; c < row.length; c++) {
    const val = cleanText(row[c]);
    if (!val) continue;

    if (isTeacherHeader(val) && teacherCol === undefined) {
      teacherCol = c;
      score += 3;
    } else if (isDateHeader(val) && dateCol === undefined) {
      dateCol = c;
      score += 2;
    } else if (isTimeHeader(val) && timeCol === undefined) {
      timeCol = c;
      score += 2;
    } else if (isTitleHeader(val) && titleCol === undefined) {
      titleCol = c;
      score += 2;
    } else if (isLocationHeader(val) && locationCol === undefined) {
      locationCol = c;
      score += 2;
    }
  }

  return { score, dateCol, timeCol, titleCol, locationCol, teacherCol };
}

/**
 * Scans the worksheet for document-level metadata:
 * - detects academic group name (Requirement 1: NO hardcoded fallback)
 * - detects year from headers, date range, or cell dates (Requirement 2: NO silent current year fallback)
 * - detects date range text
 */
function scanDocumentMetadata(rawRows: unknown[][]): {
  groupName: string;
  detectedYear?: number;
  dateRangeText: string;
} {
  let groupName = '';
  let detectedYear: number | undefined = undefined;
  let dateRangeText = '';

  const inspectRowCount = Math.min(30, rawRows.length);
  for (let r = 0; r < inspectRowCount; r++) {
    const row = rawRows[r];
    if (!row) continue;
    const rowStr = row.map(cleanText).join(' ');

    // 1. Group name search across cells in top rows
    if (!groupName) {
      for (const cell of row) {
        const text = cleanText(cell);
        const cellMatch = text.match(/\b(\d{2}\.[а-яА-Яa-zA-Z0-9\-]+)\b/);
        if (cellMatch) {
          groupName = cellMatch[1];
          break;
        }
        const groupLabelMatch = text.match(/(?:групп[аы]?\s*[:№]?\s*)([а-яА-Яa-zA-Z0-9\.\-]+)/i);
        if (groupLabelMatch) {
          groupName = groupLabelMatch[1];
          break;
        }
      }
    }

    // 2. Date range pattern
    if (!dateRangeText) {
      const rangeMatch = rowStr.match(
        /(\d{1,2}\s+[а-яА-Я]+\s*(?:\d{4})?\s*[-–—]\s*\d{1,2}\s+[а-яА-Я]+\s*(?:\d{4})?)/i
      ) || rowStr.match(
        /(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\s*[-–—]\s*\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)/
      ) || rowStr.match(
        /(?:с\s+)?(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\s+по\s+\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)/i
      );
      if (rangeMatch) {
        dateRangeText = rangeMatch[0];
      }
    }

    // 3. Search for 4-digit year (2020 - 2035) in top rows
    if (!detectedYear) {
      const yearMatch = rowStr.match(/\b(202[0-9]|203[0-5])\b/);
      if (yearMatch) {
        detectedYear = parseInt(yearMatch[1], 10);
      }
    }
  }

  // If no year found in header, check date cells, Excel Date objects across rows
  if (!detectedYear) {
    for (let r = 0; r < Math.min(100, rawRows.length); r++) {
      const row = rawRows[r];
      if (!row) continue;
      for (const cell of row) {
        if (cell instanceof Date && !isNaN(cell.getTime())) {
          const y = cell.getFullYear();
          if (y >= 2020 && y <= 2035) {
            detectedYear = y;
            break;
          }
        }
        if (typeof cell === 'number' && cell > 30000 && cell < 60000) {
          try {
            const parsed = XLSX.SSF.parse_date_code(cell);
            if (parsed && parsed.y >= 2020 && parsed.y <= 2035) {
              detectedYear = parsed.y;
              break;
            }
          } catch {
            // ignore
          }
        }
        const text = cleanText(cell);
        const yMatch = text.match(/\b(202[0-9]|203[0-5])\b/);
        if (yMatch) {
          detectedYear = parseInt(yMatch[1], 10);
          break;
        }
      }
      if (detectedYear) break;
    }
  }

  return {
    groupName: groupName || 'Группа не определена',
    detectedYear,
    dateRangeText,
  };
}

/**
 * Parses XLSX binary into structured events with dynamic date parsing,
 * multi-row subgroup handling, and rule matching.
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

  // Convert to 2D array of rows
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

  // 1. Scan document metadata (Group name, document year, date range)
  const meta = scanDocumentMetadata(rawRows);
  const docYear = meta.detectedYear;
  const hasYearError = !docYear;
  const yearErrorMessage = hasYearError ? 'Не удалось определить год расписания.' : undefined;

  let lastKnownDate: string | null = null;
  const rawEvents: UniversalEvent[] = [];
  let hasDateErrors = false;

  // 2. Identify column indices dynamically using header scoring
  let dateCol = 0;
  let timeCol = 1;
  let titleCol = 2;
  let locationCol = 3;
  let teacherCol = 4;

  let bestHeaderScore = 0;
  let bestHeaderRowIdx = -1;
  let headerDetectedCols: HeaderScores = { score: 0 };

  const maxHeaderSearch = Math.min(25, rawRows.length);
  for (let r = 0; r < maxHeaderSearch; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;
    const scored = scoreHeaderRow(row);
    if (scored.score > bestHeaderScore && scored.score >= 4) {
      bestHeaderScore = scored.score;
      bestHeaderRowIdx = r;
      headerDetectedCols = scored;
    }
  }

  if (bestHeaderScore >= 4) {
    if (headerDetectedCols.dateCol !== undefined) dateCol = headerDetectedCols.dateCol;
    if (headerDetectedCols.timeCol !== undefined) timeCol = headerDetectedCols.timeCol;
    if (headerDetectedCols.titleCol !== undefined) titleCol = headerDetectedCols.titleCol;
    if (headerDetectedCols.locationCol !== undefined) locationCol = headerDetectedCols.locationCol;
    if (headerDetectedCols.teacherCol !== undefined) teacherCol = headerDetectedCols.teacherCol;

    // Check adjacent row (e.g. multi-line header) if teacherCol is missing
    if (headerDetectedCols.teacherCol === undefined && bestHeaderRowIdx + 1 < rawRows.length) {
      const nextRow = rawRows[bestHeaderRowIdx + 1];
      if (nextRow && Array.isArray(nextRow)) {
        for (let c = 0; c < nextRow.length; c++) {
          if (isTeacherHeader(cleanText(nextRow[c]))) {
            teacherCol = c;
            break;
          }
        }
      }
    }
  } else {
    // Fallback: search across top 15 rows
    for (let r = 0; r < Math.min(15, rawRows.length); r++) {
      const row = rawRows[r];
      if (!row || !Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const val = cleanText(row[c]);
        if (!val) continue;
        if (isDateHeader(val)) dateCol = c;
        if (isTimeHeader(val)) timeCol = c;
        if (isTitleHeader(val)) titleCol = c;
        if (isLocationHeader(val)) locationCol = c;
        if (isTeacherHeader(val)) teacherCol = c;
      }
    }
  }

  // If teacherCol was not identified from headers, or points to the title column,
  // inspect data rows to discover which column reliably contains teacher names
  if (teacherCol === titleCol || headerDetectedCols.teacherCol === undefined) {
    const teacherVotes: Record<number, number> = {};
    const inspectStart = Math.max(0, bestHeaderRowIdx + 1);
    const inspectEnd = Math.min(inspectStart + 25, rawRows.length);
    for (let r = inspectStart; r < inspectEnd; r++) {
      const row = rawRows[r];
      if (!row || !Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        if (c === dateCol || c === timeCol || c === titleCol) continue;
        const text = cleanText(row[c]);
        if (isLikelyTeacher(text)) {
          teacherVotes[c] = (teacherVotes[c] || 0) + 1;
        }
      }
    }
    let maxVotes = 0;
    let votedCol = -1;
    for (const [cStr, votes] of Object.entries(teacherVotes)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        votedCol = parseInt(cStr, 10);
      }
    }
    if (votedCol !== -1 && maxVotes >= 1) {
      teacherCol = votedCol;
    }
  }

  // 3. Row by row processing
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Skip the recognized header row itself
    if (r === bestHeaderRowIdx) continue;

    const dateCell = row[dateCol];
    const timeCell = cleanText(row[timeCol]);
    const titleCell = cleanText(row[titleCol]);
    const locationCell = cleanText(row[locationCol]);
    const initialTeacherCandidate = cleanText(row[teacherCol]);

    // Check if this row introduces a new date
    const parsedDate = parseDateString(dateCell, docYear);
    if (parsedDate) {
      lastKnownDate = parsedDate;
    }

    // Dynamic teacher resolution for this row:
    // Prevent taking subject titles, discipline descriptions, or locations as the teacher
    let resolvedTeacher: string | undefined = undefined;
    if (
      initialTeacherCandidate &&
      isLikelyTeacher(initialTeacherCandidate) &&
      !isNotTeacher(initialTeacherCandidate, titleCell)
    ) {
      resolvedTeacher = initialTeacherCandidate;
    } else {
      // Find teacher in other cells of this row
      const alt = findTeacherInRow(row, titleCell, [dateCol, timeCol, titleCol, locationCol]);
      if (alt) {
        resolvedTeacher = alt.teacher;
        teacherCol = alt.colIndex; // dynamically update teacherCol for subsequent rows
      }
    }

    // Check if this row is a continuation row for the previous event!
    // Condition: No valid time interval OR title is purely auxiliary metadata (e.g. "Подгруппа 4")
    const parsedTime = parseTimeInterval(timeCell);

    if (!parsedTime || isAuxiliaryText(titleCell)) {
      if (rawEvents.length > 0) {
        const lastEvent = rawEvents[rawEvents.length - 1];
        const combinedAux = `${titleCell} ${locationCell} ${initialTeacherCandidate}`;
        const sub = extractSubgroup(combinedAux);
        if (sub && !lastEvent.subgroup) {
          lastEvent.subgroup = sub;
        }
        if (isAuxiliaryText(titleCell)) {
          const lType = detectLessonType(titleCell);
          if (lType.type !== 'other') {
            lastEvent.lessonType = lType.type;
            lastEvent.lessonTypeName = lType.label;
          }
        }

        // Check continuation row for teacher
        let contTeacher = resolvedTeacher;
        if (!contTeacher) {
          const contAlt = findTeacherInRow(row, lastEvent.title, [dateCol, timeCol]);
          if (contAlt) {
            contTeacher = contAlt.teacher;
          }
        }
        if (contTeacher && (!lastEvent.teacher || isNotTeacher(lastEvent.teacher, lastEvent.title))) {
          lastEvent.teacher = contTeacher;
        }

        if (!lastEvent.location && locationCell) {
          const loc = parseLocation(locationCell);
          lastEvent.location = loc.location;
          lastEvent.address = loc.address;
        }
      }
      continue;
    }

    // This is a legitimate lesson row with a valid time interval
    let eventDate = lastKnownDate;
    let rowHasDateError = false;
    let dateErrorMessage: string | undefined = undefined;

    if (!eventDate) {
      // Date or year could not be determined!
      hasDateErrors = true;
      rowHasDateError = true;
      dateErrorMessage = hasYearError
        ? 'Не удалось определить год расписания'
        : 'Не удалось определить дату занятия из файла';
      eventDate = '0000-00-00';
    }

    // Subgroup extraction from all cells of this row
    const combinedRowText = `${titleCell} ${locationCell} ${initialTeacherCandidate}`;
    const subgroup = extractSubgroup(combinedRowText);

    // Clean title, elective flag, and embedded teacher
    const { title, isElective, embeddedTeacher } = cleanSubjectTitle(titleCell);
    if (!title && !isAuxiliaryText(titleCell)) continue;

    if (!resolvedTeacher && embeddedTeacher && isLikelyTeacher(embeddedTeacher)) {
      resolvedTeacher = embeddedTeacher;
    }

    // Detect lesson type
    const { type: lessonType, label: lessonTypeName } = detectLessonType(
      `${titleCell} ${locationCell}`
    );

    // Parse location & address
    const { location, address } = parseLocation(locationCell);

    // Check existing note by canonical signature
    const noteSignature = createEventSignature({
      date: eventDate,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      title,
      lessonType,
      subgroup,
    });
    const existingNote = existingNotesMap[noteSignature] || '';

    const newEvent: UniversalEvent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: title || 'Учебное занятие',
      date: eventDate,
      startTime: parsedTime.startTime,
      endTime: parsedTime.endTime,
      eventType: 'pair',
      lessonType,
      lessonTypeName,
      teacher: resolvedTeacher || undefined,
      location: location || undefined,
      address: address || undefined,
      subgroup,
      isElective,
      note: existingNote || undefined,
      reminder: 'none',
      source: 'imported',
      isUserModified: false,
      importedFrom: fileName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasDateError: rowHasDateError,
      dateErrorMessage,
    };

    // Stable importKey for re-import matching (Requirement 4)
    newEvent.importKey = createEventSignature(newEvent);

    rawEvents.push(newEvent);
  }

  // Sanitize any event that still has a subject title mistakenly assigned as teacher
  for (const ev of rawEvents) {
    if (ev.teacher && isNotTeacher(ev.teacher, ev.title)) {
      ev.teacher = undefined;
    }
  }

  // 4. Deduplication
  const seenSignatures = new Set<string>();
  const deduplicatedEvents: UniversalEvent[] = [];
  let duplicatesCount = 0;

  for (const ev of rawEvents) {
    const sig = ev.importKey || createEventSignature(ev);
    if (seenSignatures.has(sig)) {
      duplicatesCount++;
    } else {
      seenSignatures.add(sig);
      deduplicatedEvents.push(ev);
    }
  }

  // 5. Build Preview Items with rules matching
  const previewItems: ImportPreviewItem[] = deduplicatedEvents.map((ev) => {
    if (ev.hasDateError || ev.date === '0000-00-00') {
      return {
        id: ev.id,
        event: ev,
        selected: false,
        matchesUserRules: false,
        reason: `✕ ${ev.dateErrorMessage || 'Ошибка: дата не определена'}`,
        hasDateError: true,
      };
    }

    let matchesRules = true;
    let reason = '✓ Подходит для расписания';

    if (ev.isElective) {
      if (userSettings.hideElectives) {
        matchesRules = false;
        reason = '✕ Электив (скрыт общей настройкой)';
      } else if (ev.subgroup) {
        if (userSettings.mySubgroup && userSettings.mySubgroup !== 'all') {
          if (ev.subgroup === userSettings.mySubgroup) {
            matchesRules = true;
            reason = `✓ Моя подгруппа (${ev.subgroup}) [Электив]`;
          } else {
            matchesRules = false;
            reason = `✕ Электив другой подгруппы (${ev.subgroup})`;
          }
        } else {
          matchesRules = true;
          reason = `✓ Электив (подгруппа ${ev.subgroup})`;
        }
      } else {
        matchesRules = true;
        reason = '✓ Общий электив группы';
      }
    } else {
      if (ev.subgroup) {
        if (userSettings.mySubgroup && userSettings.mySubgroup !== 'all') {
          if (ev.subgroup === userSettings.mySubgroup) {
            matchesRules = true;
            reason = `✓ Моя подгруппа (${ev.subgroup})`;
          } else {
            if (userSettings.hideOtherSubgroups) {
              matchesRules = false;
              reason = `✕ Другая подгруппа (${ev.subgroup})`;
            } else {
              matchesRules = true;
              reason = `Подгруппа ${ev.subgroup}`;
            }
          }
        } else {
          matchesRules = true;
          reason = `Подгруппа ${ev.subgroup}`;
        }
      } else {
        matchesRules = true;
        reason = '✓ Общее занятие группы';
      }
    }

    return {
      id: ev.id,
      event: ev,
      selected: matchesRules,
      matchesUserRules: matchesRules,
      reason,
      hasExistingNote: Boolean(ev.note),
      hasDateError: false,
    };
  });

  return {
    fileName,
    groupName: meta.groupName || 'Группа не определена',
    dateRangeText:
      meta.dateRangeText ||
      (rawEvents[0]?.date && rawEvents[0].date !== '0000-00-00'
        ? `Неделя с ${rawEvents[0].date}`
        : 'Расписание недели'),
    totalFound: rawEvents.length,
    recognizedCount: deduplicatedEvents.length,
    totalDuplicates: duplicatesCount,
    hasDateErrors: hasDateErrors || hasYearError,
    hasYearError,
    yearErrorMessage,
    items: previewItems,
  };
}
