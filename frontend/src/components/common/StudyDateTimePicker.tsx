import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Zap,
  CalendarCheck
} from 'lucide-react';

interface StudyDateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  align?: 'left' | 'right' | 'auto';
}

export const StudyDateTimePicker: React.FC<StudyDateTimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  align = 'auto'
}) => {
  const { language: currentLanguage, t } = useLanguage();
  const resolvedLabel = label !== undefined ? label : t('datetime.default_label');
  const resolvedPlaceholder = placeholder !== undefined ? placeholder : t('datetime.placeholder');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRightAligned, setIsRightAligned] = useState(false);

  // Parse initial or default date
  const initialDate = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = useState<Date>(() => initialDate || new Date());
  const [selectedHour, setSelectedHour] = useState<number>(() => (initialDate ? initialDate.getHours() : 23));
  const [selectedMinute, setSelectedMinute] = useState<number>(() => (initialDate ? initialDate.getMinutes() : 59));
  const [currentMonthView, setCurrentMonthView] = useState<Date>(() => (initialDate ? new Date(initialDate.getFullYear(), initialDate.getMonth(), 1) : new Date()));

  // Synchronize when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  // Determine alignment when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === 'right') {
        setIsRightAligned(true);
      } else if (align === 'left') {
        setIsRightAligned(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.left + 460 > window.innerWidth) {
          setIsRightAligned(true);
        } else {
          setIsRightAligned(false);
        }
      }
    }
  }, [isOpen, align]);

  // Click outside & Escape to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Format Helper
  const formatDisplay = (val?: string) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';

    const daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days = currentLanguage === 'vi' ? daysVi : daysEn;
    const dayName = days[d.getDay()];
    const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

    return `${dayName}, ${dateStr} • ${timeStr}`;
  };

  // Commit value change
  const applyDateTime = (dateObj: Date, hour: number, minute: number) => {
    const d = new Date(dateObj);
    d.setHours(hour, minute, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${hh}:${mm}`;
    onChange(formatted);
  };

  // Presets (Simplified to top 4 most common)
  const applyPreset = (presetType: string) => {
    const now = new Date();
    let target = new Date();
    let h = 23;
    let m = 59;

    switch (presetType) {
      case 'TODAY_END':
        h = 23;
        m = 59;
        break;
      case 'TOMORROW_MORNING':
        target.setDate(target.getDate() + 1);
        h = 8;
        m = 0;
        break;
      case 'TOMORROW_END':
        target.setDate(target.getDate() + 1);
        h = 23;
        m = 59;
        break;
      case 'WEEKEND_END': {
        const day = now.getDay();
        const daysToSunday = day === 0 ? 0 : 7 - day;
        target.setDate(target.getDate() + daysToSunday);
        h = 23;
        m = 59;
        break;
      }
    }

    setSelectedDate(target);
    setSelectedHour(h);
    setSelectedMinute(m);
    setCurrentMonthView(new Date(target.getFullYear(), target.getMonth(), 1));
    applyDateTime(target, h, m);
  };

  // Calendar matrix generator
  const year = currentMonthView.getFullYear();
  const month = currentMonthView.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const nextMonthDays = [];
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push(i);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {resolvedLabel && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--type-small)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <CalendarCheck size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>{resolvedLabel} {required && '*'}</span>
          </span>
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${resolvedLabel}: ${value ? formatDisplay(value) : resolvedPlaceholder}`}
        className="snote-card"
        style={{
          width: '100%',
          textAlign: 'left',
          font: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: isOpen ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
          backgroundColor: value ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px var(--accent-subtle)' : 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: value ? 'var(--accent-subtle)' : 'rgba(255, 255, 255, 0.05)',
              color: value ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Clock size={15} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            {value ? (
              <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formatDisplay(value)}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
                {resolvedPlaceholder}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange('');
                }
              }}
              className="btn btn-ghost btn-icon btn-sm"
              style={{ padding: '3px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title={t('datetime.clear_tooltip')}
              aria-label={t('datetime.clear_tooltip')}
            >
              <X size={13} />
            </span>
          )}
          <span
            style={{
              fontSize: 'var(--type-caption)',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              backgroundColor: 'var(--accent-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {isOpen ? t('datetime.selecting') : t('datetime.change_time')}
          </span>
        </div>
      </button>

      {/* Streamlined, Decluttered Chronos Popover (No visual overload) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={resolvedLabel}
          className="snote-card animate-scale-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: isRightAligned ? 'auto' : 0,
            right: isRightAligned ? 0 : 'auto',
            width: '460px',
            maxWidth: 'min(490px, 92vw)',
            zIndex: 99999,
            padding: '16px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-card)',
            border: '1.5px solid var(--accent-primary)',
            boxShadow: '0 16px 44px rgba(0, 0, 0, 0.35), 0 0 24px rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backdropFilter: 'blur(24px)'
          }}
        >
          {/* 1. Simplified Quick Presets Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '2px' }}>
              <Zap size={12} style={{ color: 'var(--color-warning)' }} />
              {t('datetime.quick_label')}
            </span>
            <button
              type="button"
              onClick={() => applyPreset('TODAY_END')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              {t('datetime.tonight')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('TOMORROW_MORNING')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              {t('datetime.tomorrow_morning')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('TOMORROW_END')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              {t('datetime.tomorrow_night')}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('WEEKEND_END')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              {t('datetime.weekend')}
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

          {/* 2. Calendar & Time Selector Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '16px' }}>
            {/* Left: Clean Month Calendar */}
            <div>
              {/* Month Navigator Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentMonthView(new Date(year, month - 1, 1))}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ padding: '4px' }}
                >
                  <ChevronLeft size={15} />
                </button>

                <div style={{ fontSize: 'var(--type-small)', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentLanguage === 'vi' ? `Tháng ${month + 1}, ${year}` : `${new Date(year, month).toLocaleString('en-US', { month: 'short' })} ${year}`}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentMonthView(new Date(year, month + 1, 1))}
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ padding: '4px' }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Day of week header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '2px', marginBottom: '4px' }}>
                {(currentLanguage === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map((d, i) => (
                  <span key={i} style={{ fontSize: 'var(--type-caption)', fontWeight: 700, color: i >= 5 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                {prevMonthDays.map((d, i) => (
                  <div
                    key={`prev-${i}`}
                    style={{
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--type-caption)',
                      color: 'var(--border-color)',
                      opacity: 0.35
                    }}
                  >
                    {d}
                  </div>
                ))}

                {currentMonthDays.map((dayNum) => {
                  const isSelected =
                    selectedDate.getDate() === dayNum &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  const isToday =
                    new Date().getDate() === dayNum &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        const newD = new Date(year, month, dayNum);
                        setSelectedDate(newD);
                        applyDateTime(newD, selectedHour, selectedMinute);
                      }}
                      style={{
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        border: isToday && !isSelected ? '1px solid var(--accent-primary)' : 'none',
                        backgroundColor: isSelected
                          ? 'var(--accent-primary)'
                          : isToday
                          ? 'var(--accent-subtle)'
                          : 'transparent',
                        color: isSelected
                          ? '#ffffff'
                          : isToday
                          ? 'var(--accent-primary)'
                          : 'var(--text-primary)',
                        fontWeight: isSelected || isToday ? 800 : 500,
                        fontSize: 'var(--type-small)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {dayNum}
                    </button>
                  );
                })}

                {nextMonthDays.map((d, i) => (
                  <div
                    key={`next-${i}`}
                    style={{
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--type-caption)',
                      color: 'var(--border-color)',
                      opacity: 0.35
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Clean Academic Time Slots & Exact Stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Digital Display */}
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 600 }}>{t('datetime.selected_time')}</span>
                <span style={{ fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                </span>
              </div>

              {/* 6 Quick Academic Slot Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                {[
                  { label: currentLanguage === 'vi' ? '08:00 (Sáng)' : '08:00 (Morn)', h: 8, m: 0 },
                  { label: currentLanguage === 'vi' ? '10:00 (Tiết 3)' : '10:00 (Slot 2)', h: 10, m: 0 },
                  { label: currentLanguage === 'vi' ? '14:00 (Chiều)' : '14:00 (Aft)', h: 14, m: 0 },
                  { label: currentLanguage === 'vi' ? '17:00 (Tan ca)' : '17:00 (Eve)', h: 17, m: 0 },
                  { label: currentLanguage === 'vi' ? '20:00 (Tối)' : '20:00 (Night)', h: 20, m: 0 },
                  { label: currentLanguage === 'vi' ? '23:59 (Đêm)' : '23:59 (Late)', h: 23, m: 59 }
                ].map((slot, i) => {
                  const isActive = selectedHour === slot.h && selectedMinute === slot.m;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedHour(slot.h);
                        setSelectedMinute(slot.m);
                        applyDateTime(selectedDate, slot.h, slot.m);
                      }}
                      style={{
                        padding: '6px 4px',
                        fontSize: 'var(--type-caption)',
                        fontWeight: isActive ? 700 : 500,
                        borderRadius: 'var(--radius-sm)',
                        border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>

              {/* Clean Quick Hour / Minute Controls */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: '3px' }}>{t('datetime.hour_label')}</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={selectedHour}
                    onChange={(e) => {
                      const h = Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0));
                      setSelectedHour(h);
                      applyDateTime(selectedDate, h, selectedMinute);
                    }}
                    className="snote-input"
                    style={{ padding: '5px 8px', fontSize: 'var(--type-small)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginBottom: '3px' }}>{t('datetime.minute_label')}</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={selectedMinute}
                    onChange={(e) => {
                      const m = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                      setSelectedMinute(m);
                      applyDateTime(selectedDate, selectedHour, m);
                    }}
                    className="snote-input"
                    style={{ padding: '5px 8px', fontSize: 'var(--type-small)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />

          {/* 3. Bottom Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
              {selectedDate.toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US')} • {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
            </div>

            <button
              type="button"
              onClick={() => {
                applyDateTime(selectedDate, selectedHour, selectedMinute);
                setIsOpen(false);
              }}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, padding: '5px 16px' }}
            >
              <Check size={13} />
              <span>{t('datetime.confirm')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
