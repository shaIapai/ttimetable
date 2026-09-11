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
export function cleanSubjectTitle(raw: string): { title: string; isElective: boolean } {
  const original = String(raw || '');
  const isElective = /электив|по выбору|основная траектория/i.test(original);

  // Normalize newlines and whitespace
  let text = original.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip subgroup references from title (e.g. "Подгруппа 4", "п/г 2", "4 подгруппа")
  text = text.replace(/,?\s*(?:подгрупп[аые]\s*№?\s*\d+|п\s*\/\s*г\s*№?\s*\d+|\d+\s*[-–—]?(?:я|ая)?\s*подгрупп[аые])\b/gi, '');

  // Strip trailing lesson types if attached at the end (e.g. ", практическое занятие", ", семинар")
  text = text.replace(/,?\s*(?:практическое занятие|семинар|лекция|лабораторная работа|консультация|зачет|зачёт|экзамен)\b\s*$/gi, '');

  // Strip parenthetical lesson types at end (e.g. "(практическое занятие)")
  text = text.replace(/\s*\((?:практическое занятие|семинар|лекция|лабораторная работа|консультация|зачет|зачёт|экзамен)\)\s*$/gi, '');

  // Clean trailing commas, semicolons, colons, dashes or periods
  text = text.replace(/[,;:\-\s]+$/, '').trim();

  return {
    title: text,
    isElective,
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

  // 2. Identify column indices dynamically
  let dateCol = 0;
  let timeCol = 1;
  let titleCol = 2;
  let locationCol = 3;
  let teacherCol = 4;

  for (let r = 0; r < Math.min(20, rawRows.length); r++) {
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

  // 3. Row by row processing
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const dateCell = row[dateCol];
    const timeCell = cleanText(row[timeCol]);
    const titleCell = cleanText(row[titleCol]);
    const locationCell = cleanText(row[locationCol]);
    const teacherCell = cleanText(row[teacherCol]);

    // Check if this row introduces a new date
    const parsedDate = parseDateString(dateCell, docYear);
    if (parsedDate) {
      lastKnownDate = parsedDate;
    }

    // Check if this row is a continuation row for the previous event!
    // Condition: No valid time interval OR title is purely auxiliary metadata (e.g. "Подгруппа 4")
    const parsedTime = parseTimeInterval(timeCell);

    if (!parsedTime || isAuxiliaryText(titleCell)) {
      if (rawEvents.length > 0) {
        const lastEvent = rawEvents[rawEvents.length - 1];
        const combinedAux = `${titleCell} ${locationCell} ${teacherCell}`;
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
        if (!lastEvent.teacher && teacherCell) {
          lastEvent.teacher = cleanText(teacherCell);
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
    const combinedRowText = `${titleCell} ${locationCell} ${teacherCell}`;
    const subgroup = extractSubgroup(combinedRowText);

    // Clean title and elective flag
    const { title, isElective } = cleanSubjectTitle(titleCell);
    if (!title && !isAuxiliaryText(titleCell)) continue;

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
      teacher: cleanText(teacherCell) || undefined,
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
