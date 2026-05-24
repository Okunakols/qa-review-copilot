// Finding types — QA/compliance-focused categories
export const FINDING_TYPES = {
  TRACEABILITY: 'TRACEABILITY',
  ACCEPTANCE_CRITERIA: 'ACCEPTANCE_CRITERIA',
  EVIDENCE: 'EVIDENCE',
  REVISION_CONTROL: 'REVISION_CONTROL',
  LOGIC: 'LOGIC',
  SAMPLE_SIZE: 'SAMPLE_SIZE',
  RISK_VALIDATION: 'RISK_VALIDATION',
  QA_GAP: 'QA_GAP',
  SCOPE: 'SCOPE',
  GRAMMAR: 'GRAMMAR',
  OBSERVATION: 'OBSERVATION',
  OFI: 'OFI',
};

export const FINDING_TYPE_LABELS = {
  TRACEABILITY: 'Traceability',
  ACCEPTANCE_CRITERIA: 'Acceptance Criteria',
  EVIDENCE: 'Objective Evidence',
  REVISION_CONTROL: 'Revision Control',
  LOGIC: 'Logic',
  SAMPLE_SIZE: 'Sample Size',
  RISK_VALIDATION: 'Risk Validation',
  QA_GAP: 'QA Gap',
  SCOPE: 'Scope',
  GRAMMAR: 'Grammar',
  OBSERVATION: 'Observation',
  OFI: 'OFI',
};

// Severity levels — strict QA hierarchy
export const SEVERITY_LEVELS = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  OBSERVATION: 'OBSERVATION',
  OFI: 'OFI',
};

export const SEVERITY_ICONS = {
  Critical: '\uD83D\uDD34',
  High: '\uD83D\uDD35',
  Medium: '\uD83D\uDFE1',
  Low: '\uD83D\uDFE2',
  OBSERVATION: '\uD83D\uDD35',
  OFI: '\uD83D\uDFE2',
};

export const SEVERITY_BADGE_CLASSES = {
  Critical: 'sbC',
  High: 'sbH',
  Medium: 'sbM',
  Low: 'sbN',
  OBSERVATION: 'sbObs',
  OFI: 'sbOfi',
};

export const SEVERITY_CARD_CLASSES = {
  Critical: 'sC',
  High: 'sH',
  Medium: 'sM',
  Low: 'sN',
  OBSERVATION: 'sObs',
  OFI: 'sOfi',
};

// Regulatory pathways
export const REGULATORY_PATHWAYS = {
  ISO13485: 'ISO 13485',
  EUMDR: 'EU MDR',
  FDA: 'FDA 21 CFR',
  ALL: 'All Pathways',
};

// Intensity levels
export const INTENSITY_LEVELS = {
  Light: 'Light',
  Standard: 'Standard',
  Strict: 'Strict / Audit',
};

// Tone options
export const TONE_OPTIONS = {
  Formal: 'Formal / Audit',
  Simple: 'Simple',
  Friendly: 'Friendly',
};

// Language options
export const LANGUAGE_OPTIONS = {
  Turkish: 'Turkish',
  English: 'English',
};

// localStorage keys
export const LS_KEYS = {
  SOURCES: 'dr_src',
  CONFIG: 'dr_cfg',
  HISTORY: 'dr_hist',
};

// sessionStorage keys
export const SS_KEYS = {
  API_KEY: 'dr_key',
};

// Risk mapping
export const RISK_MAP = {
  High: ['rb-H', 'HIGH RISK'],
  Medium: ['rb-M', 'MEDIUM RISK'],
  Low: ['rb-L', 'LOW RISK'],
};

// Audit readiness mapping
export const READINESS_MAP = {
  'Not Ready': 'rbadge-nr NOT READY',
  'Needs Work': 'rbadge-nw NEEDS WORK',
  'Mostly Ready': 'rbadge-mr MOSTLY READY',
  'Audit Ready': 'rbadge-ar AUDIT READY',
};

// Analysis steps
export const ANALYSIS_STEPS = [
  { id: 'parse', label: 'Parsing document structure\u2026' },
  { id: 'load', label: 'Loading source library\u2026' },
  { id: 'send', label: 'Sending to AI engine\u2026' },
  { id: 'analyze', label: 'Analyzing findings\u2026' },
  { id: 'inject', label: 'Injecting Word comments\u2026' },
  { id: 'finalize', label: 'Finalizing output\u2026' },
];
