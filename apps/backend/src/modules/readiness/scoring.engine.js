import { READINESS_PILLAR_WEIGHTS, interpretScore } from '@election-os/shared/scoring-weights';

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/**
 * ERE-S-002: each pillar scored 0-100 from input parameters (+ constituency
 * context when available). This is the deterministic baseline the FRD
 * requires — ERE-S-005's "AI enhances scoring" happens as a *recommendations*
 * layer on top (see readiness.service.js), not by replacing this math, so
 * the score itself stays reproducible and auditable rather than depending
 * on a non-deterministic model call.
 */
export function computePillarScores(input, constituency) {
  // Organization: volunteer count relative to a reasonable ground-campaign
  // size (500 volunteers = fully staffed per VMS-O-008's own cap), plus a
  // past-victory bonus for existing organizational infrastructure.
  const organization = clamp(
    (input.volunteerCount / 500) * 80 + (input.pastVictory ? 20 : 0)
  );

  // Digital Presence: directly from the candidate's self-reported 1-10 scale.
  const digital = clamp(input.socialMediaScore * 10);

  // Campaign Resources: budget relative to a typical assembly-seat budget
  // benchmark (₹50L) — logarithmic so extra crores past that don't dominate.
  const budgetBenchmark = 5_000_000; // ₹50 lakh
  const resources = clamp(
    input.budget <= 0 ? 0 : 50 + 50 * Math.min(1, Math.log10(input.budget / budgetBenchmark + 1))
  );

  // Voter Intelligence: higher when we actually have constituency data to
  // work with (CI module) — an unknown constituency means the candidate is
  // flying blind regardless of how good their other inputs are.
  const voter = constituency ? clamp(60 + constituency.literacyRate / 5) : 40;

  // Candidate Visibility: blends digital presence, past-victory name
  // recognition, and having a declared party (vs. a harder independent run).
  const visibility = clamp(
    digital * 0.5 + (input.pastVictory ? 30 : 0) + (input.party && input.party !== 'Independent' ? 20 : 5)
  );

  return { organization, digital, resources, voter, visibility };
}

/** ERE-S-003: Overall Score = Σ(Pillar Score × Weight), rounded. */
export function computeOverallScore(pillarScores) {
  const weighted = Object.entries(READINESS_PILLAR_WEIGHTS).reduce(
    (sum, [pillar, weight]) => sum + pillarScores[pillar] * weight,
    0
  );
  return Math.round(weighted);
}

/** ERE-O-002: top 2 pillars as strengths, bottom 2 as weaknesses (max 5 each per spec, we surface what's meaningful). */
export function deriveStrengthsWeaknesses(pillarScores) {
  const PILLAR_LABELS = {
    organization: 'Organization',
    digital: 'Digital Presence',
    resources: 'Campaign Resources',
    voter: 'Voter Intelligence',
    visibility: 'Candidate Visibility',
  };

  const sorted = Object.entries(pillarScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2).map(([key, score]) => `${PILLAR_LABELS[key]} is strong (${Math.round(score)}/100)`);
  const weaknesses = sorted.slice(-2).map(([key, score]) => `${PILLAR_LABELS[key]} needs improvement (${Math.round(score)}/100)`);

  return { strengths, weaknesses };
}

export { interpretScore };
