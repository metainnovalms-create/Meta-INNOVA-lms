import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithYearMonthProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
  hasError?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DatePickerWithYearMonth({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled,
  className,
  minYear = new Date().getFullYear() - 25,
  maxYear = new Date().getFullYear() - 3,
  hasError = false,
}: DatePickerWithYearMonthProps) {
  const [calendarDate, setCalendarDate] = React.useState<Date>(
    date || new Date(maxYear - 5, 0, 1)
  );

  // Generate years array
  const years = React.useMemo(() => {
    const yearsArray: number[] = [];
    for (let year = maxYear; year >= minYear; year--) {
      yearsArray.push(year);
    }
    return yearsArray;
  }, [minYear, maxYear]);

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr);
    setCalendarDate(prev => setYear(prev, newYear));
  };

  const handleMonthChange = (monthStr: string) => {
    const newMonth = parseInt(monthStr);
    setCalendarDate(prev => setMonth(prev, newMonth));
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    if (selectedDate) {
      setCalendarDate(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            hasError && "border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-3 border-b">
          <Select
            value={getMonth(calendarDate).toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={getYear(calendarDate).toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          disabled={disabled}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}