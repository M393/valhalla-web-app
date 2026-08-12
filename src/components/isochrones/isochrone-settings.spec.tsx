import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IsochroneSettings } from './isochrone-settings';

const mockUpdateSettings = vi.fn();
const mockRefetchIsochrones = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@/utils/parse-url-params', () => ({
  parseUrlParams: vi.fn(() => ({})),
}));

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) =>
    selector({
      updateSettings: mockUpdateSettings,
      maxRange: 30,
      interval: 10,
      denoise: 1,
      generalize: 200,
    })
  ),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
}));

vi.mock('@/components/ui/slider-setting', () => ({
  SliderSetting: vi.fn(
    ({ id, label, value, onValueChange, onValueCommit, onInputChange }) => (
      <div data-testid={`slider-${id}`}>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="range"
          value={value}
          onChange={(e) => onValueChange([Number(e.target.value)])}
          onMouseUp={() => onValueCommit?.()}
          data-testid={`slider-input-${id}`}
        />
        <button
          data-testid={`slider-commit-${id}`}
          onClick={() => onInputChange?.([value + 5])}
        >
          Change {label}
        </button>
      </div>
    )
  ),
}));

describe('IsochroneSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<IsochroneSettings />)).not.toThrow();
  });

  it('should render Isochrone settings section', () => {
    render(<IsochroneSettings />);
    expect(screen.getByText(/Isochrone settings/i)).toBeInTheDocument();
  });

  it('should render all isochrone setting sliders by default', () => {
    render(<IsochroneSettings />);

    expect(screen.getByTestId('slider-maxRange')).toBeInTheDocument();
    expect(screen.getByTestId('slider-interval')).toBeInTheDocument();
    expect(screen.getByTestId('slider-denoise')).toBeInTheDocument();
    expect(screen.getByTestId('slider-generalize')).toBeInTheDocument();
  });

  it('should render Maximum Range slider with correct label', () => {
    render(<IsochroneSettings />);
    expect(screen.getByText('Maximum Range')).toBeInTheDocument();
  });

  it('should render Interval Step slider', () => {
    render(<IsochroneSettings />);
    expect(screen.getByText('Interval Step')).toBeInTheDocument();
  });

  it('should render Denoise slider', () => {
    render(<IsochroneSettings />);
    expect(screen.getByText('Denoise')).toBeInTheDocument();
  });

  it('should render Generalize slider', () => {
    render(<IsochroneSettings />);
    expect(screen.getByText('Generalize')).toBeInTheDocument();
  });

  it('should call updateSettings when slider value changes', async () => {
    const user = userEvent.setup();
    render(<IsochroneSettings />);

    await user.click(screen.getByTestId('slider-commit-maxRange'));

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      name: 'maxRange',
      value: 35,
    });
  });

  it('should sync settings to URL on mount', () => {
    render(<IsochroneSettings />);

    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function),
      replace: true,
    });
  });
});
