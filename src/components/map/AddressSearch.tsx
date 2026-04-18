import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

interface AddressSearchProps {
  onSelect: (lat: number, lng: number, label: string) => void;
  /** Optional bias point — adds viewbox around this for better local results */
  near?: [number, number] | null;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GEOCODER_URL = import.meta.env.VITE_GEOCODER_URL || NOMINATIM_URL;

const AddressSearch = ({ onSelect, near }: AddressSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: 'json',
          addressdetails: '0',
          limit: '6',
          'accept-language': 'pl',
        });
        if (near) {
          // 0.3° viewbox (~33km) around bias point — Nominatim accepts left,top,right,bottom
          const [lat, lng] = near;
          params.set('viewbox', `${lng - 0.3},${lat + 0.3},${lng + 0.3},${lat - 0.3}`);
          params.set('bounded', '0');
        }
        const res = await fetch(`${GEOCODER_URL}?${params}`, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'pl' },
        });
        if (!res.ok) throw new Error(`Nominatim ${res.status}`);
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Geocoding failed:', err);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, near]);

  const handlePick = (r: NominatimResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    onSelect(lat, lng, r.display_name);
    setQuery(r.display_name.split(',').slice(0, 2).join(', '));
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Wyszukaj adres, miasto, kod pocztowy…"
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Wyczyść"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[1000] left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handlePick(r)}
              type="button"
              className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors border-b border-border last:border-b-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span className="text-foreground line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim().length >= 3 && results.length === 0 && (
        <div className="absolute z-[1000] left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg p-3 text-sm text-muted-foreground text-center">
          Brak wyników dla "{query}"
        </div>
      )}
    </div>
  );
};

export default AddressSearch;
