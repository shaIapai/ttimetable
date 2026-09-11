import React from 'react';
import { UniversalEvent } from '../types';
import { getEventStyle, getReminderLabel } from '../utils/themeUtils';
import { MapPin, User, FileText, Bell, Sparkles } from 'lucide-react';

interface EventCardProps {
  event: UniversalEvent;
  onClick: (event: UniversalEvent) => void;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick, compact = false }) => {
  const style = getEventStyle(event);

  return (
    <div
      id={`event-card-${event.id}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-md border text-left cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md hover:scale-[1.008] active:scale-[0.99] ${style.bg} ${style.border} ${style.text} p-2.5 select-none`}
    >
      {/* Top row: Time & Badges */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 font-semibold text-xs tracking-tight">
            <span className={`w-2 h-2 rounded-full shrink-0 ${style.dotColor}`} />
            <span>
              {event.startTime}–{event.endTime}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {event.subgroup && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-white/80 border border-slate-200 text-slate-700 rounded-sm shadow-2xs">
                п/г {event.subgroup}
              </span>
            )}
            {event.isElective && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100/90 text-amber-900 border border-amber-200 rounded-sm shadow-2xs flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Электив
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-black transition-colors mb-1">
          {event.title}
        </h4>

        {/* Lesson type badge if pair */}
        {event.eventType === 'pair' && event.lessonTypeName && (
          <div className="mb-1.5">
            <span className={`inline-block px-1.5 py-0.5 text-[11px] font-medium rounded-sm ${style.badgeBg}`}>
              {event.lessonTypeName}
            </span>
          </div>
        )}
      </div>

      {/* Footer details: Room, Teacher, Note / Reminder icons */}
      <div className="mt-1 pt-1 border-t border-slate-200/60 text-xs text-slate-600 flex flex-col gap-0.5">
        {event.location && (
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700 truncate" title={event.address || event.location}>
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">
              {event.location}
              {event.address && !compact ? ` • ${event.address.split(',')[0]}` : ''}
            </span>
          </div>
        )}

        {event.teacher && (
          <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate" title={event.teacher}>
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{event.teacher}</span>
          </div>
        )}

        {/* Indicators for Notes & Reminders */}
        {(event.note || (event.reminder && event.reminder !== 'none')) && (
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200/40 text-[10px]">
            {event.note && (
              <div className="flex items-center gap-0.5 text-blue-700 font-medium truncate" title={event.note}>
                <FileText className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[140px] italic">«{event.note}»</span>
              </div>
            )}
            {event.reminder && event.reminder !== 'none' && (
              <div className="flex items-center gap-0.5 text-amber-700 ml-auto shrink-0" title={getReminderLabel(event.reminder)}>
                <Bell className="w-2.5 h-2.5 text-amber-600" />
                <span>{getReminderLabel(event.reminder)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
