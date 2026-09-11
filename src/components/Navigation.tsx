import React, { useState } from 'react';
import { CalendarViewMode } from '../types';
import {
  Calendar,
  ListTodo,
  Upload,
  Settings as SettingsIcon,
  Maximize2,
  Minus,
  X,
  Keyboard,
  Info,
} from 'lucide-react';

interface NavigationProps {
  currentTab: 'schedule' | 'events' | 'import' | 'settings';
  onTabChange: (tab: 'schedule' | 'events' | 'import' | 'settings') => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onViewModeChange?: (mode: CalendarViewMode) => void;
  eventsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenImport,
  onOpenSettings,
  eventsCount,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      id="app-navigation-bar"
      className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex items-center justify-between select-none shrink-0 border-b border-slate-800"
    >
      {/* Left: Window Title & Brand Icon */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold tracking-tight text-white">
          <div className="w-4 h-4 rounded-xs bg-blue-500 flex items-center justify-center text-white">
            <Calendar className="w-2.5 h-2.5" />
          </div>
          <span>Расписание студента</span>
          <span className="text-[10px] font-normal px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-xs border border-slate-700">
            v0.1 Windows
          </span>
        </div>

        {/* Primary Tab Navigation */}
        <div className="flex items-center gap-1 ml-4 border-l border-slate-800 pl-4">
          <button
            id="nav-tab-schedule"
            type="button"
            onClick={() => onTabChange('schedule')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              currentTab === 'schedule'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Расписание</span>
          </button>

          <button
            id="nav-tab-events"
            type="button"
            onClick={() => onTabChange('events')}
            className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              currentTab === 'events'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>События и заметки</span>
            <span className="px-1 text-[10px] rounded-full bg-slate-700 text-slate-300">
              {eventsCount}
            </span>
          </button>

          <button
            id="nav-tab-import"
            type="button"
            onClick={() => onOpenImport()}
            className="px-3 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Импорт Excel</span>
          </button>

          <button
            id="nav-tab-settings"
            type="button"
            onClick={() => onOpenSettings()}
            className="px-3 py-1 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 flex items-center gap-1.5 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Настройки</span>
          </button>
        </div>
      </div>

      {/* Right: Window Controls & Keyboard Shortcuts */}
      <div className="flex items-center gap-2">
        {/* Shortcuts helper modal toggle */}
        <button
          id="shortcuts-toggle-btn"
          type="button"
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
          title="Горячие клавиши (T, N, P, A, I)"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {showShortcuts && (
          <div className="absolute right-14 top-9 z-50 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1.5 w-64">
            <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-1">
              <span>Горячие клавиши</span>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Сегодня:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">T</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">След. неделя:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Пред. неделя:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">P</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Добавить пару:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">A</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Импорт Excel:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">I</kbd>
            </div>
          </div>
        )}

        {/* Decorative Windows-like window buttons */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
          <button
            type="button"
            className="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Свернуть"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Во весь экран (F11 / Оконный режим)"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
