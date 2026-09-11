import React, { useState, useEffect } from 'react';
import { UniversalEvent, LessonType, ReminderOption, EventType } from '../types';
import { X, Trash2, Copy, Save, Calendar, Clock, MapPin, User, FileText, Bell, Sparkles } from 'lucide-react';

interface EventModalProps {
  event: UniversalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: UniversalEvent) => void;
  onDelete: (id: string) => void;
  onDuplicate: (event: UniversalEvent) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  if (!isOpen || !event) return null;

  const [formData, setFormData] = useState<UniversalEvent>({ ...event });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setFormData({ ...event });
    setConfirmDelete(false);
  }, [event]);

  const handleChange = (field: keyof UniversalEvent, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Keep lessonTypeName in sync
      if (field === 'lessonType') {
        const typeMap: Record<LessonType, string> = {
          lecture: 'Лекция',
          seminar: 'Семинар',
          practice: 'Практическое занятие',
          lab: 'Лабораторная работа',
          consultation: 'Консультация',
          exam: 'Зачет / Экзамен',
          other: 'Другое',
        };
        updated.lessonTypeName = typeMap[value as LessonType] || 'Занятие';
      }
      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSave({
      ...formData,
      isUserModified: true,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="event-modal-container"
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Windows-style clean styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {formData.eventType === 'pair' ? 'Редактирование занятия' : 'Редактирование события'}
              </h3>
              <p className="text-xs text-slate-500">
                {formData.source === 'imported'
                  ? `Импортировано из ${formData.importedFrom || 'Excel'}`
                  : 'Создано вручную'}
              </p>
            </div>
          </div>
          <button
            id="close-event-modal-button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название <span className="text-rose-500">*</span>
            </label>
            <input
              id="event-title-input"
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Название предмета или события"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-800"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Дата
              </label>
              <input
                id="event-date-input"
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Начало
              </label>
              <input
                id="event-starttime-input"
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Конец
              </label>
              <input
                id="event-endtime-input"
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Event and Lesson Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Категория события
              </label>
              <select
                id="event-category-select"
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value as EventType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
              >
                <option value="pair">Пара (занятие университета)</option>
                <option value="personal">Личное событие</option>
                <option value="deadline">Дедлайн</option>
                <option value="reminder">Напоминание</option>
              </select>
            </div>

            {formData.eventType === 'pair' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Тип занятия
                </label>
                <select
                  id="event-lessontype-select"
                  value={formData.lessonType || 'lecture'}
                  onChange={(e) => handleChange('lessonType', e.target.value as LessonType)}
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
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Подтип события
                </label>
                <input
                  type="text"
                  value={formData.lessonTypeName || ''}
                  onChange={(e) => handleChange('lessonTypeName', e.target.value)}
                  placeholder="Например: Встреча, Подготовка, Покупка"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Teacher, Subgroup, Elective (for pairs) */}
          {formData.eventType === 'pair' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Преподаватель
                </label>
                <input
                  id="event-teacher-input"
                  type="text"
                  value={formData.teacher || ''}
                  onChange={(e) => handleChange('teacher', e.target.value)}
                  placeholder="ФИО преподавателя"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Подгруппа
                </label>
                <input
                  id="event-subgroup-input"
                  type="text"
                  value={formData.subgroup || ''}
                  onChange={(e) => handleChange('subgroup', e.target.value || undefined)}
                  placeholder="Вся группа или № (напр. 4)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Elective checkbox */}
          {formData.eventType === 'pair' && (
            <div className="flex items-center gap-2 py-1">
              <input
                id="event-elective-checkbox"
                type="checkbox"
                checked={Boolean(formData.isElective)}
                onChange={(e) => handleChange('isElective', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="event-elective-checkbox" className="text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Это элективная дисциплина (по выбору)
              </label>
            </div>
          )}

          {/* Location & Address */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Аудитория
              </label>
              <input
                id="event-location-input"
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Напр. 138 или 210"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Адрес здания
              </label>
              <input
                id="event-address-input"
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Смольный проезд, д. 1, лит. Б"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Личная заметка к паре (сохраняется при повторном импорте Excel)
            </label>
            <textarea
              id="event-note-input"
              rows={3}
              value={formData.note || ''}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Например: Прочитать статью Энтмана к семинару, взять презентацию..."
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
              id="event-reminder-select"
              value={formData.reminder || 'none'}
              onChange={(e) => handleChange('reminder', e.target.value as ReminderOption)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-2xs focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            >
              <option value="none">Без напоминания</option>
              <option value="10min">За 10 минут</option>
              <option value="30min">За 30 минут</option>
              <option value="1hour">За 1 час</option>
              <option value="1day">За 1 день</option>
            </select>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!confirmDelete ? (
                <button
                  type="button"
                  id="delete-event-button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-md">
                  <span className="text-[11px] text-rose-700 font-medium px-1">Удалить?</span>
                  <button
                    type="button"
                    id="confirm-delete-button"
                    onClick={() => {
                      onDelete(formData.id);
                      onClose();
                    }}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-sm font-medium transition-colors"
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-sm transition-colors"
                  >
                    Нет
                  </button>
                </div>
              )}

              <button
                type="button"
                id="duplicate-event-button"
                onClick={() => {
                  onDuplicate(formData);
                  onClose();
                }}
                className="px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Создать копию занятия"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                Копия
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-event-edit-button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                id="save-event-button"
                className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
