import React, { useState } from 'react';
import { UniversalEvent, EventType, LessonType, ReminderOption } from '../types';
import { X, Plus, Calendar, Clock, MapPin, User, FileText, Bell, Sparkles, BookOpen, UserCheck, AlertCircle } from 'lucide-react';

interface EventFormProps {
  isOpen: boolean;
  initialDate: string; // YYYY-MM-DD
  initialStartTime?: string; // HH:MM
  onClose: () => void;
  onCreate: (newEvent: UniversalEvent) => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  initialDate,
  initialStartTime = '11:10',
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [eventType, setEventType] = useState<EventType>('pair');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState('12:40');

  React.useEffect(() => {
    setDate(initialDate);
    setStartTime(initialStartTime);
  }, [initialDate, initialStartTime]);
  const [lessonType, setLessonType] = useState<LessonType>('lecture');
  const [teacher, setTeacher] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('Смольный проезд, д. 1, лит. Б');
  const [subgroup, setSubgroup] = useState('');
  const [isElective, setIsElective] = useState(false);
  const [note, setNote] = useState('');
  const [reminder, setReminder] = useState<ReminderOption>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const lessonTypeNameMap: Record<LessonType, string> = {
      lecture: 'Лекция',
      seminar: 'Семинар',
      practice: 'Практическое занятие',
      lab: 'Лабораторная работа',
      consultation: 'Консультация',
      exam: 'Зачет / Экзамен',
      other: 'Занятие',
    };

    const newEvent: UniversalEvent = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      date,
      startTime,
      endTime,
      eventType,
      lessonType: eventType === 'pair' ? lessonType : undefined,
      lessonTypeName: eventType === 'pair' ? lessonTypeNameMap[lessonType] : undefined,
      teacher: teacher.trim() || undefined,
      location: location.trim() || undefined,
      address: address.trim() || undefined,
      subgroup: subgroup.trim() || undefined,
      isElective: eventType === 'pair' ? isElective : false,
      note: note.trim() || undefined,
      reminder,
      source: 'manual',
      isUserModified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreate(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="event-form-container"
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">Добавить событие</h3>
              <p className="text-xs text-slate-500">Создание нового занятия или личного дела в календаре</p>
            </div>
          </div>
          <button
            id="close-add-modal-button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Type Switcher Segment */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/40 border-b border-slate-100">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Тип добавляемого события:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              id="type-btn-pair"
              onClick={() => setEventType('pair')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                eventType === 'pair'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Пара
            </button>
            <button
              type="button"
              id="type-btn-personal"
              onClick={() => setEventType('personal')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                eventType === 'personal'
                  ? 'bg-sky-600 border-sky-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Личное
            </button>
            <button
              type="button"
              id="type-btn-deadline"
              onClick={() => setEventType('deadline')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                eventType === 'deadline'
                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Дедлайн
            </button>
            <button
              type="button"
              id="type-btn-reminder"
              onClick={() => setEventType('reminder')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                eventType === 'reminder'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Напоминание
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название {eventType === 'pair' ? 'пары / предмета' : 'события'} <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-event-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                eventType === 'pair'
                  ? 'Например: Дипломатия данных'
                  : eventType === 'deadline'
                  ? 'Например: Сдать курсовую работу'
                  : 'Например: Встретиться с научным руководителем'
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Дата
              </label>
              <input
                id="create-event-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Начало
              </label>
              <input
                id="create-event-start"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Конец
              </label>
              <input
                id="create-event-end"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Pair-specific fields */}
          {eventType === 'pair' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Тип занятия
                  </label>
                  <select
                    id="create-event-lessontype"
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as LessonType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                  >
                    <option value="lecture">Лекция</option>
                    <option value="seminar">Семинар</option>
                    <option value="practice">Практическое занятие</option>
                    <option value="lab">Лабораторная работа</option>
                    <option value="consultation">Консультация</option>
                    <option value="exam">Зачет / Экзамен</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Подгруппа (если применимо)
                  </label>
                  <input
                    id="create-event-subgroup"
                    type="text"
                    value={subgroup}
                    onChange={(e) => setSubgroup(e.target.value)}
                    placeholder="Например: 4 (или пусто для всей группы)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Преподаватель
                  </label>
                  <input
                    id="create-event-teacher"
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="доц. Сытник А. Н."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Аудитория
                  </label>
                  <input
                    id="create-event-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="138 или 210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Адрес корпуса
                </label>
                <input
                  id="create-event-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Смольный проезд, д. 1, лит. Б"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="create-event-elective"
                  type="checkbox"
                  checked={isElective}
                  onChange={(e) => setIsElective(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="create-event-elective" className="text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Это элективная дисциплина
                </label>
              </div>
            </>
          )}

          {/* Location for personal events */}
          {eventType !== 'pair' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Место проведения (опционально)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Библиотека, Деканат, Онлайн..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Заметка
            </label>
            <textarea
              id="create-event-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Дополнительные детали, задания, материалы..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800 resize-y"
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              Напоминание
            </label>
            <select
              id="create-event-reminder"
              value={reminder}
              onChange={(e) => setReminder(e.target.value as ReminderOption)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            >
              <option value="none">Без напоминания</option>
              <option value="10min">За 10 минут</option>
              <option value="30min">За 30 минут</option>
              <option value="1hour">За 1 час</option>
              <option value="1day">За 1 день</option>
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              id="cancel-create-event-button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              id="submit-create-event-button"
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
