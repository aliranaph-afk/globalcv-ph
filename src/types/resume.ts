export type TargetRegion = 'EU' | 'WESTERN_ATS' | 'MIDDLE_EAST_ASIA' | 'MARITIME_HEALTHCARE';

export type AuditCategory = 'biodata' | 'format' | 'credential' | 'action_verbs' | 'privacy';

export interface ResumeProfile {
  rawText: string;
  photoDetected: boolean;
  dateOfBirth: string | null;
  civilStatus: string | null;
  nationality: string | null;
  religion: string | null;
  passportValidity: string | null;
  hiddenFields: string[];
  visibleOverrides: string[];
  appliedTranslations: Record<string, string>;
}

export interface AuditIssue {
  id: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  category: AuditCategory;
  title: string;
  description: string;
  recommendation: string;
  lineIndex?: number;
  matchedText?: string;
}

export interface ScorePillars {
  legalCompliance: number;
  credentialClarity: number;
  atsImpact: number;
}

export interface AuditReport {
  score: number;
  potentialScore: number;
  issues: AuditIssue[];
  strippedCount: number;
  pillars: ScorePillars;
}

export interface CredentialTranslation {
  id: string;
  label: string;
  equivalent: string;
  sector: string;
  matchedText: string;
  lineIndex: number;
}

export interface PdfParseResult {
  text: string;
  pageCount: number;
  imageCount: number;
  isScannedImage: boolean;
}

export type ResumeViewMode = 'original' | 'international';
