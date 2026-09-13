import React, { useState } from 'react';
import { FilterSettings } from '../types';
import { X, Settings, ShieldCheck, Download, Upload, RotateCcw, Trash2, Check } from 'lucide-react';
import { StorageService } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  settings: FilterSettings;
  onClose: () => void;
  onSaveSettings: (newSettings: FilterSettings) => void;
  onResetDemo: () => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
  onResetDemo,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<FilterSettings>({ ...settings });
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleToggle = (key: keyof FilterSettings) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      onSaveSettings(updated);
      return updated;
    });
  };

  const handleSubgroupChange = (subgroup: string) => {
    const updated = { ...formData, mySubgroup: subgroup };
    setFormData(updated);
    onSaveSettings(updated);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_schedule_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupStatus('Резервная копия успешно экспортирована');
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importBackup(content);
      if (res.success) {
        setBackupStatus(`Восстановлено ${res.count} событий! Перезагрузка...`);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setBackupStatus('Ошибка при чтении файла бэкапа');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="settings-modal"
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">Настройки расписания</h3>
              <p className="text-xs text-slate-500">Параметры фильтрации подгрупп, элективов и хранилища</p>
            </div>
          </div>
          <button
            id="close-settings-modal-button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto text-sm">
          {/* Subgroup setting */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <label className="block text-xs font-bold text-blue-900 mb-1">
              Моя академическая подгруппа:
            </label>
            <p className="text-xs text-slate-600 mb-3">
              Используется для автоматического отбора пар при импорте и скрытия чужих пар в календаре.
            </p>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', 'all'].map((sg) => (
                <button
                  key={sg}
                  type="button"
                  id={`subgroup-choice-${sg}`}
                  onClick={() => handleSubgroupChange(sg)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    formData.mySubgroup === sg
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sg === 'all' ? 'Показывать все' : `Подгруппа ${sg}${sg === '4' ? ' (ваша)' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Rules checkboxes */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Правила отображения и фильтрации
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.hideOtherSubgroups}
                onChange={() => handleToggle('hideOtherSubgroups')}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  Скрывать занятия других подгрупп
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Если у занятия указана подгруппа, отличная от выбранной вами, оно будет скрыто (общие занятия для всей группы показываются всегда).
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.hideOtherElectives}
                onChange={() => handleToggle('hideOtherElectives')}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  Скрывать элективы других подгрупп
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Не показывать в календаре элективные дисциплины, записанные на чужие подгруппы.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.hideDuplicates}
                onChange={() => handleToggle('hideDuplicates')}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  Скрывать точные дубликаты пар
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Автоматически объединять занятия с совпадающими датой, временем, названием и преподавателем.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={formData.showPersonalEvents}
                onChange={() => handleToggle('showPersonalEvents')}
                className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-slate-800 text-xs">
                  Отображать личные события и дедлайны
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Показывать созданные вручную заметки, дедлайны и персональные планы в сетке расписания.
                </div>
              </div>
            </label>
          </div>

          {/* Backup & Storage */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Управление данными (localStorage)
            </div>

            {backupStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                {backupStatus}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                id="export-backup-button"
                onClick={handleExportBackup}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Экспорт резервной копии (JSON)
              </button>

              <label className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Импорт из JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                id="reset-demo-button"
                onClick={() => {
                  if (window.confirm('Сбросить расписание на демонстрационный пример?')) {
                    onResetDemo();
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Восстановить демо-расписание
              </button>

              <button
                type="button"
                id="clear-all-events-button"
                onClick={() => {
                  if (window.confirm('Вы действительно хотите очистить все расписание и проверить стартовый экран?')) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Очистить всё расписание (пустой экран)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
