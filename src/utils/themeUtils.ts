import { UniversalEvent } from '../types';

export interface StyleConfig {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}

export function getEventStyle(event: UniversalEvent): StyleConfig {
  if (event.eventType === 'deadline') {
    return {
      bg: 'bg-rose-50 hover:bg-rose-100/90',
      border: 'border-rose-300',
      text: 'text-rose-950',
      badgeBg: 'bg-rose-200 text-rose-800',
      badgeText: 'text-rose-700',
      dotColor: 'bg-rose-500',
    };
  }

  if (event.eventType === 'personal') {
    return {
      bg: 'bg-sky-50 hover:bg-sky-100/90',
      border: 'border-sky-300',
      text: 'text-sky-950',
      badgeBg: 'bg-sky-200 text-sky-800',
      badgeText: 'text-sky-700',
      dotColor: 'bg-sky-500',
    };
  }

  if (event.eventType === 'reminder') {
    return {
      bg: 'bg-amber-50 hover:bg-amber-100/90',
      border: 'border-amber-300',
      text: 'text-amber-950',
      badgeBg: 'bg-amber-200 text-amber-800',
      badgeText: 'text-amber-700',
      dotColor: 'bg-amber-500',
    };
  }

  // University pair styles by lesson type
  switch (event.lessonType) {
    case 'lecture':
      return {
        bg: 'bg-blue-50/90 hover:bg-blue-100/90',
        border: 'border-blue-300',
        text: 'text-blue-950',
        badgeBg: 'bg-blue-100 text-blue-800',
        badgeText: 'text-blue-700',
        dotColor: 'bg-blue-600',
      };
    case 'seminar':
      return {
        bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
        border: 'border-emerald-300',
        text: 'text-emerald-950',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        badgeText: 'text-emerald-700',
        dotColor: 'bg-emerald-600',
      };
    case 'practice':
      return {
        bg: 'bg-amber-50/90 hover:bg-amber-100/90',
        border: 'border-amber-300',
        text: 'text-amber-950',
        badgeBg: 'bg-amber-100 text-amber-800',
        badgeText: 'text-amber-700',
        dotColor: 'bg-amber-600',
      };
    case 'lab':
      return {
        bg: 'bg-purple-50/90 hover:bg-purple-100/90',
        border: 'border-purple-300',
        text: 'text-purple-950',
        badgeBg: 'bg-purple-100 text-purple-800',
        badgeText: 'text-purple-700',
        dotColor: 'bg-purple-600',
      };
    case 'consultation':
      return {
        bg: 'bg-teal-50/90 hover:bg-teal-100/90',
        border: 'border-teal-300',
        text: 'text-teal-950',
        badgeBg: 'bg-teal-100 text-teal-800',
        badgeText: 'text-teal-700',
        dotColor: 'bg-teal-600',
      };
    case 'exam':
      return {
        bg: 'bg-red-50/90 hover:bg-red-100/90',
        border: 'border-red-400',
        text: 'text-red-950',
        badgeBg: 'bg-red-200 text-red-900',
        badgeText: 'text-red-800',
        dotColor: 'bg-red-600',
      };
    default:
      return {
        bg: 'bg-slate-50 hover:bg-slate-100',
        border: 'border-slate-300',
        text: 'text-slate-900',
        badgeBg: 'bg-slate-200 text-slate-800',
        badgeText: 'text-slate-700',
        dotColor: 'bg-slate-500',
      };
  }
}

export function getReminderLabel(reminder?: string): string {
  switch (reminder) {
    case '10min':
      return 'За 10 минут';
    case '30min':
      return 'За 30 минут';
    case '1hour':
      return 'За 1 час';
    case '1day':
      return 'За 1 день';
    default:
      return 'Без напоминания';
  }
}
