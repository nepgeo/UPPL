import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value || new Date());

  const selectedDate = value ? format(value, "MMM dd, yyyy") : "";
  const selectedTime = value ? format(value, "hh:mm a") : "";
  const displayText = value
    ? `${selectedDate} at ${selectedTime}`
    : placeholder;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      return;
    }
    const current = value || new Date();
    const updated = new Date(date);
    updated.setHours(current.getHours(), current.getMinutes(), 0, 0);
    onChange(updated);
  };

  const handleHourChange = (hour: number) => {
    const base = value || new Date();
    const updated = new Date(base);
    updated.setHours(hour, updated.getMinutes(), 0, 0);
    onChange(updated);
  };

  const handleMinuteChange = (minute: number) => {
    const base = value || new Date();
    const updated = new Date(base);
    updated.setHours(updated.getHours(), minute, 0, 0);
    onChange(updated);
  };

  const handleSetNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    onChange(now);
  };

  const handleClear = () => {
    onChange(null);
  };

  const currentHour = value ? value.getHours() : 10;
  const currentMinute = value ? value.getMinutes() : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 rounded-lg",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border" align="start">
        <div className="sm:flex">
          {/* Calendar */}
          <div className="p-3 border-b sm:border-b-0 sm:border-r">
            <DayPicker
              mode="single"
              selected={value || undefined}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              disabled={disabled}
              showOutsideDays
              className="p-0"
              classNames={{
                months: "flex flex-col space-y-2",
                month: "space-y-3",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md transition-colors hover:bg-gray-100"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors"
                ),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-gray-100 text-gray-900 font-semibold",
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
            />
          </div>

          {/* Time Picker */}
          <div className="p-3 sm:w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time</span>
            </div>

            {/* Hour & Minute selectors */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wide">
                  Hour
                </label>
                <select
                  value={currentHour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value))}
                  className="w-full h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wide">
                  Min
                </label>
                <select
                  value={currentMinute}
                  onChange={(e) =>
                    handleMinuteChange(parseInt(e.target.value))
                  }
                  className="w-full h-9 rounded-lg border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      :{pad(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleSetNow}
              >
                Now
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>

            {/* Preview */}
            {value && (
              <div className="mt-2 p-2 rounded-lg bg-primary/5 text-xs text-primary font-medium text-center">
                {format(value, "EEEE, MMMM d, yyyy")} at{" "}
                {format(value, "hh:mm a")}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
