// ERE-S-001: fixed pillar weightage for the Election Readiness Engine.
// Single source of truth — backend scoring.engine.js and any frontend
// display of "why this weight" both import from here.

export const READINESS_PILLAR_WEIGHTS = Object.freeze({
  organization: 0.25,
  digital: 0.20,
  resources: 0.15,
  voter: 0.20,
  visibility: 0.20,
});

// ERE-S-004: score interpretation bands
export const READINESS_BANDS = Object.freeze([
  { max: 40, label: 'Critical' },
  { max: 60, label: 'Needs Work' },
  { max: 75, label: 'Good' },
  { max: 90, label: 'Strong' },
  { max: 100, label: 'Excellent' },
]);

export function interpretScore(score) {
  return READINESS_BANDS.find((band) => score <= band.max)?.label ?? 'Excellent';
}
