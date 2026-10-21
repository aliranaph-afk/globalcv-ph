import React from 'react';
import type { TargetRegion } from '../../../types';
import { Globe2 } from 'lucide-react';

interface CountrySwitcherProps {
  selectedRegion: TargetRegion;
  onSelectRegion: (region: TargetRegion) => void;
}

export const CountrySwitcher: React.FC<CountrySwitcherProps> = ({ selectedRegion, onSelectRegion }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
          <Globe2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Target Destination Standard</h3>
          <p className="text-xs text-slate-500">Adapts audit rules and compliance checking for overseas employers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {([
          ['EU', 'European Union', 'Privacy-conscious CV conventions; verify country-specific requirements.'],
          ['WESTERN_ATS', 'US, Canada, UK, Australia', 'ATS-friendly format and minimal personal information.'],
          ['MIDDLE_EAST_ASIA', 'Middle East & Asia', 'Keep original details and choose individually what to show.'],
          ['MARITIME_HEALTHCARE', 'Maritime & Healthcare', 'Prioritize license, training, and clinical or sea-service context.'],
        ] as const).map(([region, title, description]) => (
          <button
            key={region}
            type="button"
            aria-pressed={selectedRegion === region}
            onClick={() => onSelectRegion(region)}
            className={`text-left rounded-xl border p-3 transition-all ${
              selectedRegion === region
                ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-medium text-slate-900">{title}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};