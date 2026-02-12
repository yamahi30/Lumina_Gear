'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string; // YYYY-MM形式
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [year, month] = selectedMonth.split('-').map(Number);
  const date = new Date(year, month - 1);

  const formatMonth = (y: number, m: number) => {
    return `${y}-${String(m).padStart(2, '0')}`;
  };

  const handlePrev = () => {
    const newDate = new Date(year, month - 2);
    onMonthChange(formatMonth(newDate.getFullYear(), newDate.getMonth() + 1));
  };

  const handleNext = () => {
    const newDate = new Date(year, month);
    onMonthChange(formatMonth(newDate.getFullYear(), newDate.getMonth() + 1));
  };

  const displayText = `${year}年${month}月`;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="前の月"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <span className="text-lg font-medium text-gray-900 min-w-[100px] text-center">
        {displayText}
      </span>
      <button
        onClick={handleNext}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="次の月"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}
