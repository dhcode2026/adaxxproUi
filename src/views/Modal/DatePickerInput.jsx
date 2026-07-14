import React, { useState, useRef, useEffect } from 'react';

const Calendar = ({ selectedDate: initialDate, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getPreviousMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 0).getDate();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const prevMonthDays = getPreviousMonthDays(currentDate);

    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }

    return days;
  };

  const isToday = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleYearChange = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setYearDropdownOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    if (onSelectDate) {
      onSelectDate(today);
    }
  };

  const handleDateClick = (day, isCurrentMonth) => {
    if (isCurrentMonth) {
      const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(selected);
      if (onSelectDate) {
        onSelectDate(selected);
      }
    }
  };

  const calendarDays = generateCalendarDays();
  const years = Array.from({ length: 21 }, (_, i) => currentDate.getFullYear() - 10 + i);

  return (
    <div style={{
      backgroundColor: '#333',
      color: '#fff',
      padding: '8px',
      borderRadius: '8px',
      maxWidth: '280px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px solid #555'
      }}>
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1
          }}
        >
          ‹
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
            {monthNames[currentDate.getMonth()]}
          </span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '0px 2px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {currentDate.getFullYear()}
              <span style={{ fontSize: '8px' }}>▾</span>
            </button>
            {yearDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#444',
                border: '1px solid #555',
                borderRadius: '4px',
                maxHeight: '150px',
                overflowY: 'auto',
                zIndex: 1000,
                minWidth: '55px',
                marginTop: '2px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {years.map((year) => (
                  <div
                    key={year}
                    onClick={() => {
                      handleYearChange(year);
                      setYearDropdownOpen(false);
                    }}
                    style={{
                      padding: '6px 8px',
                      cursor: 'pointer',
                      backgroundColor: year === currentDate.getFullYear() ? '#555' : '#444',
                      color: year === currentDate.getFullYear() ? '#40a9ff' : '#fff',
                      fontSize: '12px',
                      textAlign: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = year === currentDate.getFullYear() ? '#555' : '#444'}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1
          }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '3px',
        marginBottom: '4px',
        textAlign: 'center'
      }}>
        {dayNames.map((day) => (
          <div key={day} style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0px'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '3px',
        marginBottom: '8px'
      }}>
        {calendarDays.map((dayObj, index) => {
          const isSelectedDate = isSelected(dayObj.day, dayObj.isCurrentMonth);
          const isTodayDate = isToday(dayObj.day, dayObj.isCurrentMonth);
          const isOtherMonth = !dayObj.isCurrentMonth;

          return (
            <div
              key={index}
              onClick={() => handleDateClick(dayObj.day, dayObj.isCurrentMonth)}
              style={{
                padding: '4px 0',
                textAlign: 'center',
                cursor: dayObj.isCurrentMonth ? 'pointer' : 'default',
                backgroundColor: isSelectedDate ? '#40a9ff' : 'transparent',
                color: isSelectedDate ? '#fff' : isOtherMonth ? '#666' : '#fff',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: isSelectedDate || isTodayDate ? '600' : '500',
                border: isTodayDate && !isSelectedDate ? '1px solid #fff' : 'none',
                transition: 'background-color 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (dayObj.isCurrentMonth && !isSelectedDate) {
                  e.target.style.backgroundColor = '#444';
                  e.target.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (dayObj.isCurrentMonth && !isSelectedDate) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = isTodayDate ? '#fff' : '#fff';
                }
              }}
            >
              {dayObj.day}
            </div>
          );
        })}
      </div>

      {/* Today button */}
      <div style={{ textAlign: 'center', paddingTop: '4px', borderTop: '1px solid #555' }}>
        <button
          onClick={handleToday}
          style={{
            backgroundColor: '#6ab96a',
            border: 'none',
            color: '#fff',
            padding: '5px 16px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5ba55a'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6ab96a'}
        >
          Today
        </button>
      </div>
    </div>
  );
};

const DatePickerInput = ({ label, value, onChange, placeholder, error = false, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ? formatDate(value) : '');
  const wrapperRef = useRef(null);

  // Format date to readable string
  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDate(value));
    }
  }, [value]);

  // Handle click outside to close calendar
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (selectedDate) => {
    setDisplayValue(formatDate(selectedDate));
    onChange(selectedDate);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="date-picker-input-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <div
        id={id}
        className="pmp-date-input-wrapper"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <input
          type="text"
          className={`pmp-date-input ${error ? 'pmp-date-input-error' : ''}`}
          placeholder={placeholder || label?.toLowerCase()}
          value={displayValue}
          readOnly
          style={{ cursor: 'pointer', width: '100%', fontSize: '13px' }}
        />
        <i className="fa fa-calendar" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: error ? '#ff4d4f' : '#999' }}></i>
      </div>

      {isOpen && (
        <div className="date-picker-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '4px',
          boxShadow: 'none',
          zIndex: 1000,
          marginTop: '4px',
          minWidth: '230px'
        }}>
          <Calendar selectedDate={value} onSelectDate={handleDateSelect} />
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
export { Calendar };

