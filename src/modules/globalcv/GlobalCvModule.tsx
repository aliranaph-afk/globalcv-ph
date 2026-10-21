import React, { useState } from 'react';
import type { TargetRegion, AuditReport } from '../../types';
import { extractTextFromPDF } from '../../utils/pdfParser';
import { auditResumeText } from '../../utils/resumeAuditor';
import { CountrySwitcher } from './components/CountrySwitcher';
import { ScoreMeter } from './components/ScoreMeter';
import { IssueCard } from './components/IssueCard';
import { Upload, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function GlobalCvModule() {
  const [region, setRegion] = useState<TargetRegion>('WESTERN_ATS');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [rawText, setRawText] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const result = await extractTextFromPDF(file);
      setRawText(result.text);
      const report = auditResumeText(result.text, region, result.imageCount > 0);
      setAuditReport(report);
    } catch (err) {
      console.error(err);
      alert('Failed to read PDF file.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    setFileName('Sample_Pinoy_Resume.pdf');
    const sampleText = `
      Juan Dela Cruz
      Manila, Philippines | juan@email.com | 09171234567
      Date of Birth: January 15, 1990
      Civil Status: Married
      Religion: Roman Catholic
      Photo: Attached

      SUMMARY
      Responsible for handling daily customer service tasks and helping with administrative operations.

      EXPERIENCE
      Customer Service Representative - ABC Corp
      2020 - Present
      - Responsible for answering client calls and handling inquiries.
      - Duties include data entry and report generation.

      CERTIFICATIONS
      - TESDA NC II Caregiving
      - PRC Registered Nurse License
    `;
    setRawText(sampleText);
    setAuditReport(auditResumeText(sampleText, region));
  };

  return (
    <div className="space-y-6">
      <CountrySwitcher selectedRegion={region} onSelectRegion={(r) => {
        setRegion(r);
        if (rawText) setAuditReport(auditResumeText(rawText, r));
      }} />

      {/* Upload Box */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Upload Your Philippine Resume</h3>
          <p className="text-sm text-slate-500 mt-1">Upload your PDF resume or test with our built-in OFW sample profile.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition shadow">
            <span>{loading ? 'Processing PDF...' : 'Choose PDF File'}</span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleLoadSample}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl transition border border-slate-200"
          >
            Load Sample Pinoy Resume
          </button>
        </div>
        {fileName && (
          <div className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1.5 pt-2">
            <CheckCircle2 className="w-4 h-4" /> Loaded: {fileName}
          </div>
        )}
      </div>

      {/* Audit Report Results */}
      {auditReport && (
        <div className="space-y-6">
          <ScoreMeter score={auditReport.score} potentialScore={auditReport.potentialScore} issueCount={auditReport.issues.length} />

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" /> Compliance & Red Flag Audit
            </h3>
            {auditReport.issues.length === 0 ? (
              <p className="text-sm text-emerald-600 py-4 text-center font-medium">No red flags detected! Your resume is fully compliant.</p>
            ) : (
              <div className="space-y-3">
                {auditReport.issues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}