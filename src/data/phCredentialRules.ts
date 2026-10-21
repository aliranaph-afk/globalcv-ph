import type { CredentialTranslation } from '../types/resume';

export interface CredentialRule {
  id: string;
  label: string;
  patterns: RegExp[];
  equivalent: string;
  sector: 'Healthcare' | 'Trades & Engineering' | 'Maritime & Hospitality' | 'Corporate & Government';
}

export interface BiodataRule {
  id: string;
  label: string;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

export interface WeakVerbRule {
  id: string;
  label: string;
  pattern: RegExp;
  actionVerb: string;
}

export const CREDENTIAL_RULES: CredentialRule[] = [
  { id: 'prc-rn', label: 'PRC Registered Nurse (RN)', patterns: [/\bPRC\s*(?:registered\s*)?nurse\b|\bRN\b/i], equivalent: 'Philippine Registered Nurse; PRC-licensed (verify destination-country registration requirements)', sector: 'Healthcare' },
  { id: 'prc-rmt', label: 'PRC Registered Medical Technologist (RMT)', patterns: [/\bRMT\b|\bregistered medical technologist\b/i], equivalent: 'PRC-licensed Medical Laboratory Scientist / Medical Technologist', sector: 'Healthcare' },
  { id: 'prc-ptrp', label: 'PRC Physical Therapist (PTRP)', patterns: [/\bPTRP\b|\bregistered physical therapist\b/i], equivalent: 'PRC-licensed Physical Therapist', sector: 'Healthcare' },
  { id: 'red-cross-bls-acls', label: 'Red Cross BLS / ACLS', patterns: [/\b(?:red cross )?(?:BLS|ACLS)\b/i], equivalent: 'Basic / Advanced Life Support certification (issuer and expiry should be stated)', sector: 'Healthcare' },
  { id: 'caregiving-nc2', label: 'Caregiving NC II', patterns: [/\bcaregiving\s*(?:NC\s*)?II\b|\bNC\s*II\s*caregiving\b/i], equivalent: 'TESDA National Certificate II in Caregiving', sector: 'Healthcare' },
  { id: 'doh-licensed', label: 'DOH Licensed', patterns: [/\bDOH[- ]licensed\b|\blicensed by (?:the )?DOH\b/i], equivalent: 'Philippines Department of Health authorization (specify facility/credential and validity)', sector: 'Healthcare' },
  { id: 'tesda-nc', label: 'TESDA National Certificate', patterns: [/\bTESDA\b.{0,30}\bNC\s*[I1V]+\b|\bNC\s*[I1V]+\b.{0,30}\bTESDA\b/i, /\bTESDA\s+NC\s*(?:I|II|III|IV|1|2|3|4)\b/i], equivalent: 'TESDA National Certificate; state qualification, level, assessment date, and certificate number', sector: 'Trades & Engineering' },
  { id: 'smaw-gtaw', label: 'SMAW / GTAW Welding', patterns: [/\bSMAW\b|\bGTAW\b|\bshielded metal arc welding\b|\bgas tungsten arc welding\b/i], equivalent: 'Shielded Metal Arc Welding / Gas Tungsten Arc Welding (include process qualification and position)', sector: 'Trades & Engineering' },
  { id: 'automotive', label: 'Automotive Servicing', patterns: [/\bautomotive servicing\b/i], equivalent: 'Automotive Service Technician training (state TESDA level and systems serviced)', sector: 'Trades & Engineering' },
  { id: 'eim-hvac', label: 'EIM / HVAC-RAC', patterns: [/\bEIM\b|\belectrical installation and maintenance\b|\bHVAC(?:\/RAC|-RAC)?\b|\bRAC\b/i], equivalent: 'Electrical Installation and Maintenance / Heating, Ventilation, Air Conditioning and Refrigeration training', sector: 'Trades & Engineering' },
  { id: 'plumbing-heavy-equipment-carpentry', label: 'Plumbing / Heavy Equipment / Carpentry', patterns: [/\bplumbing\b|\bheavy equipment operation\b|\bheavy equipment operator\b|\bcarpentry\b/i], equivalent: 'Trade qualification; specify equipment, tools, safety standards, and verified hours', sector: 'Trades & Engineering' },
  { id: 'rme', label: 'Registered Master Electrician (RME)', patterns: [/\bRME\b|\bregistered master electrician\b/i], equivalent: 'Philippine Registered Master Electrician (state license details and destination licensing equivalency separately)', sector: 'Trades & Engineering' },
  { id: 'prc-engineer', label: 'PRC Civil / Mechanical / Electrical Engineer', patterns: [/\bPRC\b.{0,24}\b(?:civil|mechanical|electrical)\s+engineer\b|\b(?:civil|mechanical|electrical)\s+engineer\b.{0,24}\bPRC\b/i], equivalent: 'PRC-licensed Professional Engineer; include discipline and license status', sector: 'Trades & Engineering' },
  { id: 'safety-officer', label: 'BOSH SO1 / SO2 / COSH', patterns: [/\bBOSH\b|\bSO\s*[12]\b|\bCOSH\b/i], equivalent: 'Basic / Construction Occupational Safety and Health training; state course and accredited provider', sector: 'Trades & Engineering' },
  { id: 'dpwh', label: 'DPWH Projects', patterns: [/\bDPWH\b/i], equivalent: 'Department of Public Works and Highways project experience (include project scope, contract, and measurable outcomes)', sector: 'Trades & Engineering' },
  { id: 'sirb', label: "Seafarer's Identification and Record Book (SIRB)", patterns: [/\bSIRB\b|\bseaman'?s book\b|\bseafarer'?s book\b/i], equivalent: 'Philippine Seafarer\'s Identification and Record Book; state validity', sector: 'Maritime & Hospitality' },
  { id: 'marina-cop', label: 'MARINA Certificate of Proficiency (COP)', patterns: [/\bMARINA\b.{0,30}\bCOP\b|\bCOP\b.{0,30}\bMARINA\b/i], equivalent: 'MARINA Certificate of Proficiency; specify endorsement and validity', sector: 'Maritime & Hospitality' },
  { id: 'basic-training', label: 'Basic Training (BT / SOLAS)', patterns: [/\bBT\b.{0,24}\bSOLAS\b|\bSOLAS\b.{0,24}\bBT\b|\bbasic training\b/i], equivalent: 'STCW Basic Training / SOLAS safety training (verify course and expiry)', sector: 'Maritime & Hospitality' },
  { id: 'sdsc-pscrb', label: 'SDSC / PSCRB', patterns: [/\bSDSC\b|\bPSCRB\b/i], equivalent: 'Shipboard Security Duties / Proficiency in Survival Craft and Rescue Boats training', sector: 'Maritime & Hospitality' },
  { id: 'haccp', label: 'HACCP', patterns: [/\bHACCP\b/i], equivalent: 'Hazard Analysis and Critical Control Points food-safety training', sector: 'Maritime & Hospitality' },
  { id: 'hospitality-nc2', label: 'Cookery / FBS / Housekeeping / Barista / Bartending NC II', patterns: [/\b(?:cookery|food and beverage services|FBS|housekeeping|barista|bartending)\s*(?:NC\s*)?II\b/i], equivalent: 'TESDA National Certificate II; specify hospitality specialization and practical scope', sector: 'Maritime & Hospitality' },
  { id: 'prc-cpa', label: 'PRC Certified Public Accountant (CPA)', patterns: [/\bPRC\b.{0,20}\bCPA\b|\bCPA\b.{0,20}\bPRC\b|\bcertified public accountant\b/i], equivalent: 'Philippine CPA; foreign accounting designations require separate recognition', sector: 'Corporate & Government' },
  { id: 'csc-eligibility', label: 'Civil Service Commission Eligibility', patterns: [/\bCSC\b|\bcivil service\b.{0,24}\beligible\b/i], equivalent: 'Philippine Civil Service Commission Professional / Sub-Professional Eligibility', sector: 'Corporate & Government' },
  { id: 'bookkeeping-nc3', label: 'Bookkeeping NC III', patterns: [/\bbookkeeping\s*(?:NC\s*)?III\b|\bNC\s*III\s*bookkeeping\b/i], equivalent: 'TESDA National Certificate III in Bookkeeping', sector: 'Corporate & Government' },
  { id: 'contact-center-nc2', label: 'Contact Center Services NC II', patterns: [/\bcontact center services\b|\bcontact centre services\b/i], equivalent: 'TESDA Contact Center Services National Certificate II', sector: 'Corporate & Government' },
  { id: 'honors-scholar', label: 'Academic Honors / DOST / CHED Scholar', patterns: [/\bcum laude\b|\bmagna cum laude\b|\bDOST\b.{0,20}\bscholar\b|\bCHED\b.{0,20}\bscholar\b/i], equivalent: 'Academic honors or scholarship (include institution, award, and date)', sector: 'Corporate & Government' },
  { id: 'sk-service', label: 'Sangguniang Kabataan Service', patterns: [/\bSangguniang Kabataan\b|\bSK\b.{0,20}\b(?:chairman|councilor|council)\b/i], equivalent: 'Elected youth council leadership; describe governance, programs, budget, and outcomes', sector: 'Corporate & Government' },
  { id: 'ojt', label: 'On-the-Job Training (OJT)', patterns: [/\bOJT\b|\bon[- ]the[- ]job trainee\b|\bon[- ]the[- ]job training\b/i], equivalent: 'Internship / supervised work placement (include employer, hours, responsibilities, and outcomes)', sector: 'Corporate & Government' },
];

export const BIODATA_RULES: BiodataRule[] = [
  { id: 'photo', label: 'Photo / 2x2 ID photo', pattern: /\b(?:2\s*[x×]\s*2\s*)?(?:ID\s*)?(?:photo|photograph|headshot|picture)\b/i, description: 'A photo is commonly unnecessary for ATS applications and may expose protected characteristics.', recommendation: 'Hide the photo from this country profile preview; the original remains available.' },
  { id: 'religion', label: 'Religion', pattern: /\b(?:religion|roman catholic|iglesia ni cristo|born again|islam|muslim|catholic)\b/i, description: 'Religious affiliation is sensitive personal information and is generally not relevant to a CV.', recommendation: 'Hide religious details from the international preview.' },
  { id: 'civil-status', label: 'Civil status', pattern: /\b(?:civil status|single|married|widowed|divorced)\b/i, description: 'Civil status is personal information and typically does not belong on an international CV.', recommendation: 'Hide civil-status details from the international preview.' },
  { id: 'date-of-birth', label: 'Date of birth / age', pattern: /\b(?:date of birth|birth date|DOB|age)\s*[:|-]?\s*\w*/i, description: 'Age and date of birth can introduce bias and are usually unnecessary in an international CV.', recommendation: 'Hide date of birth or age from the international preview.' },
  { id: 'passport-validity', label: 'Passport validity details', pattern: /\bpassport\s+(?:valid(?:ity)?\s+until|expires?\s*(?:on|:)?|expiry\s*[:|-]?)\s*[^\n|]*/i, description: 'Passport details are sensitive identity information. Share them only through verified, necessary recruitment channels.', recommendation: 'Hide passport validity details from the public-facing CV preview.' },
  { id: 'height-weight', label: 'Height / weight', pattern: /\b(?:height|weight)\s*[:|-]?\s*[\w.'"]+/i, description: 'Physical measurements are usually irrelevant unless a role explicitly requires them.', recommendation: 'Hide height and weight from the international preview.' },
  { id: 'family-names', label: "Parents' names", pattern: /\b(?:father'?s name|mother'?s name|father|mother)\s*[:|-]\s*[A-Z][\w .'-]+/i, description: 'Family member names are unnecessary personal data in a professional CV.', recommendation: 'Hide family details from the international preview.' },
  { id: 'government-ids', label: 'Philippine government ID numbers', pattern: /\b(?:SSS|TIN|PhilHealth|Pag[- ]?IBIG)\s*(?:no\.?|number|#)?\s*[:#-]?\s*[A-Z0-9-]{3,}/i, description: 'Government identification numbers should not be exposed in job applications.', recommendation: 'Hide government ID numbers and share them only through verified, appropriate channels.' },
  { id: 'oath', label: 'Personal-data certification oath', pattern: /I hereby certify(?: that)? the above information is true and correct/i, description: 'A personal-data oath is not typically part of an international resume.', recommendation: 'Hide the oath from the international preview.' },
  { id: 'references', label: 'References available upon request', pattern: /\bcharacter references:\s*available upon request\b/i, description: 'This phrase uses space without adding evidence; provide references separately when requested.', recommendation: 'Hide this line and prepare a separate reference list if requested.' },
];

export const WEAK_VERB_RULES: WeakVerbRule[] = [
  { id: 'responsible-for', label: 'Responsible for…', pattern: /^\s*(?:[-*•]\s*)?responsible for\s+/i, actionVerb: 'Executed' },
  { id: 'tasked-to', label: 'Tasked to…', pattern: /^\s*(?:[-*•]\s*)?tasked to\s+/i, actionVerb: 'Delivered' },
  { id: 'duties-include', label: 'Duties and responsibilities include…', pattern: /^\s*(?:[-*•]\s*)?duties and responsibilities include\s+/i, actionVerb: 'Administered' },
  { id: 'in-charge-of', label: 'In charge of…', pattern: /^\s*(?:[-*•]\s*)?in charge of\s+/i, actionVerb: 'Led' },
  { id: 'handled-the', label: 'Handled the…', pattern: /^\s*(?:[-*•]\s*)?handled the\s+/i, actionVerb: 'Managed' },
  { id: 'handled', label: 'Handled…', pattern: /^\s*(?:[-*•]\s*)?handled\s+/i, actionVerb: 'Managed' },
];

export const STRESS_TEST_SAMPLE_PINOY_RESUME = `JUAN DELA CRUZ
2x2 ID Photo: attached
Date of Birth: January 15, 1990 | Age: 36
Nationality: Filipino | Civil Status: Single
Height: 5'7" | Weight: 65 kg
Religion: Roman Catholic
Father's Name: Pedro Dela Cruz | Mother's Name: Maria Santos
SSS No: 12-3456789-0 | TIN: 123-456-789 | PhilHealth No: 12-345678901-2 | Pag-IBIG No: 1234-5678-9012
Passport Valid Until: 2030-06-30
Address: Quezon City, Philippines | Email: juan.delacruz@email.com

PROFESSIONAL SUMMARY
Responsible for providing quality patient care in a busy tertiary hospital.
Duties and responsibilities include monitoring vital signs and administering medications.

WORK EXPERIENCE
Staff Nurse, Sample General Hospital | 2021–Present
- Responsible for monitoring patients and coordinating bedside care.
- Tasked to maintain accurate clinical records and medication logs.
- Handled the admissions and discharge process for assigned patients.
- In charge of daily shift handover and infection-control checks.

EDUCATION & CREDENTIALS
BS Nursing, Sample University
PRC Registered Nurse (RN) | RMT | PTRP
Red Cross BLS/ACLS | DOH Licensed
TESDA NC II Caregiving | TESDA NC II SMAW
TESDA NC II Electrical Installation & Maintenance (EIM)
RME | PRC Civil Engineer | BOSH SO2 | COSH | DPWH Projects
SIRB | MARINA COP | BT (Basic Training / SOLAS) | SDSC | PSCRB
HACCP | Cookery NC II | Food and Beverage Services (FBS) NC II
Housekeeping NC II | Barista NC II | Bartending NC II
PRC CPA | CSC Professional Eligible | Bookkeeping NC III
Contact Center Services NC II | Cum Laude | DOST Scholar
Sangguniang Kabataan (SK) Councilor | OJT / On-the-Job Trainee

Character References: Available upon request

I hereby certify that the above information is true and correct to the best of my knowledge and belief.`;

export const SAMPLE_PINOY_RESUME = STRESS_TEST_SAMPLE_PINOY_RESUME;

export const CREDENTIAL_TRANSLATIONS = CREDENTIAL_RULES;

export function detectCredentialTranslations(text: string): CredentialTranslation[] {
  const translations: CredentialTranslation[] = [];
  text.split('\n').forEach((line, lineIndex) => {
    CREDENTIAL_RULES.forEach((rule) => {
      const matchedText = rule.patterns.find((pattern) => pattern.test(line))?.exec(line)?.[0];
      if (!matchedText) return;
      const id = `${rule.id}-${lineIndex}`;
      if (!translations.some((translation) => translation.id === id)) {
        translations.push({
          id,
          label: rule.label,
          equivalent: rule.equivalent,
          sector: rule.sector,
          matchedText,
          lineIndex,
        });
      }
    });
  });
  return translations;
}

export function rewriteWeakBullet(line: string, actionVerb = 'Optimized'): string {
  const rule = WEAK_VERB_RULES.find((candidate) => candidate.pattern.test(line));
  if (!rule) return line;
  const selectedVerb = actionVerb || rule.actionVerb;
  const remainder = line.replace(rule.pattern, '').replace(/^[\s:,-]+/, '').trim();
  const normalizedRemainder = remainder.replace(/^the\s+/i, '');
  if (/\bmonitor(?:ing)?\s+patients?\b/i.test(normalizedRemainder)) {
    const bulletPrefix = /^\s*(?:[-*•]\s*)?/.exec(line)?.[0] ?? '';
    return `${bulletPrefix}Monitored and triaged [X]+ patients daily in a [X]-bed facility, ensuring [X]% compliance with clinical protocols.`;
  }
  const actionByGerund: Record<string, string> = {
    monitoring: 'Monitored',
    monitor: 'Monitored',
    handling: 'Managed',
    handle: 'Managed',
    maintaining: 'Maintained',
    maintain: 'Maintained',
    administering: 'Administered',
    administer: 'Administered',
    coordinating: 'Coordinated',
    coordinate: 'Coordinated',
    managing: 'Managed',
    manage: 'Managed',
    leading: 'Led',
    lead: 'Led',
    optimizing: 'Optimized',
    optimize: 'Optimized',
    receiving: 'Processed',
    receive: 'Processed',
    encoding: 'Recorded',
    encode: 'Recorded',
    answering: 'Resolved',
    answer: 'Resolved',
    providing: 'Delivered',
    provide: 'Delivered',
    helping: 'Supported',
    help: 'Supported',
    assisting: 'Supported',
    assist: 'Supported',
    checking: 'Verified',
    check: 'Verified',
  };
  const firstWord = normalizedRemainder.split(/\s+/)[0]?.toLowerCase() ?? '';
  const action = actionByGerund[firstWord] ?? selectedVerb;
  const scope = actionByGerund[firstWord]
    ? normalizedRemainder.replace(/^\S+/, '').trim()
    : normalizedRemainder;
  const bulletPrefix = /^\s*(?:[-*•]\s*)?/.exec(line)?.[0] ?? '';
  const impact = /\b(?:patient|nurs|clinical|medication|vital sign)\b/i.test(line)
    ? '[X]+ patients per shift, maintaining [X]% protocol compliance'
    : '[X]+ cases per [day/week], improving [X]% accuracy or turnaround';
  return `${bulletPrefix}${action} ${scope || 'key operations'}, delivering ${impact}.`;
}
