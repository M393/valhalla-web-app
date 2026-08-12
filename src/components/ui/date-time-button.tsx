import { useState } from 'react';
import { format, parseISO, isValid, isToday } from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  ClockArrowDown,
  ClockArrowUp,
  TimerOff,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useQuietPopoverClose } from '@/hooks/use-quiet-popover-close';

export interface DateTimeButtonProps {
  type: number;
  value: string;
  onChange: (field: 'type' | 'value', value: string) => void;
}

const TYPE_LABELS: Record<number, string> = {
  [-1]: 'Non-specific time',
  0: 'Leave now',
  1: 'Depart at',
  2: 'Arrive at',
};

const TYPE_ICONS: Record<number, LucideIcon> = {
  [-1]: TimerOff,
  0: Zap,
  1: ClockArrowUp,
  2: ClockArrowDown,
};

const TYPE_ORDER = [-1, 0, 1, 2];

// Fix width to be stable between modes. The calendar is the widest thing in the popover
// — 7 day columns (Calendar sets --cell-size to --spacing(8)) plus the
// calendar's and the popover's own p-3 and borders.
const POPOVER_WIDTH = 'w-[calc(7*--spacing(8)+4*--spacing(3)+4px)]';

// Rough maximum height (mode row + time input + calendar), below this it no
// longer fits, then pin at top.
const FULL_CARD_HEIGHT = 480;

// The sideOffset + collisionPadding a card anchored to the button gives up.
const PLACEMENT_MARGIN = 12;

const formatTriggerStamp = (type: number, value: string): string | null => {
  if (type <= 0) return null;
  const date = parseISO(value);
  if (!isValid(date)) return null;
  return isToday(date) ? format(date, 'HH:mm') : format(date, 'd MMM HH:mm');
};

const toLocalDateTimeString = (date: Date): string =>
  format(date, "yyyy-MM-dd'T'HH:mm");

const describeTravelTime = (type: number, value: string): string =>
  [TYPE_LABELS[type], formatTriggerStamp(type, value)]
    .filter(Boolean)
    .join(' ');

export const DateTimeCaption = ({
  type,
  value,
}: Omit<DateTimeButtonProps, 'onChange'>) => (
  <p className="text-muted-foreground text-xs">
    {describeTravelTime(type, value)}
  </p>
);

export const DateTimeButton = ({
  type,
  value,
  onChange,
}: DateTimeButtonProps) => {
  const [open, setOpen] = useState(false);
  const [pinnedLeft, setPinnedLeft] = useState<number | null>(null);
  const { triggerRef, tooltipMuted, onCloseAutoFocus } = useQuietPopoverClose();

  const TriggerIcon = TYPE_ICONS[type] ?? Clock;
  const description = describeTravelTime(type, value);

  const parsedDate = parseISO(value);
  const selectedDate = isValid(parsedDate) ? parsedDate : new Date();
  const timeValue = isValid(parsedDate) ? format(parsedDate, 'HH:mm') : '00:00';

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const [hh, mm] = timeValue.split(':');
    const next = new Date(date);
    next.setHours(Number(hh ?? 0));
    next.setMinutes(Number(mm ?? 0));
    onChange('value', toLocalDateTimeString(next));
  };

  const handleTimeChange = (newTime: string) => {
    const [hh, mm] = newTime.split(':');
    const next = new Date(selectedDate);
    next.setHours(Number(hh ?? 0));
    next.setMinutes(Number(mm ?? 0));
    onChange('value', toLocalDateTimeString(next));
  };

  // When card does not fit above its trigger element, pin it to the window top
  const placeCard = (nextType: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const roomAboveButton = rect.top - PLACEMENT_MARGIN;
    const pinToTop = nextType > 0 && roomAboveButton < FULL_CARD_HEIGHT;
    setPinnedLeft(pinToTop ? rect.left : null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) placeCard(type);
    setOpen(nextOpen);
  };

  const handleTypeChange = (next: string) => {
    if (!next) return;
    onChange('type', next);
    // Nothing left to pick for the timeless modes — get out of the way.
    if (Number(next) <= 0) setOpen(false);
    else placeCard(Number(next));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip open={open || tooltipMuted ? false : undefined}>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                ref={triggerRef}
                className="h-9 gap-1.5 px-2.5"
                aria-label={`Travel time: ${description}`}
                data-testid="date-time-button"
              >
                <TriggerIcon className="size-5" />
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>When to travel</TooltipContent>
      </Tooltip>
      {pinnedLeft !== null && (
        <PopoverAnchor asChild>
          <span
            aria-hidden
            className="pointer-events-none fixed top-2 size-0"
            style={{ left: pinnedLeft }}
          />
        </PopoverAnchor>
      )}
      <PopoverContent
        side={pinnedLeft === null ? 'top' : 'bottom'}
        align="start"
        collisionPadding={8}
        onCloseAutoFocus={onCloseAutoFocus}
        className={cn('flex flex-col gap-3 p-3', POPOVER_WIDTH)}
      >
        <div className="relative flex flex-col gap-1.5">
          <span className="text-center text-sm font-medium">
            When to travel?
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-0 right-0 size-5 p-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        {type > 0 && (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              captionLayout="dropdown"
              className="border rounded-md"
            />
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="flex-1"
              />
            </div>
          </>
        )}

        <ToggleGroup
          type="single"
          variant="outline"
          value={type.toString()}
          onValueChange={handleTypeChange}
          className="w-full"
        >
          {TYPE_ORDER.map((option) => {
            const Icon = TYPE_ICONS[option] ?? Clock;
            return (
              <Tooltip key={option}>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value={option.toString()}
                    aria-label={TYPE_LABELS[option]}
                    data-state={option === type ? 'on' : 'off'}
                    className="grow basis-0"
                  >
                    <Icon className="size-5" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{TYPE_LABELS[option]}</TooltipContent>
              </Tooltip>
            );
          })}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
};
