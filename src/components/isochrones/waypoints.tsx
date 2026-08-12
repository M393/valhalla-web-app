import { useMemo } from 'react';

import { WaypointSearch } from '@/components/ui/waypoint-search';
import type { ActiveWaypoint } from '@/components/types';

import { useIsochronesStore } from '@/stores/isochrones-store';

import { debounce } from 'throttle-debounce';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';

export const Waypoints = () => {
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const clearIsos = useIsochronesStore((state) => state.clearIsos);
  const updateTextInput = useIsochronesStore((state) => state.updateTextInput);
  const userInput = useIsochronesStore((state) => state.userInput);
  const geocodeResults = useIsochronesStore((state) => state.geocodeResults);
  const receiveGeocodeResults = useIsochronesStore(
    (state) => state.receiveGeocodeResults
  );

  const makeIsochronesRequestDebounced = useMemo(
    () => debounce(100, () => refetchIsochrones()),
    [refetchIsochrones]
  );

  const handleRemoveIsos = () => {
    clearIsos();
  };

  const handleGeocodeResults = (addresses: ActiveWaypoint[]) => {
    receiveGeocodeResults(addresses);
  };

  const handleResultSelect = (result: ActiveWaypoint) => {
    updateTextInput({
      userInput: result.title,
      addressIndex: result.addressindex,
    });
    makeIsochronesRequestDebounced();
  };

  return (
    <div className="flex flex-col gap-2">
      <WaypointSearch
        userInput={userInput}
        geocodeResults={geocodeResults}
        onGeocodeResults={handleGeocodeResults}
        onResultSelect={handleResultSelect}
        placeholder="Select a waypoint..."
        className="flex-1"
        rightContent={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRemoveIsos}
                data-testid="remove-waypoint-button"
              >
                <Trash className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset this waypoint</p>
            </TooltipContent>
          </Tooltip>
        }
      />
    </div>
  );
};
