import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  standupDates?: string[];
  leaveDates?: string[];
  showStatusColors?: boolean; // New prop to control status coloring
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  selectedDate, 
  onDateChange, 
  standupDates = [], 
  leaveDates = [],
  showStatusColors = true // Default to true for backward compatibility
}) => {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    onDateChange(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateChange(newDate);
  };

  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentMonth && 
           selectedDate.getFullYear() === currentYear;
  };

  const isWeekday = (day: number) => {
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
  };

  const hasStandup = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return standupDates.includes(dateString);
  };

  const hasLeave = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaveDates.includes(dateString);
  };

  const isPastWeekday = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return isWeekday(day) && dayDate < todayDate && !hasStandup(day) && !hasLeave(day);
  };

  const getDayClasses = (day: number) => {
    const baseClasses = 'w-full h-full flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer';
    
    // Simple mode - just basic styling without status colors
    if (!showStatusColors) {
      if (isSelected(day)) {
        if (isToday(day)) {
          return `${baseClasses} bg-blue-200 text-blue-800 rounded-xl border-2 border-blue-600 shadow-sm`;
        }
        return `${baseClasses} bg-blue-100 text-blue-800 rounded-xl border-2 border-blue-500 shadow-sm`;
      }

      if (isToday(day)) {
        return `${baseClasses} bg-blue-100 text-blue-800 rounded-xl border border-blue-400 shadow-sm hover:shadow-md`;
      }

      if (isWeekday(day)) {
        return `${baseClasses} bg-white text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-300 shadow-sm hover:shadow-md`;
      }

      // Weekends
      return `${baseClasses} bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg border border-gray-400 shadow-sm hover:shadow-md`;
    }

    // Full status mode - original logic with colors
    if (isSelected(day)) {
      if (isToday(day)) {
        return `${baseClasses} bg-blue-200 text-blue-800 rounded-xl border-2 border-blue-600 shadow-sm`;
      }
      if (isWeekday(day)) {
        if (hasLeave(day)) {
          return `${baseClasses} bg-yellow-200 text-yellow-800 rounded-xl border-2 border-yellow-600 shadow-sm`;
        }
        if (hasStandup(day)) {
          return `${baseClasses} bg-green-200 text-green-800 rounded-xl border-2 border-green-600 shadow-sm`;
        }
        if (isPastWeekday(day)) {
          return `${baseClasses} bg-red-200 text-red-800 rounded-xl border-2 border-red-600 shadow-sm`;
        }
        return `${baseClasses} bg-white text-gray-700 rounded-xl border-2 border-gray-400 shadow-sm`;
      }
      return `${baseClasses} bg-gray-200 text-gray-700 rounded-lg border-2 border-gray-400 shadow-sm`;
    }

    if (isToday(day)) {
      return `${baseClasses} bg-blue-200 text-blue-800 rounded-xl border border-blue-400 shadow-sm hover:shadow-md`;
    }

    if (isWeekday(day)) {
      if (hasLeave(day)) {
        return `${baseClasses} bg-yellow-200 text-yellow-800 hover:bg-yellow-300 rounded-xl border border-yellow-400 shadow-sm hover:shadow-md`;
      }
      if (hasStandup(day)) {
        return `${baseClasses} bg-green-200 text-green-800 hover:bg-green-300 rounded-xl border border-green-400 shadow-sm hover:shadow-md`;
      }
      if (isPastWeekday(day)) {
        return `${baseClasses} bg-red-200 text-red-800 hover:bg-red-300 rounded-xl border border-red-400 shadow-sm hover:shadow-md`;
      }
      // Future weekdays: white background, gray border
      return `${baseClasses} bg-white text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-400 shadow-sm hover:shadow-md`;
    }

    // Weekends
    return `${baseClasses} bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg border border-gray-400 shadow-sm hover:shadow-md`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {/* Legend - only show when status colors are enabled */}
        {showStatusColors && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-200 border border-green-400 rounded-md shadow-sm"></div>
                <span className="text-gray-700 font-medium">Standup completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded-md shadow-sm"></div>
                <span className="text-gray-700 font-medium">Leave day</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-200 border border-red-400 rounded-md shadow-sm"></div>
                <span className="text-gray-700 font-medium">Missing standup</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-md shadow-sm"></div>
                <span className="text-gray-700 font-medium">Weekend/Future</span>
              </div>
            </div>
          </div>
        )}

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-bold text-gray-600 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => (
            <div key={index} className="aspect-square">
              {day && (
                <button
                  onClick={() => selectDate(day)}
                  className={getDayClasses(day)}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatePicker;