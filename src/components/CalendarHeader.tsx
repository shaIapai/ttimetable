import React from 'react';
import { CalendarViewMode, FilterSettings } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Upload,
  Search,
  Filter,
  Layers,
  CalendarDays,
  List,
} from 'lucide-react';
import { formatWeekRange, formatFullRussianDate } from '../utils/dateUtils';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onOpenImport: () => void;
  onOpenAdd: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userSettings: FilterSettings;
  onSubgroupQuickChange: (subgroup: string) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenImport,
  onOpenAdd,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  userSettings,
  onSubgroupQuickChange,
}) => {
  const weekRangeText = formatWeekRange(currentDate);

  return (
    <div
      id="calendar-header"
      className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col gap-3 shrink-0 shadow-2xs"
    >
      {/* Upper toolbar row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left section: App Title & Quick Subgroup Badge */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                Моё расписание
              </h1>
              <span className="text-[11px] text-slate-500 font-medium">
                Группа 26.М16-мо • Личный календарь
              </span>
            </div>
          </div>

          {/* Quick Subgroup Pill */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs transition-colors">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="text-slate-600 font-medium">Подгруппа:</span>
            <select
              id="header-quick-subgroup"
              value={userSettings.mySubgroup}
              onChange={(e) => onSubgroupQuickChange(e.target.value)}
              className="bg-transparent font-bold text-blue-700 cursor-pointer focus:outline-hidden"
              title="Фильтрация занятий по вашей подгруппе"
            >
              <option value="4">4 (ваша)</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="all">Все</option>
            </select>
          </div>
        </div>

        {/* Center section: Week Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
            <button
              id="prev-week-button"
              type="button"
              onClick={onPrevWeek}
              className="w-8 h-8 rounded-md hover:bg-white hover:shadow-2xs text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all"
              title="Предыдущая неделя (горячая клавиша P)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="today-button"
              type="button"
              onClick={onToday}
              className="px-3 h-8 rounded-md hover:bg-white hover:shadow-2xs text-slate-700 hover:text-slate-900 text-xs font-bold transition-all"
              title="Перейти к текущей дате (горячая клавиша T)"
            >
              Сегодня
            </button>
            <button
              id="next-week-button"
              type="button"
              onClick={onNextWeek}
              className="w-8 h-8 rounded-md hover:bg-white hover:shadow-2xs text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all"
              title="Следующая неделя (горячая клавиша N)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="font-bold text-sm text-slate-800 px-2 select-none">
            {viewMode === 'day' ? formatFullRussianDate(currentDate) : weekRangeText}
          </div>
        </div>

        {/* Right section: Import, Add, Settings */}
        <div className="flex items-center gap-2">
          <button
            id="import-schedule-button"
            type="button"
            onClick={onOpenImport}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all"
            title="Загрузить файл расписания Excel из университета"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Импорт расписания</span>
            <span className="sm:hidden">Импорт</span>
          </button>

          <button
            id="add-event-button"
            type="button"
            onClick={onOpenAdd}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            title="Добавить занятие или личное событие вручную"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Добавить</span>
          </button>
        </div>
      </div>

      {/* Lower row: Views (Неделя / День / Месяц / Список) + Search box */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs">
          <button
            id="viewmode-week-button"
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'week'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Неделя
          </button>
          <button
            id="viewmode-day-button"
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'day'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            День
          </button>
          <button
            id="viewmode-month-button"
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'month'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Месяц
          </button>
          <button
            id="viewmode-list-button"
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Список
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-64 max-w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="schedule-search-input"
            type="text"
            placeholder="Поиск по предмету, ауд., заметкам..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-md shadow-2xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
