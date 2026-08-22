import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { MapPin, Loader2, Search, Navigation } from 'lucide-react';
import { INDIA_CENTER, LOCATION_PICKER_ZOOM } from '../../utils/constants';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  value: string;
  onChange: (location: string, lat?: number, lng?: number) => void;
  disabled?: boolean;
}

/** Places search input using programmatic AutocompleteService (no legacy Autocomplete deprecation warning) */
function PlacesSearchInput({
  onSelectAddress,
  disabled,
}: {
  onSelectAddress: (address: string, lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const placesLib = useMapsLibrary('places');
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (placesLib && !serviceRef.current) {
      try {
        if ('AutocompleteSuggestion' in (placesLib as object)) {
          serviceRef.current = new (placesLib as any).AutocompleteSuggestion();
        } else {
          serviceRef.current = new placesLib.AutocompleteService();
        }
      } catch {
        serviceRef.current = new placesLib.AutocompleteService();
      }
    }
  }, [placesLib]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim() || !serviceRef.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    serviceRef.current.getPlacePredictions(
      { input: val, componentRestrictions: { country: 'in' } },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setIsOpen(true);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      },
    );
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const address = results[0].formatted_address || prediction.description;
        setQuery(address);
        setIsOpen(false);
        onSelectAddress(address, loc.lat(), loc.lng());
      }
    });
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--color-muted)' }}
        />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder="Search for a place in India..."
          disabled={disabled}
          className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm transition-colors focus:outline-none"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {isOpen && predictions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border shadow-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              style={{ color: 'var(--color-text)' }}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
              <span>{p.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Handles map click to drop a pin */
function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (data: LocationData) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        const address = response.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onLocationSelect({ address, lat, lng });
      } catch {
        onLocationSelect({ address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onLocationSelect]);

  return null;
}

/** Center map on a position */
function CenterMap({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !position) return;
    map.panTo(position);
    map.setZoom(LOCATION_PICKER_ZOOM);
  }, [map, position]);
  return null;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [centerTarget, setCenterTarget] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationSelect = useCallback(
    (data: LocationData) => {
      setMarkerPos({ lat: data.lat, lng: data.lng });
      onChange(data.address, data.lat, data.lng);
    },
    [onChange],
  );

  const handleSelectAddress = useCallback(
    (address: string, lat: number, lng: number) => {
      setMarkerPos({ lat, lng });
      setCenterTarget({ lat, lng });
      onChange(address, lat, lng);
    },
    [onChange],
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geocoder = new google.maps.Geocoder();
          const response = await geocoder.geocode({ location: { lat, lng } });
          const address = response.results[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setMarkerPos({ lat, lng });
          setCenterTarget({ lat, lng });
          onChange(address, lat, lng);
        } catch {
          setMarkerPos({ lat, lng });
          setCenterTarget({ lat, lng });
          onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
        }
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError('Could not detect your location. Please search or click on the map.');
      },
      { timeout: 8000 },
    );
  }, [onChange]);

  if (!MAPS_API_KEY) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg p-6"
        style={{ backgroundColor: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}
      >
        <MapPin className="h-6 w-6" style={{ color: 'var(--color-muted)' }} />
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Maps not configured — add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + GPS button */}
      <div className="flex gap-2">
        <PlacesSearchInput onSelectAddress={handleSelectAddress} disabled={disabled} />
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={disabled || geoLoading}
          title="Use current location"
          aria-label="Use current location"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-muted)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--color-border)' }}>
        <Map
          defaultCenter={INDIA_CENTER}
          defaultZoom={5}
          mapId="DEMO_MAP_ID"
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          style={{ width: '100%', height: 260 }}
        >
          {markerPos && (
            <AdvancedMarker position={markerPos}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    backgroundColor: 'var(--color-primary, #6366f1)',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                    marginTop: 2,
                  }}
                />
              </div>
            </AdvancedMarker>
          )}

          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <CenterMap position={centerTarget} />
        </Map>
      </div>

      {/* Selected location display */}
      {value && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
          }}
        >
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text)' }}>{value}</p>
        </div>
      )}

      {/* Hint */}
      {!value && (
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Search, click on the map, or use GPS to select your location
        </p>
      )}

      {geoError && (
        <p className="text-xs" style={{ color: 'var(--color-warning)' }} role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
};
