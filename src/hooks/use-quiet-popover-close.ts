import { useRef, useState } from 'react';

/**
 * Keeps a tooltipped popover trigger quiet when its popover closes.
 *
 * Radix hands focus back to the trigger on close, and Radix's Tooltip opens on
 * any focus except a pointer down on the trigger itself. Mute the tooltip while
 * that focus lands, then hand control back so hover and tabbing still show it.
 */
export const useQuietPopoverClose = () => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [tooltipMuted, setTooltipMuted] = useState(false);

  const onCloseAutoFocus = (event: Event) => {
    // Focus the trigger ourselves instead, once the mute is in place.
    event.preventDefault();
    setTooltipMuted(true);
    // Deferred so the mute is committed before the focus event reaches Tooltip.
    setTimeout(() => {
      const focused = document.activeElement;
      if (!focused || focused === document.body) {
        triggerRef.current?.focus({ preventScroll: true });
      }
      setTooltipMuted(false);
    });
  };

  return { triggerRef, tooltipMuted, onCloseAutoFocus };
};
