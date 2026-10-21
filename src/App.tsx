import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Award, BadgeCheck, Building2, Clipboard, FileText,
  Globe, Moon, Plane, RotateCcw, Shield, Sparkles, Sun, Upload,
} from 'lucide-react';
import type { AuditIssue, CredentialTranslation, ResumeProfile, ResumeViewMode, TargetRegion } from './types';
import { auditResume } from './utils/resumeAuditor';
import { detectCredentialTranslations, rewriteWeakBullet, SAMPLE_PINOY_RESUME, WEAK_VERB_RULES } from './data/phCredentialRules';
import { CountrySwitcher } from './modules/globalcv/components/CountrySwitcher';
import AbroadReadyModule from './modules/abroadready/AbroadReadyModule';

const PROFILE_STORAGE_KEY = 'globalcv-ph-resume-profile-v2';
const GEMINI_KEY_STORAGE_KEY = 'globalcv-ph-gemini-api-key';
const JOB_DESCRIPTION_STORAGE_KEY = 'globalcv-ph-job-description';

interface StoredProfile {
  profile: ResumeProfile;
  region: TargetRegion;
  fileName: string;
  rewrittenBullets: Record<number, string>;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

function isTargetRegion(value: unknown): value is TargetRegion {
  return value === 'EU'
    || value === 'WESTERN_ATS'
    || value === 'MIDDLE_EAST_ASIA'
    || value === 'MARITIME_HEALTHCARE';
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every((entry) => typeof entry === 'string');
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isRewrittenBulletRecord(value: unknown): value is Record<number, string> {
  return isStringRecord(value) && Object.keys(value).every((key) => /^\d+$/.test(key));
}

const REGION_DEFAULT_HIDDEN: Partial<Record<TargetRegion, string[]>> = {
  EU: ['photo', 'religion', 'civil-status', 'date-of-birth', 'passport-validity', 'height-weight', 'family-names', 'government-ids', 'oath', 'references'],
  WESTERN_ATS: ['photo', 'religion', 'civil-status', 'date-of-birth', 'passport-validity', 'height-weight', 'family-names', 'government-ids', 'oath', 'references'],
};

function getInitialState(): StoredProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw) as Partial<StoredProfile>;
      if (
        value.profile
        && typeof value.profile.rawText === 'string'
        && isStringArray(value.profile.hiddenFields)
        && isStringArray(value.profile.visibleOverrides)
        && isStringRecord(value.profile.appliedTranslations)
      ) {
        return {
          profile: {
            rawText: value.profile.rawText,
            photoDetected: value.profile.photoDetected === true,
            dateOfBirth: value.profile.dateOfBirth ?? null,
            civilStatus: value.profile.civilStatus ?? null,
            nationality: value.profile.nationality ?? null,
            religion: value.profile.religion ?? null,
            passportValidity: value.profile.passportValidity ?? null,
            hiddenFields: value.profile.hiddenFields,
            visibleOverrides: value.profile.visibleOverrides,
            appliedTranslations: value.profile.appliedTranslations,
          },
          region: isTargetRegion(value.region) ? value.region : 'EU',
          fileName: value.fileName ?? 'Stress_Test_Sample.txt',
          rewrittenBullets: isRewrittenBulletRecord(value.rewrittenBullets) ? value.rewrittenBullets : {},
        };
      }
    }
  } catch (error) {
    console.warn('Could not restore the saved resume profile.', error);
  }
  return {
    profile: {
      rawText: SAMPLE_PINOY_RESUME,
      photoDetected: false,
      dateOfBirth: 'January 15, 1990',
      civilStatus: 'Single',
      nationality: 'Filipino',
      religion: 'Roman Catholic',
      passportValidity: '2030-06-30',
      hiddenFields: [],
      visibleOverrides: [],
      appliedTranslations: {},
    },
    region: 'EU',
    fileName: 'Stress_Test_Sample.txt',
    rewrittenBullets: {},
  };
}

function extractProfileField(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractBullet(text: string): string {
  return text.split('\n').find((line) => WEAK_VERB_RULES.some((rule) => rule.pattern.test(line))) ?? '';
}

function issueIsHidden(issue: AuditIssue, profile: ResumeProfile, region: TargetRegion): boolean {
  if (profile.hiddenFields.includes(issue.id)) return true;
  if (profile.visibleOverrides.includes(issue.id)) return false;
  const defaultFields = REGION_DEFAULT_HIDDEN[region] ?? [];
  if (issue.id === 'embedded-photo' && defaultFields.includes('photo')) return true;
  const fieldId = issue.id.split('-').slice(0, -1).join('-');
  return defaultFields.some((id) => fieldId === id || fieldId.startsWith(`${id}-`));
}

function isImagePhotoField(fieldName: string): boolean {
  return fieldName.toLowerCase().includes('photo');
}

function ScorePillar({ label, value, maximum, color }: { label: string; value: number; maximum: number; color: string }) {
  const percent = Math.min(100, Math.round((value / maximum) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}/{maximum}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function App() {
  const [initialState] = useState(getInitialState);
  const [activeTab, setActiveTab] = useState<'audit' | 'preview'>('audit');
  const [activeModule, setActiveModule] = useState<'globalcv' | 'abroadready'>('globalcv');
  const [profile, setProfile] = useState<ResumeProfile>(initialState.profile);
  const [region, setRegion] = useState<TargetRegion>(initialState.region);
  const [fileName, setFileName] = useState(initialState.fileName);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<ResumeViewMode>('international');
  const [jobDescription, setJobDescription] = useState(() => localStorage.getItem(JOB_DESCRIPTION_STORAGE_KEY) ?? '');
  const [bulletInput, setBulletInput] = useState(() => extractBullet(initialState.profile.rawText));
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [actionVerb, setActionVerb] = useState('Optimized');
  const [rewrittenBullets, setRewrittenBullets] = useState<Record<number, string>>(initialState.rewrittenBullets);
  const [enhancedBullet, setEnhancedBullet] = useState('');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem(GEMINI_KEY_STORAGE_KEY) ?? '');
  const [enhancerStatus, setEnhancerStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [scanWarning, setScanWarning] = useState(false);
  const [pdfNotice, setPdfNotice] = useState('');
  const [activeFlash, setActiveFlash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const flashTimeout = useRef<number | null>(null);
  const resumeTextarea = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const stored: StoredProfile = { profile, region, fileName, rewrittenBullets };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Could not save the resume profile in browser storage.', error);
    }
  }, [profile, region, fileName, rewrittenBullets]);

  useEffect(() => {
    try {
      localStorage.setItem(JOB_DESCRIPTION_STORAGE_KEY, jobDescription);
    } catch (error) {
      console.error('Could not save the job description in browser storage.', error);
    }
  }, [jobDescription]);

  useEffect(() => {
    try {
      localStorage.setItem(GEMINI_KEY_STORAGE_KEY, geminiKey);
    } catch (error) {
      console.error('Could not save the Gemini key in browser storage.', error);
    }
  }, [geminiKey]);

  useEffect(() => () => {
    if (flashTimeout.current !== null) window.clearTimeout(flashTimeout.current);
  }, []);

  const credentials = useMemo(
    () => detectCredentialTranslations(profile.rawText),
    [profile.rawText],
  );
  const report = useMemo(() => auditResume({
    text: profile.rawText,
    region,
    hasPhoto: profile.photoDetected,
    jobDescription,
    appliedTranslationCount: Object.keys(profile.appliedTranslations).length,
  }), [profile, region, jobDescription]);
  const issues = report.issues;
  const rawLines = profile.rawText.split('\n');
  const translationsByLine = useMemo(() => {
    const byLine = new Map<number, CredentialTranslation[]>();
    credentials.forEach((credential) => {
      const existing = byLine.get(credential.lineIndex) ?? [];
      existing.push(credential);
      byLine.set(credential.lineIndex, existing);
    });
    return byLine;
  }, [credentials]);

  const triggerFlash = (key: string, lineIndex?: number) => {
    setActiveFlash(lineIndex === undefined ? key : `line-${lineIndex}`);
    window.requestAnimationFrame(() => {
      const selector = lineIndex === undefined
        ? `[data-preview-key="${key}"]`
        : `[data-preview-line="${lineIndex}"]`;
      document.querySelector<HTMLElement>(selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    if (flashTimeout.current !== null) window.clearTimeout(flashTimeout.current);
    flashTimeout.current = window.setTimeout(() => setActiveFlash(''), 1500);
  };

  const setRawText = (rawText: string) => {
    setProfile((current) => ({
      ...current,
      rawText,
      dateOfBirth: extractProfileField(rawText, /(?:date of birth|DOB)\s*:\s*([^\n|]+)/i) ?? current.dateOfBirth,
      civilStatus: extractProfileField(rawText, /civil status\s*:\s*([^\n|]+)/i) ?? current.civilStatus,
      nationality: extractProfileField(rawText, /nationality\s*:\s*([^\n|]+)/i) ?? current.nationality,
      religion: extractProfileField(rawText, /religion\s*:\s*([^\n|]+)/i) ?? current.religion,
      passportValidity: extractProfileField(rawText, /passport valid(?:ity)? until\s*:\s*([^\n|]+)/i) ?? current.passportValidity,
    }));
  };

  const handleCountryChange = (nextRegion: TargetRegion) => {
    setRegion(nextRegion);
    setActiveFlash('');
  };

  const toggleIssueVisibility = (issue: AuditIssue) => {
    const hidden = issueIsHidden(issue, profile, region);
    setProfile((current) => {
      const hiddenFields = new Set(current.hiddenFields);
      const visibleOverrides = new Set(current.visibleOverrides);
      if (hidden) {
        hiddenFields.delete(issue.id);
        visibleOverrides.add(issue.id);
      } else {
        hiddenFields.add(issue.id);
        visibleOverrides.delete(issue.id);
      }
      return { ...current, hiddenFields: [...hiddenFields], visibleOverrides: [...visibleOverrides] };
    });
    setViewMode('international');
    triggerFlash(issue.lineIndex === undefined && isImagePhotoField(issue.field) ? 'photo' : issue.id, issue.lineIndex);
  };

  const translateCredential = (credential: CredentialTranslation) => {
    setProfile((current) => ({
      ...current,
      appliedTranslations: { ...current.appliedTranslations, [credential.id]: credential.equivalent },
    }));
    setViewMode('international');
    triggerFlash(credential.id, credential.lineIndex);
  };

  const undoTranslation = (credentialId: string, lineIndex: number) => {
    setProfile((current) => {
      const appliedTranslations = { ...current.appliedTranslations };
      delete appliedTranslations[credentialId];
      return { ...current, appliedTranslations };
    });
    setViewMode('international');
    triggerFlash(credentialId, lineIndex);
  };

  const addHospitalContext = () => {
    const context = 'International Clinical Context: Tertiary Level III Hospital | [X]-Bed Capacity | [X]:1 Nurse-to-Patient Ratio';
    setRawText(`${profile.rawText.trimEnd()}\n${context}`);
    setBulletInput((current) => current || extractBullet(profile.rawText));
    triggerFlash('hospital-context');
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setLoadingPdf(true);
    setScanWarning(false);
    setPdfNotice('');
    setErrorMessage('');
    try {
      const { extractTextFromPDF } = await import('./utils/pdfParser');
      const result = await extractTextFromPDF(file);
      setFileName(file.name);
      setProfile((current) => ({
        ...current,
        rawText: result.text,
        photoDetected: result.imageCount > 0,
        dateOfBirth: extractProfileField(result.text, /(?:date of birth|DOB)\s*:\s*([^\n|]+)/i),
        civilStatus: extractProfileField(result.text, /civil status\s*:\s*([^\n|]+)/i),
        nationality: extractProfileField(result.text, /nationality\s*:\s*([^\n|]+)/i),
        religion: extractProfileField(result.text, /religion\s*:\s*([^\n|]+)/i),
        passportValidity: extractProfileField(result.text, /passport valid(?:ity)? until\s*:\s*([^\n|]+)/i),
      }));
      setRewrittenBullets({});
      setScanWarning(result.isScannedImage);
      setPdfNotice(result.imageCount > 0
        ? `${result.imageCount} embedded image${result.imageCount === 1 ? '' : 's'} detected. Review whether any is a personal photo.`
        : '');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to read this PDF.');
    } finally {
      setLoadingPdf(false);
      input.value = '';
    }
  };

  const loadSample = () => {
    setFileName('Stress_Test_Sample.txt');
    setProfile({
      rawText: SAMPLE_PINOY_RESUME,
      photoDetected: false,
      dateOfBirth: 'January 15, 1990',
      civilStatus: 'Single',
      nationality: 'Filipino',
      religion: 'Roman Catholic',
      passportValidity: '2030-06-30',
      hiddenFields: [],
      visibleOverrides: [],
      appliedTranslations: {},
    });
    setRewrittenBullets({});
    setScanWarning(false);
    setBulletInput(extractBullet(SAMPLE_PINOY_RESUME));
  };

  const issueLines = new Map<number, AuditIssue[]>();
  issues.forEach((issue) => {
    if (issue.lineIndex === undefined) return;
    const existing = issueLines.get(issue.lineIndex) ?? [];
    existing.push(issue);
    issueLines.set(issue.lineIndex, existing);
  });

  const isLineHidden = (lineIndex: number) => {
    const lineIssues = issueLines.get(lineIndex) ?? [];
    return lineIssues.length > 0 && lineIssues.every((issue) => issueIsHidden(issue, profile, region));
  };

  const buildInternationalLines = () => rawLines.flatMap((line, lineIndex) => {
    if (isLineHidden(lineIndex)) return [];
    let displayText = rewrittenBullets[lineIndex] ?? line;
    (translationsByLine.get(lineIndex) ?? []).forEach((credential) => {
      const translated = profile.appliedTranslations[credential.id];
      if (translated) displayText = displayText.replace(credential.matchedText, translated);
    });
    return [{ line, lineIndex, displayText }];
  });

  const internationalLines = buildInternationalLines();
  const visibleIssues = issues.filter((issue) => issueIsHidden(issue, profile, region));
  const hospitalRoleDetected = /\b(?:hospital|nurs(?:e|ing)|clinical)\b/i.test(profile.rawText);
  const hasBedCapacity = /\b(?:\d{1,4}|X)\s*[- ]?(?:bed|beds)\b/i.test(profile.rawText);

  const applyBulletRewrite = (mode: 'deterministic' | 'copy' | 'gemini') => {
    const replacement = rewriteWeakBullet(bulletInput, actionVerb);
    if (mode === 'deterministic') {
      const index = rawLines.findIndex((line) => line.trim() === bulletInput.trim());
      if (index >= 0) {
        setRewrittenBullets((current) => ({ ...current, [index]: replacement }));
        setEnhancedBullet(replacement);
        setViewMode('international');
        triggerFlash(`line-${index}`, index);
      } else {
        setEnhancedBullet(replacement);
      }
      setEnhancerStatus('Rule-based rewrite prepared. Add only accurate scope and metrics before using it.');
      return;
    }
    return replacement;
  };

  const copyAiPrompt = async () => {
    const prompt = `Rewrite this resume bullet for a ${region} application targeting ${targetJobTitle.trim() || '[target job title]'}. Preserve facts, do not invent achievements, and use a strong action verb. Suggest clearly marked placeholders for metrics where none are supplied.\n\nRaw bullet:\n${bulletInput}`;
    try {
      await navigator.clipboard.writeText(prompt);
      setEnhancerStatus('Tailored prompt copied. Paste it into your preferred AI assistant and verify every claim.');
    } catch {
      setEnhancerStatus('Clipboard access was unavailable. Select and copy the prompt from your browser permissions.');
      setEnhancerStatus(`Clipboard access was unavailable. Prompt text: ${prompt}`);
    }
  };

  const rewriteWithGemini = async () => {
    if (!geminiKey.trim()) {
      setEnhancerStatus('Add your Gemini API key to enable BYOK rewriting.');
      return;
    }
    setBusy(true);
    setEnhancerStatus('');
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey.trim() },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Rewrite this resume bullet for a ${region} job application. Target role: ${targetJobTitle.trim() || 'not specified'}. Do not invent facts. Use bracketed placeholders for missing metrics. Return only the rewritten bullet.\n\n${bulletInput}`,
              }],
            }],
          }),
        },
      );
      const result = await response.json() as GeminiResponse;
      if (!response.ok) throw new Error(result.error?.message ?? `Gemini request failed (${response.status}).`);
      const output = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
      if (!output) throw new Error('Gemini returned no rewritten bullet.');
      setEnhancedBullet(output);
      setEnhancerStatus('Rewrite received from Gemini. Verify that it contains no invented details.');
    } catch (error) {
      setEnhancerStatus(error instanceof Error ? error.message : 'Gemini rewrite failed.');
    } finally {
      setBusy(false);
    }
  };

  const applyEnhancedBullet = () => {
    const index = rawLines.findIndex((line) => line.trim() === bulletInput.trim());
    if (index < 0 || !enhancedBullet) {
      setEnhancerStatus('Select a bullet from the resume text before applying the rewrite.');
      return;
    }
    setRewrittenBullets((current) => ({ ...current, [index]: enhancedBullet }));
    setViewMode('international');
    triggerFlash(`line-${index}`, index);
    setEnhancerStatus('Bullet rewrite is active in the international preview. The original remains unchanged.');
  };

  const fixAllRedFlags = () => {
    setProfile((current) => {
      const hiddenFields = new Set(current.hiddenFields);
      issues.forEach((issue) => hiddenFields.add(issue.id));
      return { ...current, hiddenFields: [...hiddenFields], visibleOverrides: [] };
    });
    setViewMode('international');
    const firstLineIssue = issues.find((issue) => issue.lineIndex !== undefined);
    triggerFlash(firstLineIssue?.id ?? 'photo', firstLineIssue?.lineIndex);
  };

  const renderPreviewLine = (line: string, lineIndex: number, original: boolean) => {
    const lineIssues = issueLines.get(lineIndex) ?? [];
    if (!original && isLineHidden(lineIndex)) {
      if (activeFlash !== `line-${lineIndex}`) return null;
      return <p key={lineIndex} data-preview-line={lineIndex} className="rounded bg-emerald-100 px-1 text-xs text-emerald-900 ring-2 ring-emerald-400">[Hidden from preview — original content is preserved]</p>;
    }
    let displayText = line;
    if (!original) {
      displayText = rewrittenBullets[lineIndex] ?? line;
      (translationsByLine.get(lineIndex) ?? []).forEach((credential) => {
        const translated = profile.appliedTranslations[credential.id];
        if (translated) displayText = displayText.replace(credential.matchedText, translated);
      });
    }
    const flagged = lineIssues.length > 0;
    const shouldFlash = activeFlash === `line-${lineIndex}`;
    return (
      <p
        key={lineIndex}
        data-preview-line={lineIndex}
        className={`min-h-5 whitespace-pre-wrap rounded px-1 transition-all duration-500 ${
          shouldFlash ? 'bg-emerald-100 ring-2 ring-emerald-400' : ''
        } ${original && flagged ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-200' : ''}`}
      >
        {displayText || '\u00a0'}
      </p>
    );
  };

  const hospitalTranslation = credentials.some((credential) => credential.sector === 'Healthcare');

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="print-hidden sticky top-0 z-30 border-b border-slate-800 bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-md"><Shield className="h-6 w-6" /></div>
            <div>
              <div className="flex items-center gap-2"><h1 className="text-lg font-bold tracking-tight">GlobalCV PH</h1><span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300">100% client-side</span></div>
              <p className="text-xs text-slate-400">Pinoy-to-International Resume Converter &amp; Compliance Linter</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-1 shadow-inner">
              <button type="button" onClick={() => setActiveModule('globalcv')} aria-pressed={activeModule === 'globalcv'} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeModule === 'globalcv' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>GlobalCV PH</button>
              <button type="button" onClick={() => setActiveModule('abroadready')} aria-pressed={activeModule === 'abroadready'} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeModule === 'abroadready' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}><Plane className="h-3.5 w-3.5" /> AbroadReady</button>
            </div>
            {activeModule === 'globalcv' && <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/80 p-1 shadow-inner">
              <button type="button" onClick={() => setActiveTab('audit')} aria-pressed={activeTab === 'audit'} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><FileText className="h-3.5 w-3.5" /> Editor &amp; Linter</button>
              <button type="button" onClick={() => setActiveTab('preview')} aria-pressed={activeTab === 'preview'} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}><Globe className="h-3.5 w-3.5" /> Preview &amp; Export</button>
            </div>}
            <button type="button" onClick={() => setIsDarkMode((value) => !value)} title="Toggle Dark/Light Mode" className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-amber-400">{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-300" />}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">
        {activeModule === 'abroadready' ? <AbroadReadyModule isDarkMode={isDarkMode} /> : (
          <>
            <div className="print-hidden">
              <CountrySwitcher selectedRegion={region} onSelectRegion={handleCountryChange} />
            </div>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="print-hidden min-w-0 space-y-4">
                <div className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h2 className="flex items-center gap-2 text-base font-bold"><Building2 className="h-4 w-4 text-blue-600" /> Resume source</h2><p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{fileName} • Stored only in this browser</p></div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Upload className="h-3.5 w-3.5" />{loadingPdf ? 'Reading PDF…' : 'Upload PDF'}<input type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} disabled={loadingPdf} className="sr-only" /></label>
                      <button type="button" onClick={loadSample} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Load stress-test sample</button>
                    </div>
                  </div>
                  {errorMessage && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{errorMessage}</p>}
                  {pdfNotice && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{pdfNotice}</p>}
                  {scanWarning && <div role="alert" className="mt-3 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">This looks like a scanned image PDF</p><p className="text-xs leading-5">There is little extractable text. OCR is not performed locally by this tool yet. Paste the resume text into the editor below, or load the sample to explore the linter.</p><button type="button" onClick={loadSample} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800">Load Sample Pinoy Biodata</button></div>}
                  {scanWarning && <button type="button" onClick={() => resumeTextarea.current?.focus()} className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900">Paste extracted resume text here</button>}
                  <label className="mt-4 block text-xs font-semibold text-slate-600" htmlFor="resume-source">Edit or paste your resume</label>
                  <textarea ref={resumeTextarea} id="resume-source" value={profile.rawText} onChange={(event) => setRawText(event.target.value)} rows={19} className={`mt-2 w-full resize-y rounded-xl border p-4 font-mono text-xs leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'}`} />
                  <label className="mt-4 block text-xs font-semibold text-slate-600" htmlFor="job-description">Target job description (optional)</label>
                  <textarea id="job-description" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={4} placeholder="Paste a job description to estimate keyword alignment…" className={`mt-2 w-full resize-y rounded-xl border p-3 text-xs leading-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-800'}`} />
                </div>

                {activeTab === 'audit' ? (
                  <>
                    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold"><Award className="h-4 w-4 text-blue-600" /> Global Readiness Score</h3><span className="text-2xl font-bold text-slate-900">{report.score}<span className="text-sm text-slate-400">/100</span></span></div>
                      <div className="mt-4 space-y-3">
                        <ScorePillar label="Country Legal Compliance" value={report.pillars.legalCompliance} maximum={40} color="bg-blue-600" />
                        <ScorePillar label="Global Credential Clarity" value={report.pillars.credentialClarity} maximum={30} color="bg-violet-600" />
                        <ScorePillar label="ATS Impact & Keyword Alignment" value={report.pillars.atsImpact} maximum={30} color="bg-emerald-600" />
                      </div>
                    </div>
                    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-bold"><AlertCircle className="h-4 w-4 text-rose-600" /> Red flags &amp; weak openings <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{issues.length}</span></h3><button type="button" onClick={fixAllRedFlags} disabled={issues.length === 0} className="rounded-lg bg-rose-700 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-rose-800 disabled:opacity-40">Fix &amp; Strip Red Flags</button></div>
                      {issues.length === 0 ? <p className="py-5 text-center text-sm text-emerald-700">No red flags detected.</p> : <div className="max-h-[30rem] space-y-2 overflow-auto pr-1">
                        {issues.map((issue) => {
                          const hidden = issueIsHidden(issue, profile, region);
                          return <article key={issue.id} className={`rounded-xl border p-3 ${hidden ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/50'}`}>
                            <div className="flex items-start justify-between gap-2"><div><h4 className="text-xs font-bold text-slate-900">{issue.title}</h4><p className="mt-1 text-[11px] leading-5 text-slate-600">{issue.description}</p></div><button type="button" onClick={() => toggleIssueVisibility(issue)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${hidden ? 'bg-white text-emerald-800 ring-1 ring-emerald-300' : 'bg-rose-700 text-white hover:bg-rose-800'}`}>{hidden ? 'Undo / Restore Original' : 'Fix Red Flag'}</button></div>
                          </article>;
                        })}
                      </div>}
                    </div>
                    <div className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><BadgeCheck className="h-4 w-4 text-violet-600" /> PH-to-Global Credential Translator</h3>
                      {credentials.length === 0 ? <p className="text-xs text-slate-500">No supported credentials detected yet.</p> : <div className="space-y-2">{credentials.map((credential) => {
                        const applied = profile.appliedTranslations[credential.id];
                        return <article key={credential.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-slate-800">{credential.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{credential.equivalent}</p></div>{applied ? <button type="button" onClick={() => undoTranslation(credential.id, credential.lineIndex)} className="shrink-0 rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-semibold text-slate-700">Undo / Restore Original</button> : <button type="button" onClick={() => translateCredential(credential)} className="shrink-0 rounded-lg bg-violet-700 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-800">Translate Credential</button>}</div>
                        </article>;
                      })}</div>}
                      {hospitalRoleDetected && !hasBedCapacity && <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3"><p className="text-xs font-semibold text-blue-950">Add International Clinical Context</p><p className="mt-1 text-[11px] text-blue-800">Tertiary Level III Hospital | X-Bed Capacity | 1:X Nurse-to-Patient Ratio</p><button type="button" onClick={addHospitalContext} className="mt-2 rounded-lg bg-blue-700 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-blue-800">Add context to resume</button></div>}
                      {hospitalTranslation && <p className="mt-3 text-[10px] leading-4 text-slate-500">Credential equivalents are descriptive only; verify professional registration and local recognition requirements.</p>}
                    </div>
                  </>
                ) : (
                  <div className={`space-y-3 rounded-2xl border p-5 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                    <h3 className="text-sm font-bold">Clean ATS PDF export</h3>
                    <p className="text-xs leading-5 text-slate-500">The print stylesheet exports only the international preview below at full width. Choose A4 or Letter in your browser print dialog.</p>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"><FileText className="h-4 w-4" /> Export Clean ATS PDF</button>
                    <p className="text-[11px] leading-5 text-slate-500">Raw source, red-flag cards, score breakdown, and controls remain in localStorage and are not printed.</p>
                  </div>
                )}

                <section className={`rounded-2xl border p-4 shadow-sm ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <h3 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-amber-500" /> Enhance Work Bullets</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Offline rule-based enhancement, prompt copy, or optional Gemini BYOK. Verify all suggested facts and metrics.</p>
                  <label htmlFor="bullet-input" className="mt-3 block text-xs font-semibold text-slate-600">Bullet to improve</label>
                  <textarea id="bullet-input" rows={3} value={bulletInput} onChange={(event) => setBulletInput(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-800" />
                  <label htmlFor="target-job-title" className="mt-2 block text-xs font-semibold text-slate-600">Target job title (optional)</label>
                  <input id="target-job-title" value={targetJobTitle} onChange={(event) => setTargetJobTitle(event.target.value)} placeholder="e.g. Staff Nurse" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800" />
                  <label htmlFor="action-verb" className="mt-2 block text-xs font-semibold text-slate-600">Preferred action verb</label>
                  <select id="action-verb" value={actionVerb} onChange={(event) => setActionVerb(event.target.value)} className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
                    {['Spearheaded', 'Executed', 'Optimized', 'Administered', 'Maintained'].map((verb) => <option key={verb}>{verb}</option>)}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => applyBulletRewrite('deterministic')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Instant free rewrite</button>
                    <button type="button" onClick={() => void copyAiPrompt()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><Clipboard className="h-3.5 w-3.5" /> Copy AI Prompt</button>
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-200 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-700">Optional Gemini BYOK (gemini-2.5-flash)</summary>
                    <p className="mt-2 text-[11px] leading-5 text-amber-800">Your key is stored in this browser and sent directly to Google when you request a rewrite. The selected bullet and target region are also sent to Google. Do not use a key you cannot safely store here.</p>
                    <input type="password" autoComplete="off" value={geminiKey} onChange={(event) => setGeminiKey(event.target.value)} placeholder="Paste your Google AI Studio API key" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs" />
                    <button type="button" disabled={busy} onClick={() => void rewriteWithGemini()} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Rewriting…' : 'Rewrite with Gemini'}</button>
                  </details>
                  {enhancedBullet && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="whitespace-pre-wrap text-xs leading-5 text-emerald-950">{enhancedBullet}</p>{WEAK_VERB_RULES.some((rule) => rule.pattern.test(bulletInput)) && <button type="button" onClick={applyEnhancedBullet} className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-[10px] font-bold text-white">Use in international preview</button>}</div>}
                  {Object.keys(rewrittenBullets).length > 0 && <button type="button" onClick={() => { setRewrittenBullets({}); setEnhancedBullet(''); setEnhancerStatus('Original bullets restored in the preview.'); }} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-700"><RotateCcw className="h-3 w-3" /> Undo / Restore Original Bullet</button>}
                  {enhancerStatus && <p role="status" className="mt-2 text-[11px] leading-5 text-slate-600">{enhancerStatus}</p>}
                </section>
              </section>

              <section className="min-w-0 space-y-3">
                <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-base font-bold">Live resume preview</h2><p className="mt-1 text-xs text-slate-500">Original details remain stored; visibility is preview-only and reversible.</p></div>
                  <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Resume preview mode">
                    <button type="button" aria-pressed={viewMode === 'original'} onClick={() => setViewMode('original')} className={`rounded-lg px-3 py-2 text-[10px] font-bold sm:text-xs ${viewMode === 'original' ? 'bg-rose-600 text-white' : 'text-slate-600'}`}>🔴 Original Pinoy Biodata View</button>
                    <button type="button" aria-pressed={viewMode === 'international'} onClick={() => setViewMode('international')} className={`rounded-lg px-3 py-2 text-[10px] font-bold sm:text-xs ${viewMode === 'international' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>🟢 International ATS View</button>
                  </div>
                </div>
                <div className="print-hidden rounded-2xl border border-slate-200 bg-slate-200/70 p-3 shadow-inner sm:p-5">
                  <div className="mx-auto min-h-[29rem] max-w-[210mm] bg-white p-6 text-slate-900 shadow-xl sm:p-10">
                    <div className="mb-5 border-b-2 border-slate-800 pb-3"><h3 className="text-xl font-bold">{rawLines[0] || 'International Resume'}</h3><p className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{region.replaceAll('_', ' ')} • ATS resume preview</p></div>
                    {viewMode === 'original' ? (
                      <div className="space-y-0.5 font-mono text-xs leading-5">{rawLines.map((line, index) => renderPreviewLine(line, index, true))}{profile.photoDetected && <p data-preview-key="photo" className={`mt-3 rounded p-2 text-xs ${activeFlash === 'photo' ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-rose-100 text-rose-900'}`}>[Embedded image detected — review whether this is a 2x2 ID photo]</p>}</div>
                    ) : (
                      <div className="space-y-4 text-xs leading-6">{internationalLines.map(({ line, lineIndex }) => renderPreviewLine(line, lineIndex, false))}{profile.photoDetected && activeFlash === 'photo' && <p data-preview-key="photo" className="rounded bg-emerald-100 p-2 text-[10px] text-emerald-900 ring-2 ring-emerald-400">Embedded image hidden from the clean preview; original file remains unchanged.</p>}{profile.photoDetected && !visibleIssues.some((issue) => isImagePhotoField(issue.field)) && activeFlash !== 'photo' && <p className="text-[10px] text-slate-400">Embedded image present in source file; it is not rendered in this text preview.</p>}</div>
                    )}
                    <div className="mt-8 border-t border-slate-200 pt-3 text-[9px] text-slate-400">Generated locally by GlobalCV PH • Verify all credentials and claims before submission</div>
                  </div>
                </div>
                <div id="resume-print-area" aria-hidden="true">
                  <h1>{rawLines[0] || 'International Resume'}</h1>
                  <p className="print-subtitle">{region.replaceAll('_', ' ')} • International ATS Resume</p>
                  {internationalLines.map(({ lineIndex, displayText }) => <p key={lineIndex} className="print-resume-line">{displayText || '\u00a0'}</p>)}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="print-hidden border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">GlobalCV PH • Empowering Filipino Professionals &amp; Skilled Migrants Worldwide</p>
        <p className="mt-1">Client-side resume processing • No resume upload server • Local browser storage</p>
      </footer>
    </div>
  );
}
