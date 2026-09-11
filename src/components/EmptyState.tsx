import React from 'react';
import { Calendar, Upload, Plus, FileSpreadsheet, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenImport: () => void;
  onOpenAdd: () => void;
  onLoadDemo: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenImport,
  onOpenAdd,
  onLoadDemo,
}) => {
  return (
    <div
      id="empty-schedule-state"
      className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 text-center select-none"
    >
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
        {/* App Logo & Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
          <Calendar className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Моё расписание
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            Расписание пока пустое.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Загрузите Excel-файл из университета или добавьте первую пару вручную.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            id="empty-state-import-btn"
            onClick={onOpenImport}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            Импортировать Excel
          </button>

          <button
            type="button"
            id="empty-state-add-btn"
            onClick={onOpenAdd}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            Добавить пару вручную
          </button>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              id="empty-state-demo-btn"
              onClick={onLoadDemo}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Загрузить демонстрационное расписание
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
