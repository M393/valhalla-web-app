import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Waypoints } from './waypoints';

const mockClearIsos = vi.fn();
const mockUpdateTextInput = vi.fn();
const mockReceiveGeocodeResults = vi.fn();
const mockRefetchIsochrones = vi.fn();

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) =>
    selector({
      clearIsos: mockClearIsos,
      updateTextInput: mockUpdateTextInput,
      userInput: 'Berlin',
      geocodeResults: [],
      receiveGeocodeResults: mockReceiveGeocodeResults,
    })
  ),
}));

vi.mock('@/hooks/use-isochrones-queries', () => ({
  useIsochronesQuery: vi.fn(() => ({
    refetch: mockRefetchIsochrones,
  })),
}));

vi.mock('@/components/ui/waypoint-search', () => ({
  WaypointSearch: vi.fn(
    ({ userInput, onGeocodeResults, onResultSelect, rightContent }) => (
      <div data-testid="mock-waypoint-search">
        <span data-testid="waypoint-user-input">{userInput}</span>
        <button
          data-testid="trigger-geocode"
          onClick={() =>
            onGeocodeResults([
              { title: 'Test Result', addressindex: 0, lngLat: [0, 0] },
            ])
          }
        >
          Trigger Geocode
        </button>
        <button
          data-testid="select-result"
          onClick={() =>
            onResultSelect({
              title: 'Selected Location',
              addressindex: 0,
              lngLat: [13.4, 52.5],
            })
          }
        >
          Select Result
        </button>
        {rightContent}
      </div>
    )
  ),
}));

describe('Waypoints (Isochrones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<Waypoints />)).not.toThrow();
  });

  it('should render waypoint search component', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('mock-waypoint-search')).toBeInTheDocument();
  });

  it('should display user input value', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('waypoint-user-input')).toHaveTextContent(
      'Berlin'
    );
  });

  it('should render remove waypoint button', () => {
    render(<Waypoints />);
    expect(screen.getByTestId('remove-waypoint-button')).toBeInTheDocument();
  });

  it('should call clearIsos when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('remove-waypoint-button'));

    expect(mockClearIsos).toHaveBeenCalled();
  });

  it('should call receiveGeocodeResults when geocode results are received', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('trigger-geocode'));

    expect(mockReceiveGeocodeResults).toHaveBeenCalledWith([
      { title: 'Test Result', addressindex: 0, lngLat: [0, 0] },
    ]);
  });

  it('should call updateTextInput when result is selected', async () => {
    const user = userEvent.setup();
    render(<Waypoints />);

    await user.click(screen.getByTestId('select-result'));

    expect(mockUpdateTextInput).toHaveBeenCalledWith({
      userInput: 'Selected Location',
      addressIndex: 0,
    });
  });
});
