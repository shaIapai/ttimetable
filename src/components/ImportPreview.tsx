import React, { useState } from 'react';
import { ImportResult, ImportPreviewItem, FilterSettings } from '../types';
import {
  Check,
  CheckSquare,
  Square,
  Filter,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  ArrowRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { formatFullRussianDate, parseISODate } from '../utils/dateUtils';
import { getEventStyle } from '../utils/themeUtils';

interface ImportPreviewProps {
  importResult: ImportResult;
  userSettings: FilterSettings;
  onConfirm: (selectedItems: ImportPreviewItem[]) => void;
  onCancel: () => void;
  onSubgroupChange: (newSubgroup: string) => void;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  importResult,
  userSettings,
  onConfirm,
  onCancel,
  onSubgroupChange,
}) => {
  const [items, setItems] = useState<ImportPreviewItem[]>(importResult.items);
  const [activeSubgroup, setActiveSubgroup] = useState(userSettings.mySubgroup || '4');
  const [searchFilter, setSearchFilter] = useState('');

  // Toggle individual item
  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  // Select all / Deselect all
  const selectAll = (select: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.hasDateError && select ? item : { ...item, selected: select }))
    );
  };

  // Re-apply rules when user changes subgroup on the fly
  const applyRulesForSubgroup = (newSubgroup: string) => {
    setActiveSubgroup(newSubgroup);
    onSubgroupChange(newSubgroup);

    setItems((prev) =>
      prev.map((item) => {
        const ev = item.event;
        if (item.hasDateError) {
          return item;
        }

        let match = true;
        let reason = '✓ Подходит для расписания';

        if (ev.isElective) {
          if (userSettings.hideElectives) {
            match = false;
            reason = '✕ Электив (скрыт общей настройкой)';
          } else if (ev.subgroup) {
            if (newSubgroup && newSubgroup !== 'all') {
              if (ev.subgroup === newSubgroup) {
                match = true;
                reason = `✓ Моя подгруппа (${ev.subgroup}) [Электив]`;
              } else {
                match = false;
                reason = `✕ Электив другой подгруппы (${ev.subgroup})`;
              }
            } else {
              match = true;
              reason = `✓ Электив (подгруппа ${ev.subgroup})`;
            }
          } else {
            match = true;
            reason = '✓ Общий электив группы';
          }
        } else {
          if (ev.subgroup) {
            if (newSubgroup && newSubgroup !== 'all') {
              if (ev.subgroup === newSubgroup) {
                match = true;
                reason = `✓ Моя подгруппа (${ev.subgroup})`;
              } else {
                if (userSettings.hideOtherSubgroups) {
                  match = false;
                  reason = `✕ Другая подгруппа (${ev.subgroup})`;
                } else {
                  match = true;
                  reason = `Подгруппа ${ev.subgroup}`;
                }
              }
            } else {
              match = true;
              reason = `Подгруппа ${ev.subgroup}`;
            }
          } else {
            match = true;
            reason = '✓ Общее занятие группы';
          }
        }

        return {
          ...item,
          matchesUserRules: match,
          selected: match,
          reason,
        };
      })
    );
  };

  const selectedCount = items.filter((i) => i.selected).length;

  const filteredDisplayItems = items.filter((i) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      i.event.title.toLowerCase().includes(q) ||
      (i.event.teacher && i.event.teacher.toLowerCase().includes(q)) ||
      (i.event.subgroup && i.event.subgroup.includes(q)) ||
      (i.event.location && i.event.location.includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="import-preview-modal"
        className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-600 text-white rounded-md uppercase tracking-wider">
                Предпросмотр импорта
              </span>
              <h3 className="text-lg font-bold text-slate-900">{importResult.fileName}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Группа:{' '}
              <strong className="text-slate-700">{importResult.groupName || 'Группа не определена'}</strong> •
              Период: <strong className="text-slate-700">{importResult.dateRangeText}</strong>
            </p>
          </div>
          <button
            id="close-preview-button"
            onClick={onCancel}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning if year could not be determined */}
        {importResult.hasYearError && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong className="font-semibold">
                {importResult.yearErrorMessage || 'Не удалось определить год расписания.'}
              </strong>{' '}
              Строки без определенного года не выбраны к импорту для предотвращения ошибок в календаре.
            </span>
          </div>
        )}

        {/* Warning if date errors exist */}
        {!importResult.hasYearError && importResult.hasDateErrors && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Внимание: для некоторых строк в файле дату не удалось определить автоматически.
              Проверьте корректность расписания.
            </span>
          </div>
        )}

        {/* Requirement 8: Explicit statistics toolbar */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-700">
            <div>
              Найдено в файле:{' '}
              <strong className="text-slate-900 font-bold">{importResult.totalFound}</strong>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              Распознано занятий:{' '}
              <strong className="text-blue-900 font-bold">{importResult.recognizedCount}</strong>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              Отсеяно дубликатов:{' '}
              <strong className="text-amber-700 font-bold">{importResult.totalDuplicates}</strong>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              Выбрано к импорту:{' '}
              <strong className="text-emerald-700 font-bold">{selectedCount}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">Моя подгруппа:</span>
            <select
              id="preview-subgroup-select"
              value={activeSubgroup}
              onChange={(e) => applyRulesForSubgroup(e.target.value)}
              className="px-2 py-0.5 font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="1">Подгруппа 1{userSettings.mySubgroup === '1' ? ' (ваша)' : ''}</option>
              <option value="2">Подгруппа 2{userSettings.mySubgroup === '2' ? ' (ваша)' : ''}</option>
              <option value="3">Подгруппа 3{userSettings.mySubgroup === '3' ? ' (ваша)' : ''}</option>
              <option value="4">Подгруппа 4{userSettings.mySubgroup === '4' ? ' (ваша)' : ''}</option>
              <option value="all">Все подгруппы</option>
            </select>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="select-by-rules-button"
              onClick={() => applyRulesForSubgroup(activeSubgroup)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Выбрать по правилам (п/г {activeSubgroup})
            </button>
            <button
              type="button"
              id="select-all-preview-button"
              onClick={() => selectAll(true)}
              className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Выбрать все ({items.length})
            </button>
            <button
              type="button"
              id="deselect-all-preview-button"
              onClick={() => selectAll(false)}
              className="px-2.5 py-1.5 text-xs font-medium rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Снять все
            </button>
          </div>

          <div className="w-48">
            <input
              type="text"
              placeholder="Поиск в списке..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 bg-slate-50/50">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Выберите занятия, которые относятся к вам:
          </div>

          {filteredDisplayItems.map((item) => {
            const ev = item.event;
            const style = getEventStyle(ev);
            const dateObj = parseISODate(ev.date);

            return (
              <div
                key={item.id}
                id={`preview-item-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  item.selected
                    ? 'bg-white border-blue-400 shadow-xs ring-1 ring-blue-400/30'
                    : 'bg-slate-100/70 border-slate-200 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Custom Checkbox */}
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                    item.selected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                {/* Event summary info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 truncate">{ev.title}</span>

                    {ev.lessonTypeName && (
                      <span
                        className={`px-2 py-0.5 text-[11px] font-medium rounded-sm ${style.badgeBg}`}
                      >
                        {ev.lessonTypeName}
                      </span>
                    )}

                    {ev.subgroup ? (
                      <span
                        className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-sm border ${
                          ev.subgroup === activeSubgroup
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        Подгруппа {ev.subgroup}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[11px] font-medium rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                        Вся группа
                      </span>
                    )}

                    {ev.isElective && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-sm">
                        Электив
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-medium text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatFullRussianDate(dateObj)}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {ev.startTime}–{ev.endTime}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {ev.location}
                        {ev.address ? ` (${ev.address})` : ''}
                      </div>
                    )}
                    {ev.teacher && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {ev.teacher}
                      </div>
                    )}
                  </div>

                  {item.hasExistingNote && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-blue-700 font-medium">
                      <FileText className="w-3 h-3 text-blue-600" />
                      Сохранена существующая заметка: «{ev.note}»
                    </div>
                  )}

                  {item.hasDateError && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      {ev.dateErrorMessage || 'Дата не определена'}
                    </div>
                  )}
                </div>

                {/* Right badge: Match explanation */}
                <div className="text-right shrink-0 hidden sm:block">
                  <span
                    className={`text-[11px] px-2 py-1 rounded font-medium ${
                      item.matchesUserRules
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.reason}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredDisplayItems.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              По вашему поисковому запросу ничего не найдено.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Выбрано к импорту:{' '}
            <strong className="text-blue-700 font-bold text-sm">{selectedCount}</strong> из{' '}
            {items.length} занятий
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="cancel-import-button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              id="confirm-import-button"
              disabled={selectedCount === 0}
              onClick={() => onConfirm(items.filter((i) => i.selected))}
              className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors"
            >
              <span>Импортировать выбранные ({selectedCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
