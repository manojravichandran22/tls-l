// ─────────────────────────────────────────────────────────────────────────────
// KPI Master Configuration & Guidance Data
// ─────────────────────────────────────────────────────────────────────────────
// This file contains structured static text, guidelines, and bullet points
// for each KPI module section (1 to 9) and global alert banner.
// You can edit or add items in JSON format below.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global Guidance / Alert Banner displayed at the top of the KPI Configuration screen.
 */
export const GLOBAL_KPI_GUIDANCE =
  'Enter KPI values carefully. Thresholds are used for automatic scoring, dashboard alerts, trend analysis, and executive summaries. Once the daily KPI is submitted and saved, previous day KPI entries cannot be modified or edited.'

/**
 * Section Guidance Data
 * Keyed by section header title (uppercase).
 */
export const SECTION_GUIDANCE: Record<string, string[]> = {
  // 1. MASTER INPUTS
  'MASTER INPUTS': [
    'Enter sewing line operating cost per minute - eg. 5.32',
    'Enter average garment production cost per piece - eg. 170',
    'Enter standard TLS issue closure time - eg. 12',
  ],

  // 2. TLS AUDIT FAILURE
  'TLS AUDIT FAILURE': [
    'Define maximum allowed TLS audit failures',
    'More failures reduce KPI score',
    'Used for quality compliance scoring',
  ],

  // 3. REWORK THRESHOLD
  'REWORK THRESHOLD': [
    'Enter allowed rework pieces per operator/day',
    'Lower rework improves KPI score',
    'Used for operator quality monitoring',
  ],

  // 4. REJECTION THRESHOLD
  'REJECTION THRESHOLD': [
    'Enter maximum allowed rejection pieces',
    'Zero rejection is ideal condition',
    'High rejection affects factory quality rating',
  ],

  // 5. OVERALL REWORK
  'OVERALL REWORK': [
    'Enter allowed factory rework percentage',
    'Used for overall quality performance tracking',
    'Lower rework percentage gives better score',
  ],

  // 6. OVERALL REJECTION
  'OVERALL REJECTION': [
    'Enter overall rejection percentage limit',
    'Used for management quality dashboard',
    'High rejection affects shipment approval',
  ],

  // 7. OVERALL AQL PASS
  'OVERALL AQL PASS': [
    'Enter target AQL pass percentage',
    'Used for buyer quality compliance monitoring',
    'Higher AQL pass percentage improves KPI score',
  ],
  'AQL PASS': [
    'Enter target AQL pass percentage',
    'Used for buyer quality compliance monitoring',
    'Higher AQL pass percentage improves KPI score',
  ],

  // 8. OVERALL SCORE / GRADING
  'OVERALL SCORE': [
    'The overall score is calculated based on the configured AQL pass percentage.',
    'Use the grading thresholds below to classify overall quality performance.',
    'Higher scores indicate better quality performance.',
  ],
  'GRADING': [
    'The overall score is calculated based on the configured AQL pass percentage.',
    'Use the grading thresholds below to classify overall quality performance.',
    'Higher scores indicate better quality performance.',
  ],

  // 9. MACHINE RATING / DOWNTIME
  'MACHINE RATING': [
    'Rating is based on average machine downtime per day.',
    'Lower downtime results in a higher machine rating.',
    'Use the configured thresholds to monitor machine reliability and maintenance performance.',
  ],
  'MACHINE DOWNTIME': [
    'Rating is based on average machine downtime per day.',
    'Lower downtime results in a higher machine rating.',
    'Use the configured thresholds to monitor machine reliability and maintenance performance.',
  ],
}

/**
 * Number-based index guidance mapping (1 to 9)
 * Guarantees that section 1 through 9 always have the right guidance even if section names vary.
 */
export const NUMBERED_SECTION_GUIDANCE: Record<number, string[]> = {
  1: SECTION_GUIDANCE['MASTER INPUTS'],
  2: SECTION_GUIDANCE['TLS AUDIT FAILURE'],
  3: SECTION_GUIDANCE['REWORK THRESHOLD'],
  4: SECTION_GUIDANCE['REJECTION THRESHOLD'],
  5: SECTION_GUIDANCE['OVERALL REWORK'],
  6: SECTION_GUIDANCE['OVERALL REJECTION'],
  7: SECTION_GUIDANCE['OVERALL AQL PASS'],
  8: SECTION_GUIDANCE['OVERALL SCORE'],
  9: SECTION_GUIDANCE['MACHINE RATING'],
}

/**
 * Fallback guidance used when a section doesn't have an entry above.
 */
export const DEFAULT_SECTION_GUIDANCE: string[] = [
  'Define benchmark thresholds and scoring criteria for this module',
  'Review conditions and target values carefully before saving',
  'Values are used for automatic scoring, trend analysis, and dashboard alerts',
]

/**
 * Helper to get guidance bullet points for a section name or index.
 */
export function getSectionGuidance(sectionName?: string, sectionNumber?: number): string[] {
  // If sectionNumber is provided (1 to 9), check numbered guidance first
  if (sectionNumber && NUMBERED_SECTION_GUIDANCE[sectionNumber]) {
    return NUMBERED_SECTION_GUIDANCE[sectionNumber]
  }

  if (!sectionName) return DEFAULT_SECTION_GUIDANCE

  const normalized = sectionName.trim().toUpperCase()

  // Exact match
  if (SECTION_GUIDANCE[normalized]) {
    return SECTION_GUIDANCE[normalized]
  }

  // Partial match fallback
  for (const [key, bullets] of Object.entries(SECTION_GUIDANCE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return bullets
    }
  }

  return DEFAULT_SECTION_GUIDANCE
}
