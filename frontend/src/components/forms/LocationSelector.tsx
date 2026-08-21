import React, { useState } from 'react';
import { Select } from 'antd';
import { MapPin, Loader2 } from 'lucide-react';
import { WARDS } from '../../utils/constants';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange, disabled }) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        // In a real app this would reverse-geocode; for now map to nearest ward
        onChange(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
      },
      () => {
        setGeoLoading(false);
        setGeoError('Location detection unavailable. Please select manually.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        Location
      </label>
      <div className="flex gap-2">
        <Select
          value={value || undefined}
          onChange={onChange}
          placeholder="Select ward / location"
          disabled={disabled}
          showSearch
          filterOption={(input, option) =>
            (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={WARDS.map((w) => ({ value: w, label: w }))}
          className="flex-1"
          size="large"
          aria-label="Select location"
        />
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={disabled || geoLoading}
          title="Use current location"
          aria-label="Use current location"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-muted)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>
      {geoError && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }} role="alert" aria-live="polite">
          {geoError}
        </p>
      )}
    </div>
  );
};
