export type AbroadReadyTool = 'placement-fees' | 'remittance' | 'direct-hire';

export type RuleVerificationStatus = 'verified' | 'needs-review' | 'unverified';

export interface OfficialRuleSource {
  label: string;
  url: string;
  retrievedAt: string;
}

export interface DmwPlacementFeeRule {
  id: string;
  destinationCountry: string;
  occupationCategory: string;
  maximumFeePhp: number | null;
  feeBasis: 'monthly-salary' | 'fixed-amount' | 'prohibited' | 'case-specific';
  conditions: string[];
  effectiveFrom: string | null;
  status: RuleVerificationStatus;
  sources: OfficialRuleSource[];
}

export interface CountryRemittanceRule {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  taxYear: number | null;
  incomeTaxNotes: string[];
  exchangeRateToPhp: number | null;
  exchangeRateDate: string | null;
  status: RuleVerificationStatus;
  sources: OfficialRuleSource[];
}

export interface DirectHireChecklistItem {
  id: string;
  phase: 1 | 2;
  label: string;
  description: string;
  required: boolean;
  source: OfficialRuleSource | null;
}
