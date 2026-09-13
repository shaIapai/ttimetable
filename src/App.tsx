import React, { useState, useEffect, useCallback } from 'react';
import {
  UniversalEvent,
  FilterSettings,
  CalendarViewMode,
  ImportResult,
  ImportPreviewItem,
} from './types';
import { StorageService } from './services/storage';
import { FilterService } from './services/filterService';
import { getMondayOfWeek, formatISODate, parseISODate } from './utils/dateUtils';
import { Navigation } from './components/Navigation';
import { CalendarHeader } from './components/CalendarHeader';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { MonthView } from './components/MonthView';
import { EventsListView } from './components/EventsListView';
import { EventModal } from './components/EventModal';
import { EventForm } from './components/EventForm';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ImportPreview } from './components/ImportPreview';
import { SettingsModal } from './components/SettingsModal';
import { EmptyState } from './components/EmptyState';

export default function App() {
  // 1. Persistent state: Events & Settings
  const [events, setEvents] = useState<UniversalEvent[]>(() => StorageService.getEvents());
  const [settings, setSettings] = useState<FilterSettings>(() => StorageService.getSettings());

  // 2. View & Navigation state
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const initialEvents = StorageService.getEvents();
    if (initialEvents.length > 0) {
      const todayIso = formatISODate(new Date());
      const hasToday = initialEvents.some((e) => e.date === todayIso);
      if (hasToday) return new Date();

      const upcoming = initialEvents.find((e) => e.date >= todayIso);
      if (upcoming) {
        return parseISODate(upcoming.date);
      }
      return parseISODate(initialEvents[0].date);
    }
    return new Date();
  });
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [activeTab, setActiveTab] = useState<'schedule' | 'events' | 'import' | 'settings'>('schedule');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. Modals state
  const [selectedEvent, setSelectedEvent] = useState<UniversalEvent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialDate, setAddModalInitialDate] = useState(() => formatISODate(new Date()));
  const [addModalInitialTime, setAddModalInitialTime] = useState('11:10');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Compute Monday for current week view
  const mondayDate = getMondayOfWeek(currentDate);

  // Filter events according to user rules and search query
  const filteredEvents = FilterService.filterEvents(events, settings, searchQuery);

  // Navigation handlers
  const handlePrevWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }, []);

  const handleToday = useCallback(() => {
    // Navigate to actual current computer date (Requirement 14)
    setCurrentDate(new Date());
  }, []);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }, []);

  // Keyboard Shortcuts (T, N, P, A, I, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        return;
      }

      if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') {
        handleToday();
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т') {
        handleNextWeek();
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        handlePrevWeek();
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        setAddModalInitialDate(formatISODate(currentDate));
        setIsAddModalOpen(true);
      } else if (e.key === 'i' || e.key === 'I' || e.key === 'ш' || e.key === 'Ш') {
        setIsImportModalOpen(true);
      } else if (e.key === 'Escape') {
        setSelectedEvent(null);
        setIsAddModalOpen(false);
        setIsImportModalOpen(false);
        setImportResult(null);
        setIsSettingsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, handleNextWeek, handlePrevWeek, handleToday]);

  // Event handlers
  const handleSaveEvent = (updated: UniversalEvent) => {
    const nextList = StorageService.upsertEvent(updated);
    setEvents([...nextList]);
  };

  const handleDeleteEvent = (id: string) => {
    const nextList = StorageService.deleteEvent(id);
    setEvents([...nextList]);
  };

  const handleDuplicateEvent = (eventToCopy: UniversalEvent) => {
    const duplicate: UniversalEvent = {
      ...eventToCopy,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${eventToCopy.title} (копия)`,
      importKey: undefined,
      source: 'manual',
      isUserModified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const nextList = StorageService.upsertEvent(duplicate);
    setEvents([...nextList]);
  };

  const handleCreateEvent = (newEvent: UniversalEvent) => {
    const nextList = StorageService.upsertEvent(newEvent);
    setEvents([...nextList]);
  };

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    setAddModalInitialDate(dateStr);
    setAddModalInitialTime(timeStr);
    setIsAddModalOpen(true);
  };

  const handleSelectDay = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  // Import flow
  const handleExcelParsed = (result: ImportResult) => {
    setIsImportModalOpen(false);
    setImportResult(result);
  };

  const handleConfirmImport = (selectedItems: ImportPreviewItem[]) => {
    const newImportedEvents = selectedItems.map((item) => item.event);

    // Merge with existing schedule (additive import, preserves other weeks and user edits)
    const mergeResult = StorageService.mergeImportedEvents(newImportedEvents);
    setEvents([...mergeResult.events]);
    setImportResult(null);

    // Switch view to the date of first imported event
    if (newImportedEvents.length > 0) {
      const firstDate = newImportedEvents[0].date;
      setCurrentDate(parseISODate(firstDate));
    }
  };

  // Quick subgroup change from header
  const handleSubgroupChange = (newSubgroup: string) => {
    const updated = { ...settings, mySubgroup: newSubgroup };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleSaveSettings = (newSettings: FilterSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleResetDemo = () => {
    const demo = StorageService.resetToDemo();
    setEvents([...demo]);
    setSettings(StorageService.getSettings());
    if (demo.length > 0) {
      setCurrentDate(parseISODate(demo[0].date));
    }
  };

  const handleClearAll = () => {
    StorageService.clearAllEvents();
    setEvents([]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 font-sans text-slate-900 overflow-hidden select-none">
      {/* 1. Windows App Top Navigation Bar */}
      <Navigation
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'import') setIsImportModalOpen(true);
          if (tab === 'settings') setIsSettingsModalOpen(true);
        }}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        eventsCount={events.length}
      />

      {/* 2. Main Calendar Content Area */}
      {activeTab === 'events' ? (
        <EventsListView
          events={filteredEvents}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
          onAddEvent={() => {
            setAddModalInitialDate(formatISODate(currentDate));
            setIsAddModalOpen(true);
          }}
        />
      ) : events.length === 0 ? (
        <EmptyState
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenAdd={() => {
            setAddModalInitialDate(formatISODate(currentDate));
            setIsAddModalOpen(true);
          }}
          onLoadDemo={handleResetDemo}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Calendar Navigation Header */}
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onToday={handleToday}
            onDateChange={setCurrentDate}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenAdd={() => {
              setAddModalInitialDate(formatISODate(currentDate));
              setIsAddModalOpen(true);
            }}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            userSettings={settings}
            onSubgroupQuickChange={handleSubgroupChange}
          />

          {/* Active View Mode */}
          {viewMode === 'week' && (
            <WeekView
              mondayDate={mondayDate}
              events={filteredEvents}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onSelectDay={handleSelectDay}
              onSlotClick={handleSlotClick}
              timeStartHour={settings.timeRangeStart || 8}
              timeEndHour={settings.timeRangeEnd || 20}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onToday={handleToday}
              onAddEvent={(dateStr) => {
                setAddModalInitialDate(dateStr);
                setIsAddModalOpen(true);
              }}
              onBackToWeek={() => setViewMode('week')}
            />
          )}

          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onSelectDay={handleSelectDay}
            />
          )}

          {viewMode === 'list' && (
            <EventsListView
              events={filteredEvents}
              onSelectEvent={(ev) => setSelectedEvent(ev)}
              onAddEvent={() => {
                setAddModalInitialDate(formatISODate(currentDate));
                setIsAddModalOpen(true);
              }}
            />
          )}
        </div>
      )}

      {/* 3. Modals */}
      {/* Event View & Edit Modal */}
      <EventModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicateEvent}
      />

      {/* Add New Event Form */}
      <EventForm
        isOpen={isAddModalOpen}
        initialDate={addModalInitialDate}
        initialStartTime={addModalInitialTime}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreateEvent}
      />

      {/* Excel Upload Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        userSettings={settings}
        onClose={() => setIsImportModalOpen(false)}
        onParsed={handleExcelParsed}
      />

      {/* Import Preview Modal */}
      {importResult && (
        <ImportPreview
          importResult={importResult}
          userSettings={settings}
          onConfirm={handleConfirmImport}
          onCancel={() => setImportResult(null)}
          onSubgroupChange={handleSubgroupChange}
        />
      )}

      {/* Filter & Preferences Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={handleSaveSettings}
        onResetDemo={handleResetDemo}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
