import React, { useState } from 'react';
import { UniversalEvent } from '../types';
import { EventCard } from './EventCard';
import { formatFullRussianDate, parseISODate } from '../utils/dateUtils';
import { FileText, AlertCircle, Calendar, Plus, Search } from 'lucide-react';

interface EventsListViewProps {
  events: UniversalEvent[];
  onSelectEvent: (event: UniversalEvent) => void;
  onAddEvent: () => void;
}

export const EventsListView: React.FC<EventsListViewProps> = ({
  events,
  onSelectEvent,
  onAddEvent,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'deadlines' | 'pairs'>('all');
  const [query, setQuery] = useState('');

  let filtered = [...events];

  if (filterType === 'notes') {
    filtered = filtered.filter((e) => Boolean(e.note && e.note.trim().length > 0));
  } else if (filterType === 'deadlines') {
    filtered = filtered.filter((e) => e.eventType === 'deadline');
  } else if (filterType === 'pairs') {
    filtered = filtered.filter((e) => e.eventType === 'pair');
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q)) ||
        (e.teacher && e.teacher.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
    );
  }

  // Group by date
  const grouped: Record<string, UniversalEvent[]> = {};
  filtered.forEach((ev) => {
    if (!grouped[ev.date]) {
      grouped[ev.date] = [];
    }
    grouped[ev.date].push(ev);
  });

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div id="events-list-view" className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Filter toolbar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Все события ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('notes')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
              filterType === 'notes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            С заметками ({events.filter((e) => Boolean(e.note)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deadlines')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
              filterType === 'deadlines'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Дедлайны ({events.filter((e) => e.eventType === 'deadline').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по заметкам и темам..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onAddEvent}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить
          </button>
        </div>
      </div>

      {/* Grouped list body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
        {sortedDates.length > 0 ? (
          sortedDates.map((dateStr) => {
            const dateObj = parseISODate(dateStr);
            const items = grouped[dateStr].sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );

            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {formatFullRussianDate(dateObj)}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    ({items.length} {items.length === 1 ? 'событие' : 'события'})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((ev) => (
                    <EventCard key={ev.id} event={ev} onClick={onSelectEvent} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-slate-400">
            Ничего не найдено по выбранному фильтру
          </div>
        )}
      </div>
    </div>
  );
};
