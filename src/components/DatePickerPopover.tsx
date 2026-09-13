import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  formatISODate,
  parseISODate,
  getMondayOfWeek,
  isSameDay,
  RU_MONTHS_NOMINATIVE,
} from '../utils/dateUtils';
import { CalendarViewMode } from '../types';

interface DatePickerPopoverProps {
  selectedDate: Date;
  viewMode: CalendarViewMode;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const RU_DAYS_MINI = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  selectedDate,
  viewMode,
  onSelectDate,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());
  const [hoveredWeekMonday, setHoveredWeekMonday] = useState<number | null>(null);

  // Sync viewYear/viewMonth if selectedDate changes externally
  useEffect(() => {
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePrevYear = () => setViewYear((y) => y - 1);
  const handleNextYear = () => setViewYear((y) => y + 1);

  // Compute weeks grid
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const firstMonday = getMondayOfWeek(firstOfMonth);

  const weeks: Date[][] = [];
  let currentMonday = new Date(firstMonday);

  for (let w = 0; w < 6; w++) {
    const weekDays: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(currentMonday);
      day.setDate(currentMonday.getDate() + d);
      weekDays.push(day);
    }
    weeks.push(weekDays);

    // Advance 7 days
    const nextMonday = new Date(currentMonday);
    nextMonday.setDate(currentMonday.getDate() + 7);
    currentMonday = nextMonday;

    // If next week's Monday is in a new month and we already rendered at least 4 weeks, stop
    if (nextMonday.getMonth() !== viewMonth && w >= 3) {
      break;
    }
  }

  const selectedMondayTime = getMondayOfWeek(selectedDate).getTime();
  const today = new Date();

  // Year options for dropdown (currentYear - 3 .. currentYear + 4)
  const baseYear = today.getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => baseYear - 3 + i);

  return (
    <div
      ref={popoverRef}
      id="date-picker-popover"
      className="absolute left-0 sm:left-auto top-full mt-2 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800"
    >
      {/* Header with Month/Year selectors & controls */}
      <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevYear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Предыдущий год"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Month & Year pickers */}
        <div className="flex items-center gap-1.5">
          <select
            id="picker-month-select"
            value={viewMonth}
            onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
            className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md py-1 px-1.5 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {RU_MONTHS_NOMINATIVE.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            id="picker-year-select"
            value={viewYear}
            onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
            className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md py-1 px-1.5 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Следующий год"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 ml-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {RU_DAYS_MINI.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-[11px] font-bold py-1 ${
              idx >= 5 ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {weeks.map((week, wIdx) => {
          const weekMonday = getMondayOfWeek(week[0]);
          const isSelectedWeek = weekMonday.getTime() === selectedMondayTime;
          const isHoveredWeek =
            viewMode === 'week' && hoveredWeekMonday === weekMonday.getTime();

          return (
            <div
              key={wIdx}
              onMouseEnter={() => setHoveredWeekMonday(weekMonday.getTime())}
              onMouseLeave={() => setHoveredWeekMonday(null)}
              className={`grid grid-cols-7 gap-1 p-0.5 rounded-lg transition-colors ${
                isSelectedWeek
                  ? 'bg-blue-50/80 border border-blue-200'
                  : isHoveredWeek
                  ? 'bg-slate-50 border border-slate-200/60'
                  : 'border border-transparent'
              }`}
            >
              {week.map((date) => {
                const isCurrentMonth = date.getMonth() === viewMonth;
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isSameDay(date, today);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => onSelectDate(date)}
                    className={`relative h-7 w-full rounded-md text-xs font-medium flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isCurrentMonth
                        ? 'text-slate-800 hover:bg-blue-100 hover:text-blue-900'
                        : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    title={
                      viewMode === 'week'
                        ? `Выбрать неделю: ${week[0].getDate()} – ${week[6].getDate()} ${
                            RU_MONTHS_NOMINATIVE[week[6].getMonth()]
                          }`
                        : date.toLocaleDateString('ru-RU')
                    }
                  >
                    <span>{date.getDate()}</span>
                    {isCurrentDay && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer with Quick Shortcuts */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onSelectDate(new Date())}
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
        >
          <CalendarIcon className="w-3 h-3" />
          <span>Текущая неделя</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Дата:</span>
          <input
            id="picker-direct-date-input"
            type="date"
            value={formatISODate(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(parseISODate(e.target.value));
              }
            }}
            className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            title="Прямой выбор даты"
          />
        </div>
      </div>
    </div>
  );
};
