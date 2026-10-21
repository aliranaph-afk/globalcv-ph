import { BIODATA_RULES, detectCredentialTranslations, WEAK_VERB_RULES } from '../data/phCredentialRules';
import type { AuditIssue, AuditReport, ScorePillars, TargetRegion } from '../types/resume';

const REGIONS_WITH_STRICT_PRIVACY_DEFAULTS: TargetRegion[] = ['EU', 'WESTERN_ATS'];

function clamp(value: number, maximum: number): number {
  return Math.max(0, Math.min(maximum, Math.round(value)));
}

export function auditResumeText(
  text: string,
  region: TargetRegion,
  hasPhoto = false,
  jobDescription = '',
  appliedTranslationCount = 0,
): AuditReport {
  const issues: AuditIssue[] = [];
  const lines = text.split('\n');
  const strictPrivacy = REGIONS_WITH_STRICT_PRIVACY_DEFAULTS.includes(region);

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;
    BIODATA_RULES.forEach((rule) => {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(line);
      if (!match) return;
      const isSensitive = rule.id !== 'photo';
      issues.push({
        id: `${rule.id}-${lineIndex}`,
        field: rule.label,
        severity: strictPrivacy && isSensitive ? 'error' : 'warning',
        category: rule.id === 'government-ids' ? 'privacy' : 'biodata',
        title: `${rule.label} detected`,
        description: rule.description,
        recommendation: rule.recommendation,
        lineIndex,
        matchedText: match[0],
      });
    });

    const weakRule = WEAK_VERB_RULES.find((rule) => rule.pattern.test(line));
    if (weakRule) {
      issues.push({
        id: `${weakRule.id}-${lineIndex}`,
        field: 'Experience bullet',
        severity: 'warning',
        category: 'action_verbs',
        title: `Weak opening: ${weakRule.label}`,
        description: 'Lead with a specific action and show the scope or measurable result of the work.',
        recommendation: `Rewrite with an impact verb and add a real metric, such as ${weakRule.actionVerb} [scope] and improved [X]% or served [X] people.`,
        lineIndex,
        matchedText: line.trim(),
      });
    }
  });

  if (hasPhoto && !issues.some((issue) => issue.field === 'Photo / 2x2 ID photo')) {
    issues.push({
      id: 'embedded-photo',
      field: 'Photo / 2x2 ID photo',
      severity: strictPrivacy ? 'error' : 'warning',
      category: 'biodata',
      title: 'Embedded image detected in PDF',
      description: 'The uploaded PDF contains an embedded image. Review it to determine whether it is an ID or profile photo.',
      recommendation: 'Review the embedded image; hide it in the international preview if it is a personal photo.',
    });
  }

  const credentials = detectCredentialTranslations(text);
  const translatedCredentialCount = Math.min(appliedTranslationCount, credentials.length);
  const credentialClarity = credentials.length === 0
    ? 30
    : clamp((translatedCredentialCount / credentials.length) * 30, 30);
  const flaggedCount = issues.filter((issue) => issue.category === 'biodata' || issue.category === 'privacy').length;
  const legalCompliance = clamp(40 - Math.min(40, flaggedCount * 5), 40);
  const weakCount = issues.filter((issue) => issue.category === 'action_verbs').length;
  const metricLineCount = lines.filter((line) => /\b\d+(?:[.,]\d+)?%|\b\d{2,}\b/.test(line)).length;
  const keywordCount = jobDescription.trim()
    ? new Set(jobDescription.toLowerCase().match(/[a-z][a-z0-9+#.-]{3,}/g) ?? [])
      .values()
    : null;
  let keywordAlignment = 0;
  if (keywordCount) {
    const keywords = Array.from(keywordCount);
    const resumeLower = text.toLowerCase();
    keywordAlignment = keywords.length === 0
      ? 0
      : keywords.filter((keyword) => resumeLower.includes(keyword)).length / keywords.length;
  }
  const atsImpact = clamp(
    30 - Math.min(15, weakCount * 3) + Math.min(8, metricLineCount * 2) + Math.round(keywordAlignment * 7),
    30,
  );

  const pillars: ScorePillars = { legalCompliance, credentialClarity, atsImpact };
  const score = legalCompliance + credentialClarity + atsImpact;
  return {
    score,
    potentialScore: Math.min(100, score + flaggedCount * 4 + weakCount * 2 + Math.max(0, credentials.length - translatedCredentialCount)),
    issues,
    strippedCount: 0,
    pillars,
  };
}

export function auditResume(options: {
  text: string;
  region: TargetRegion;
  hasPhoto?: boolean;
  jobDescription?: string;
  appliedTranslationCount?: number;
}): AuditReport {
  return auditResumeText(
    options.text,
    options.region,
    options.hasPhoto ?? false,
    options.jobDescription ?? '',
    options.appliedTranslationCount ?? 0,
  );
}

export function sanitizeResume(text: string, region: TargetRegion): { text: string } {
  void region;
  return { text };
}
