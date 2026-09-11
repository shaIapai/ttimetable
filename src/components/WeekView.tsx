import React from 'react';
import { UniversalEvent } from '../types';
import { EventCard } from './EventCard';
import {
  getWeekDates,
  formatISODate,
  RU_DAYS_SHORT,
  timeToMinutes,
  isSameDay,
} from '../utils/dateUtils';
import { Plus } from 'lucide-react';

interface WeekViewProps {
  mondayDate: Date;
  events: UniversalEvent[];
  onSelectEvent: (event: UniversalEvent) => void;
  onSelectDay: (date: Date) => void;
  onSlotClick: (dateStr: string, timeStr: string) => void;
  timeStartHour?: number; // default 8
  timeEndHour?: number; // default 20
}

export const WeekView: React.FC<WeekViewProps> = ({
  mondayDate,
  events,
  onSelectEvent,
  onSelectDay,
  onSlotClick,
  timeStartHour = 8,
  timeEndHour = 20,
}) => {
  const weekDays = getWeekDates(mondayDate);
  const today = new Date();

  // Generate hours array e.g. [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  const hours: number[] = [];
  for (let h = timeStartHour; h <= timeEndHour; h++) {
    hours.push(h);
  }

  const totalMinutes = (timeEndHour - timeStartHour + 1) * 60;
  const hourHeightPx = 64; // height of each hour slot in pixels

  // Group events by date
  const eventsByDate = weekDays.map((day) => {
    const iso = formatISODate(day);
    const dayEvents = events.filter((e) => e.date === iso);
    return {
      day,
      iso,
      events: dayEvents,
    };
  });

  return (
    <div id="week-view-container" className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Week Header: 7 Days Columns */}
      <div className="flex border-b border-slate-200 bg-slate-50/90 shrink-0 select-none">
        {/* Time column header spacer */}
        <div className="w-16 border-r border-slate-200 shrink-0 text-right pr-2 py-2.5 text-[11px] font-semibold text-slate-400">
          Время
        </div>

        {/* 7 Day Headers */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200">
          {weekDays.map((day, idx) => {
            const isToday = isSameDay(day, today);
            const dayNum = day.getDate();
            const dayName = RU_DAYS_SHORT[day.getDay()];

            return (
              <button
                key={idx}
                type="button"
                id={`week-day-header-${idx}`}
                onClick={() => onSelectDay(day)}
                className={`py-2 px-1 text-center transition-colors group hover:bg-blue-50/60 cursor-pointer ${
                  isToday ? 'bg-blue-50/90' : ''
                }`}
                title="Нажмите для перехода в подробный режим дня"
              >
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {dayName}
                </span>
                <div className="flex items-center justify-center mt-0.5">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-sm font-extrabold rounded-full transition-transform group-hover:scale-105 ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Scrollable Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex">
        {/* Left Time Column */}
        <div className="w-16 border-r border-slate-200 shrink-0 select-none bg-slate-50/40 text-slate-400 text-xs font-mono">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: `${hourHeightPx}px` }}
              className="relative text-right pr-2.5 pt-1 border-b border-slate-100/80"
            >
              <span className="text-[11px] font-medium text-slate-500">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* 7 Days Timeline Columns */}
        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-200 relative">
          {/* Background horizontal hour grid lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: `${hourHeightPx}px` }}
                className="border-b border-slate-100/80 w-full"
              />
            ))}
          </div>

          {/* 7 Columns for Days */}
          {eventsByDate.map(({ day, iso, events: dayEvents }, dayIdx) => {
            const isToday = isSameDay(day, today);

            return (
              <div
                key={iso}
                id={`day-column-${iso}`}
                className={`relative min-h-full transition-colors ${
                  isToday ? 'bg-blue-50/15' : ''
                }`}
                style={{ height: `${hours.length * hourHeightPx}px` }}
              >
                {/* Clickable empty slots to quickly add a pair */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() =>
                      onSlotClick(iso, `${String(hour).padStart(2, '0')}:00`)
                    }
                    style={{ height: `${hourHeightPx}px` }}
                    className="group/slot cursor-pointer relative hover:bg-blue-50/30 transition-colors"
                    title={`Кликните для добавления занятия на ${iso} в ${String(
                      hour
                    ).padStart(2, '0')}:00`}
                  >
                    <div className="opacity-0 group-hover/slot:opacity-100 absolute top-1 right-1 text-blue-500 text-[10px] font-semibold flex items-center gap-0.5 pointer-events-none">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                ))}

                {/* Render Events inside this day */}
                {dayEvents.map((event) => {
                  const startMin = timeToMinutes(event.startTime);
                  const endMin = timeToMinutes(event.endTime);

                  // Calculate pixel offset from timeStartHour
                  const baseStartMin = timeStartHour * 60;
                  const topMinutes = Math.max(0, startMin - baseStartMin);
                  const durationMinutes = Math.max(35, endMin - startMin);

                  // Convert minutes to pixels: (minutes / 60) * hourHeightPx
                  const topPx = (topMinutes / 60) * hourHeightPx;
                  const heightPx = Math.max(
                    48,
                    (durationMinutes / 60) * hourHeightPx - 3
                  );

                  return (
                    <div
                      key={event.id}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: '4px',
                        right: '4px',
                      }}
                      className="absolute z-10"
                    >
                      <EventCard
                        event={event}
                        onClick={onSelectEvent}
                        compact={heightPx < 70}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
