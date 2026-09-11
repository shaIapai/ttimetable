import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, X, Play } from 'lucide-react';
import { parseExcelWorkbook } from '../services/excelParser';
import { generateDemoExcelBuffer } from '../services/demoData';
import { FilterSettings, ImportResult } from '../types';
import { StorageService } from '../services/storage';

interface ExcelImportModalProps {
  isOpen: boolean;
  userSettings: FilterSettings;
  onClose: () => void;
  onParsed: (result: ImportResult) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  userSettings,
  onClose,
  onParsed,
}) => {
  if (!isOpen) return null;

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Пожалуйста, выберите файл в формате Excel (.xlsx или .xls)');
      }

      const buffer = await file.arrayBuffer();
      const existingNotesMap = StorageService.getNotesMap();
      const result = parseExcelWorkbook(buffer, file.name, userSettings, existingNotesMap);

      if (result.totalFound === 0) {
        throw new Error('В файле не найдено занятий. Проверьте структуру колонок: Дата | Время | Название | Места | Преподаватели.');
      }

      onParsed(result);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Не удалось распознать файл расписания');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // One-click demo test
  const handleLoadDemoFile = () => {
    setIsLoading(true);
    setError(null);
    try {
      const buffer = generateDemoExcelBuffer();
      const existingNotesMap = StorageService.getNotesMap();
      const result = parseExcelWorkbook(
        buffer,
        'Расписание_университет_07-14_сент.xlsx',
        userSettings,
        existingNotesMap
      );
      onParsed(result);
    } catch (err: unknown) {
      setError('Ошибка при формировании тестового расписания');
    } finally {
      setIsLoading(false);
    }
  };

  // Download demo .xlsx file to Windows PC
  const handleDownloadDemoExcel = () => {
    try {
      const buffer = generateDemoExcelBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Расписание_университет_07-14_сент.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="excel-import-modal"
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">Импорт расписания из Excel</h3>
              <p className="text-xs text-slate-500">Автоматическое распознавание, очистка и фильтрация</p>
            </div>
          </div>
          <button
            id="close-import-modal-button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Dropzone */}
          <div
            id="excel-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 ring-4 ring-blue-500/10 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                Перетащите Excel-файл расписания сюда
              </p>
              <p className="text-xs text-slate-500">
                или нажмите для выбора файла на компьютере (.xlsx, .xls)
              </p>
            </div>
            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-semibold shadow-2xs hover:bg-slate-100 transition-colors">
              Выбрать файл с диска
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Section */}
          <div className="p-4 bg-slate-100/70 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Тестовый сценарий: демонстрационный Excel
              </div>
              <span className="text-[11px] text-slate-500 font-medium">7–14 сент. 2026</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Вы можете прямо сейчас протестировать импорт расписания с дисциплинами «Дипломатия данных», «Актуальные проблемы теории МО», элективами по английскому (подгруппы 1, 2, 4) и проверкой дубликатов.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                id="load-demo-import-button"
                disabled={isLoading}
                onClick={handleLoadDemoFile}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Протестировать импорт демо-файла
              </button>
              <button
                type="button"
                id="download-demo-excel-button"
                onClick={handleDownloadDemoExcel}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                title="Скачать реальный файл .xlsx для проверки перетаскивания"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Скачать образец .xlsx
              </button>
            </div>
          </div>

          {/* Guidelines */}
          <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-200 pt-3">
            <div className="font-semibold text-slate-700">Что умеет парсер расписания:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
              <li>Автоматически протягивает объединенные даты вниз по столбцу;</li>
              <li>Очищает технические переносы строк и лишние пробелы;</li>
              <li>Распознает типы (Лекция, Семинар, Практика) и подгруппы (1, 2, 4);</li>
              <li>Обнаруживает элективные курсы и исключает дубликаты;</li>
              <li>Сохраняет ваши существующие личные заметки к предметам.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
