// ── Scoring Logic ──
// Each judge submission can have MULTIPLE entries per category.
// Formula per entry: hits × base × multiplier
// All entries sum up to the submission total, which ADDS to the team's cumulative score.

export const DAMAGE_BASE = 10;
export const AGGRESSION_BASE = 5;
export const CONTROL_BASE = 5;

export const DAMAGE_MULTIPLIERS = {
  Cosmetic: 1.0,
  Functional: 2.0,
  Critical: 3.0,
};

export const AGGRESSION_MULTIPLIERS = {
  Reactive: 1.0,
  Active: 1.5,
  Relentless: 2.0,
};

export const CONTROL_MULTIPLIERS = {
  Evasive: 1.0,
  Tactical: 1.5,
  Dominant: 2.0,
};

// Single entry calculation
function normalizeHits(hits) {
  const n = Number(hits);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

export function calcDamageEntry(severity, hits = 1) {
  return normalizeHits(hits) * DAMAGE_BASE * (DAMAGE_MULTIPLIERS[severity] ?? 1);
}

export function calcAggressionEntry(factor, hits = 1) {
  return normalizeHits(hits) * AGGRESSION_BASE * (AGGRESSION_MULTIPLIERS[factor] ?? 1);
}

export function calcControlEntry(factor, hits = 1) {
  return normalizeHits(hits) * CONTROL_BASE * (CONTROL_MULTIPLIERS[factor] ?? 1);
}

// Calculate total from arrays of entries
// damageEntries: [{ severity, hits }, ...]
// aggrEntries:   [{ factor, hits }, ...]
// ctrlEntries:   [{ factor, hits }, ...]
export function calcSubmissionTotal(damageEntries = [], aggrEntries = [], ctrlEntries = []) {
  const dmg = damageEntries.reduce((sum, e) => sum + calcDamageEntry(e.severity, e.hits), 0);
  const aggr = aggrEntries.reduce((sum, e) => sum + calcAggressionEntry(e.factor, e.hits), 0);
  const ctrl = ctrlEntries.reduce((sum, e) => sum + calcControlEntry(e.factor, e.hits), 0);
  return { dmg, aggr, ctrl, total: dmg + aggr + ctrl };
}
