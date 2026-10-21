import type {
  CountryRemittanceRule,
  DmwPlacementFeeRule,
  DirectHireChecklistItem,
} from '../types/abroadReady';

export const RULES_DATASET_VERSION = '0.1.0';
export const RULES_DATASET_LAST_VERIFIED: string | null = null;

export const DMW_PLACEMENT_FEE_RULES: DmwPlacementFeeRule[] = [];
export const COUNTRY_REMITTANCE_RULES: CountryRemittanceRule[] = [];
export const DMW_DIRECT_HIRE_CHECKLIST: DirectHireChecklistItem[] = [];

export const RULES_DATASET_NOTICE =
  'Reference data is not yet populated. Do not calculate or present legal, tax, or exchange-rate results until each rule has been verified against a current official source.';
