import { useState } from 'react';
import { BadgeCheck, Banknote, ClipboardCheck, Construction, Info } from 'lucide-react';
import type { AbroadReadyTool } from '../../types/abroadReady';
import {
  COUNTRY_REMITTANCE_RULES,
  DMW_DIRECT_HIRE_CHECKLIST,
  DMW_PLACEMENT_FEE_RULES,
  RULES_DATASET_LAST_VERIFIED,
  RULES_DATASET_NOTICE,
  RULES_DATASET_VERSION,
} from '../../data/dmwFeeAndCountryRules';

const tools: { id: AbroadReadyTool; label: string; icon: typeof Banknote }[] = [
  { id: 'placement-fees', label: 'Placement Fee Auditor', icon: Banknote },
  { id: 'remittance', label: 'True Padala Simulator', icon: BadgeCheck },
  { id: 'direct-hire', label: 'DMW Direct-Hire Kit', icon: ClipboardCheck },
];

const descriptions: Record<AbroadReadyTool, string> = {
  'placement-fees': 'Compare a proposed placement fee with verified DMW rules for the destination and occupation.',
  remittance: 'Estimate take-home pay and remittance using locally stored tax and currency reference data.',
  'direct-hire': 'Organize Phase 1 and Phase 2 direct-hire requirements and prepare a contract addendum.',
};

interface AbroadReadyModuleProps {
  isDarkMode: boolean;
}

export default function AbroadReadyModule({ isDarkMode }: AbroadReadyModuleProps) {
  const [activeTool, setActiveTool] = useState<AbroadReadyTool>('placement-fees');
  const panelClass = isDarkMode
    ? 'border-slate-800 bg-slate-900 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900';
  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const activeDataCount = activeTool === 'placement-fees'
    ? DMW_PLACEMENT_FEE_RULES.length
    : activeTool === 'remittance'
      ? COUNTRY_REMITTANCE_RULES.length
      : DMW_DIRECT_HIRE_CHECKLIST.length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-xl sm:p-9">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
          <Construction className="h-3.5 w-3.5" /> ABROADREADY • CLIENT-SIDE TOOLKIT
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Plan your overseas move with confidence.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Fee checks, take-home estimates, and direct-hire document preparation. Calculations will use versioned local reference data, not paid APIs.
        </p>
      </div>

      <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${panelClass}`}>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="AbroadReady tools">
          {tools.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTool === id}
              onClick={() => setActiveTool(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                activeTool === id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <div className={`mt-5 rounded-2xl border p-5 sm:p-7 ${panelClass}`} role="tabpanel">
          <h3 className="text-xl font-bold">{tools.find((tool) => tool.id === activeTool)?.label}</h3>
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedTextClass}`}>{descriptions[activeTool]}</p>

          <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
            isDarkMode
              ? 'border-amber-800/70 bg-amber-950/30 text-amber-200'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Reference data is not ready for calculations</p>
              <p className="mt-1 text-xs leading-5">{RULES_DATASET_NOTICE}</p>
            </div>
          </div>

          <div className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs ${mutedTextClass}`}>
            <span>Dataset version: {RULES_DATASET_VERSION}</span>
            <span>Verified rules available: {activeDataCount}</span>
            <span>Last verified: {RULES_DATASET_LAST_VERIFIED ?? 'Not yet verified'}</span>
          </div>
        </div>
      </div>

      <p className={`text-xs leading-5 ${mutedTextClass}`}>
        This toolkit is informational and does not replace DMW, embassy, or tax-professional guidance. Reference data and rules must be verified against official sources before use.
      </p>
    </section>
  );
}
