/**
 * Labels that should be excluded from all API responses (sample images,
 * search results, etc.). Matching is case-insensitive.
 */
const BLOCKED_LABELS: string[] = [
  // Convicted / charged with serious crimes
  'Harvey Weinstein',
  'Kevin Spacey',
  'Bill Cosby',
  'Danny Masterson',
  'Allison Mack',
  'Roman Polanski',
  'Armie Hammer',
  'Jonathan Majors',
  'Ryan Grantham',
  // Serious allegations / widely disgraced
  'James Franco',
  'Ezra Miller',
  'Ansel Elgort',
  'Chris Noth',
  'Bryan Singer',
  'Marilyn Manson',
  // Historical figures inappropriate for a face-matching demo
  'Adolf Hitler',
];

const BLOCKED_LABELS_SET = new Set(
  BLOCKED_LABELS.map((l) => l.toLowerCase()),
);

/** Returns `true` if the given label should be filtered out of results. */
function isBlocked(label?: string): boolean {
  if (!label) {
    return false;
  }
  return BLOCKED_LABELS_SET.has(label.toLowerCase());
}

export { BLOCKED_LABELS, isBlocked };
