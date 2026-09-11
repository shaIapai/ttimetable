import React from 'react';
import { UniversalEvent } from '../types';
import {
  formatISODate,
  RU_DAYS_SHORT,
  RU_MONTHS_NOMINATIVE,
  isSameDay,
} from '../utils/dateUtils';
import { getEventStyle } from '../utils/themeUtils';

interface MonthViewProps {
  currentDate: Date;
  events: UniversalEvent[];
  onSelectEvent: (event: UniversalEvent) => void;
  onSelectDay: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onSelectDay,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // First day of the month
  const firstDayOfMonth = new Date(year, month, 1);
  // How many days in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week of first day (Monday = 1, Sunday = 0 -> let's make Monday = 0 .. Sunday = 6)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Build grid calendar cells
  const calendarCells: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Previous month filler days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    calendarCells.push({
      date: d,
      isCurrentMonth: false,
      dateStr: formatISODate(d),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarCells.push({
      date: d,
      isCurrentMonth: true,
      dateStr: formatISODate(d),
    });
  }

  // Next month filler days to complete weeks (multiple of 7)
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    calendarCells.push({
      date: d,
      isCurrentMonth: false,
      dateStr: formatISODate(d),
    });
  }

  return (
    <div id="month-view-container" className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Month name banner */}
      <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700 select-none">
        <span>
          {RU_MONTHS_NOMINATIVE[month]} {year}
        </span>
        <span className="text-slate-400 font-normal">
          Нажмите на день для перехода в режим дня
        </span>
      </div>

      {/* Weekday column names */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((dayName, idx) => (
          <div key={idx}>{dayName}</div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 overflow-y-auto">
        {calendarCells.map((cell, idx) => {
          const isToday = isSameDay(cell.date, today);
          const cellEvents = events.filter((e) => e.date === cell.dateStr);

          return (
            <div
              key={idx}
              onClick={() => onSelectDay(cell.date)}
              className={`p-1.5 flex flex-col min-h-[90px] transition-colors cursor-pointer hover:bg-blue-50/40 group ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/50 text-slate-300'
                  : isToday
                  ? 'bg-blue-50/20'
                  : 'bg-white'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1 select-none">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-700 group-hover:text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {cellEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {cellEvents.length}
                  </span>
                )}
              </div>

              {/* Event pills preview (brief) */}
              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {cellEvents.slice(0, 3).map((ev) => {
                  const style = getEventStyle(ev);
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium border ${style.bg} ${style.border} ${style.text} hover:opacity-80 transition-opacity`}
                      title={`${ev.startTime} ${ev.title} (${ev.location || ''})`}
                    >
                      <span className="font-bold mr-1">{ev.startTime}</span>
                      <span>{ev.title}</span>
                    </div>
                  );
                })}
                {cellEvents.length > 3 && (
                  <div className="text-[9px] text-slate-500 font-semibold px-1">
                    + еще {cellEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
