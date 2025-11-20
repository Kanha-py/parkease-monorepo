"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRangePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
}

export function DateRangePicker({
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}: DateRangePickerProps) {

  // Generate time options (30 min intervals)
  const timeOptions = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const label = `${hour.toString().padStart(2, '0')}:${minute}`;
    return label;
  });

  return (
    <div className="flex items-center gap-2 bg-white p-1 rounded-full border shadow-sm">
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            className={cn(
              "justify-start text-left font-normal rounded-full px-4 hover:bg-slate-100",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
            {date ? format(date, "MMM dd, yyyy") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            initialFocus
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </PopoverContent>
      </Popover>

      <div className="h-6 w-[1px] bg-slate-200" />

      {/* Start Time */}
      <Select value={startTime} onValueChange={setStartTime}>
        <SelectTrigger className="w-[110px] border-0 shadow-none focus:ring-0 hover:bg-slate-100 rounded-full gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <SelectValue placeholder="Start" />
        </SelectTrigger>
        <SelectContent>
            {timeOptions.map((t) => (
                <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="text-slate-300">→</div>

      {/* End Time */}
      <Select value={endTime} onValueChange={setEndTime}>
        <SelectTrigger className="w-[110px] border-0 shadow-none focus:ring-0 hover:bg-slate-100 rounded-full gap-2">
            <SelectValue placeholder="End" />
        </SelectTrigger>
        <SelectContent>
            {timeOptions.map((t) => (
                <SelectItem key={`end-${t}`} value={t} disabled={t <= startTime}>{t}</SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
