import React from 'react';
import { UniversalEvent } from '../types';
import { EventCard } from './EventCard';
import { formatFullRussianDate, formatISODate } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: UniversalEvent[];
  onSelectEvent: (event: UniversalEvent) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onAddEvent: (dateStr: string) => void;
  onBackToWeek: () => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onPrevDay,
  onNextDay,
  onToday,
  onAddEvent,
  onBackToWeek,
}) => {
  const isoDate = formatISODate(currentDate);
  const dayEvents = events
    .filter((e) => e.date === isoDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div id="day-view-container" className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Day header toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50/90 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToWeek}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 transition-colors"
          >
            ← К неделе
          </button>
          <div className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{formatFullRussianDate(currentDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={onPrevDay}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title="Предыдущий день"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="px-2.5 py-1 rounded text-xs font-bold hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={onNextDay}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
              title="Следующий день"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAddEvent(isoDate)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить пару
          </button>
        </div>
      </div>

      {/* Day Events List / Timeline */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        {dayEvents.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Расписание на этот день ({dayEvents.length} {dayEvents.length === 1 ? 'занятие' : 'занятий'})
            </div>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div key={event.id} className="w-full">
                  <EventCard event={event} onClick={onSelectEvent} compact={false} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">
              На этот день занятий нет
            </h4>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              В расписании отсутствуют пары или они были скрыты согласно вашей подгруппе и фильтрам.
            </p>
            <button
              type="button"
              onClick={() => onAddEvent(isoDate)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить занятие или заметку
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
