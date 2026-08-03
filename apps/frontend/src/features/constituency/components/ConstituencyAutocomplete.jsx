import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { inputClasses } from '../../../components/common/FormField';

export default function ConstituencyAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api.get('/constituency/search', { params: { query } }).then(({ data }) => {
        setResults(data.data);
        setOpen(true);
      });
    }, 300); // debounce
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <input
        className={inputClasses(false)}
        placeholder="Search constituency (min 2 characters)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-auto">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => {
                onSelect(c);
                setQuery(`${c.name}, ${c.state}`);
                setOpen(false);
              }}
            >
              {c.name}, {c.state}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
