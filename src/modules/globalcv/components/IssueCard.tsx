import React from 'react';
import type { AuditIssue } from '../../../types';
import { AlertCircle, XCircle } from 'lucide-react';

interface IssueCardProps {
  issue: AuditIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const isError = issue.severity === 'error';

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3.5 bg-white shadow-sm ${isError ? 'border-rose-200 bg-rose-50/20' : 'border-amber-200 bg-amber-50/20'}`}>
      <div className={`p-2 rounded-lg mt-0.5 ${isError ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
        {isError ? <XCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 text-sm">{issue.title}</h4>
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {issue.field}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{issue.description}</p>
        <div className="mt-2.5 text-xs font-medium text-blue-700 bg-blue-50/80 border border-blue-200/60 p-2 rounded-lg">
          💡 <span className="font-semibold">Fix:</span> {issue.recommendation}
        </div>
      </div>
    </div>
  );
};