import { useEffect, useMemo, useState } from 'react';

import { debounce } from 'throttle-debounce';
import { Settings } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { SliderSetting } from '@/components/ui/slider-setting';
import { settingsInit } from '@/components/settings-panel/settings-options';
import { useIsochronesStore } from '@/stores/isochrones-store';
import { useIsochronesQuery } from '@/hooks/use-isochrones-queries';
import { parseUrlParams } from '@/utils/parse-url-params';

export const IsochroneSettings = () => {
  const params = parseUrlParams();
  const updateSettings = useIsochronesStore((state) => state.updateSettings);
  const maxRange = useIsochronesStore((state) => state.maxRange);
  const interval = useIsochronesStore((state) => state.interval);
  const denoise = useIsochronesStore((state) => state.denoise);
  const generalize = useIsochronesStore((state) => state.generalize);
  const { refetch: refetchIsochrones } = useIsochronesQuery();
  const navigate = useNavigate({ from: '/$activeTab' });

  const [settingsOpen, setSettingsOpen] = useState(true);

  const makeIsochronesRequestDebounced = useMemo(
    () => debounce(100, () => refetchIsochrones()),
    [refetchIsochrones]
  );

  useEffect(() => {
    if (params.range && params.interval) {
      const rangeVal = parseInt(params.range, 10);
      const intervalVal = parseInt(params.interval, 10);

      if (rangeVal !== maxRange) {
        updateSettings({ name: 'maxRange', value: rangeVal });
      }

      if (intervalVal !== interval) {
        updateSettings({ name: 'interval', value: intervalVal });
      }
    }

    if (params.denoise) {
      const denoiseVal = parseFloat(params.denoise);
      if (denoiseVal !== denoise) {
        updateSettings({ name: 'denoise', value: denoiseVal });
      }
    }

    if (params.generalize) {
      const generalizeVal = parseInt(params.generalize, 10);
      if (generalizeVal !== generalize) {
        updateSettings({ name: 'generalize', value: generalizeVal });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        range: maxRange,
        interval: interval,
        denoise: denoise,
        generalize: generalize,
      }),
      replace: true,
    });
  }, [maxRange, interval, denoise, generalize, navigate]);

  return (
    <CollapsibleSection
      title="Isochrone settings"
      icon={Settings}
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      className="bg-muted/60 rounded-md px-3 py-2"
    >
      <SliderSetting
        id="maxRange"
        label="Maximum Range"
        description="The maximum range in minutes"
        min={1}
        max={120}
        step={1}
        value={maxRange}
        unit="mins"
        onValueChange={(values) => {
          const value = values[0] ?? 0;
          updateSettings({ name: 'maxRange', value });
        }}
        onValueCommit={makeIsochronesRequestDebounced}
        onInputChange={(values) => {
          let value = values[0] ?? 0;
          value = isNaN(value) ? 0 : Math.min(value, 120);
          updateSettings({ name: 'maxRange', value });
          makeIsochronesRequestDebounced();
        }}
      />

      <SliderSetting
        id="interval"
        label="Interval Step"
        description="The interval length in minutes"
        min={1}
        max={maxRange}
        step={1}
        value={interval}
        unit="mins"
        onValueChange={(values) => {
          const value = values[0] ?? 0;
          updateSettings({ name: 'interval', value });
        }}
        onValueCommit={makeIsochronesRequestDebounced}
        onInputChange={(values) => {
          let value = values[0] ?? 0;
          value = isNaN(value) ? 0 : Math.min(value, maxRange);
          updateSettings({ name: 'interval', value });
          makeIsochronesRequestDebounced();
        }}
      />

      <SliderSetting
        id="denoise"
        label="Denoise"
        description="A floating point value from 0 to 1 (default of 1) which can be used to remove smaller contours. A value of 1 will only return the largest contour for a given time value. A value of 0.5 drops any contours that are less than half the area of the largest contour in the set of contours for that same time value."
        min={0}
        max={1}
        step={0.1}
        value={denoise}
        onValueChange={(values) => {
          const value = values[0] ?? 0;
          updateSettings({ name: 'denoise', value });
        }}
        onValueCommit={makeIsochronesRequestDebounced}
        onInputChange={(values) => {
          const value = values[0] ?? settingsInit.denoise;
          const validValue = isNaN(value) ? settingsInit.denoise : value;
          updateSettings({ name: 'denoise', value: validValue });
          makeIsochronesRequestDebounced();
        }}
      />

      <SliderSetting
        id="generalize"
        label="Generalize"
        description="A floating point value in meters used as the tolerance for Douglas-Peucker generalization. Note: Generalization of contours can lead to self-intersections, as well as intersections of adjacent contours."
        min={0}
        max={1000}
        step={1}
        value={generalize}
        unit="meters"
        onValueChange={(values) => {
          const value = values[0] ?? 0;
          updateSettings({ name: 'generalize', value });
        }}
        onValueCommit={makeIsochronesRequestDebounced}
        onInputChange={(values) => {
          const value = values[0] ?? settingsInit.generalize;
          const validValue = isNaN(value) ? settingsInit.generalize : value;
          updateSettings({ name: 'generalize', value: validValue });
          makeIsochronesRequestDebounced();
        }}
      />
    </CollapsibleSection>
  );
};
