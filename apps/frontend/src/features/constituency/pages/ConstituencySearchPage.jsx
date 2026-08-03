import { useState } from 'react';
import ConstituencyAutocomplete from '../components/ConstituencyAutocomplete';

export default function ConstituencySearchPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold mb-4">Constituency Intelligence</h1>
      <ConstituencyAutocomplete onSelect={setSelected} />

      {selected && (
        <div className="mt-6 bg-white p-6 rounded-xl border border-gray-100">
          <h2 className="font-semibold mb-4">{selected.name}, {selected.state}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Population" value={selected.population.toLocaleString()} />
            <Stat label="Gender Ratio" value={selected.genderRatio} />
            <Stat label="Literacy Rate" value={`${selected.literacyRate}%`} />
            <Stat label="Urban %" value={`${selected.urbanPercent}%`} />
          </div>

          {selected.pastWinner && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Past Winner: <span className="font-medium">{selected.pastWinner}</span> ({selected.pastWinnerParty})
              </p>
              {selected.victoryMarginPercent && (
                <p className="text-sm text-gray-500">Victory margin: {selected.victoryMarginPercent}%</p>
              )}
            </div>
          )}

          {selected.dataSource && (
            <p className="text-xs text-gray-400 mt-4">Source: {selected.dataSource}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
