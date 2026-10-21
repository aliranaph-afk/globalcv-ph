import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ScoreMeterProps {
  score: number;
  potentialScore: number;
  issueCount: number;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, potentialScore, issueCount }) => {
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let message = 'Ready for International Submission!';
  
  if (score < 50) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    message = 'High risk of rejection by foreign ATS filters.';
  } else if (score < 80) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    message = 'Contains local PH biodata red flags.';
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center space-x-4">
        <div className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 ${score >= 80 ? 'border-emerald-500 bg-emerald-50' : score >= 50 ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50'}`}>
          <span className="text-xl font-bold text-slate-900">{score}</span>
          <span className="text-[10px] text-slate-500 font-medium">Potential: {potentialScore}</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-lg">International Compliance Score</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </div>

      <div className={`px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-2 ${badgeColor}`}>
        {score >= 80 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span>{issueCount} issues detected</span>
      </div>
    </div>
  );
};