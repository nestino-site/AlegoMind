import { MatchingPreference, Professional, SessionFormat } from '@prisma/client';

// ─── Config ───────────────────────────────────────────────────────────────────

const WEIGHTS = {
  specialization: 0.40,
  sessionFormat: 0.30,
  price: 0.20,
  rating: 0.10,
} as const;

/** RON cap used to normalise price: 0 RON → score 1.0, cap+ → score 0.0 */
const PRICE_CAP_RON = 500;

// ─── Bilingual keyword map ────────────────────────────────────────────────────
// Maps English seeker topic keys → keywords that may appear in Romanian/English
// professional specializations. Case-insensitive partial match is used.

export const TOPIC_KEYWORDS: Record<string, string[]> = {
  anxiety:          ['anxiet', 'panică', 'panic', 'fobic', 'phobia', 'stres', 'worry'],
  depression:       ['depres', 'tristețe', 'melancol', 'sadness', 'mood'],
  relationships:    ['relați', 'relation', 'comunicare', 'communication', 'partener', 'partner', 'cuplu', 'couple'],
  career:           ['carieră', 'career', 'profesion', 'profession', 'lidersh', 'leadership', 'job', 'muncă', 'work'],
  trauma:           ['traumă', 'trauma', 'ptsd', 'abuz', 'abuse', 'violence', 'violenț'],
  burnout:          ['burnout', 'epuizare', 'exhaustion', 'oboseal'],
  grief:            ['doliu', 'grief', 'pierdere', 'loss', 'deces', 'death', 'moarte'],
  stress:           ['stres', 'stress', 'tensiune', 'tension', 'anxiet'],
  self_esteem:      ['stimă', 'self-esteem', 'încredere', 'confidence', 'identit', 'self-worth'],
  life_transitions: ['tranziție', 'transition', 'schimbare', 'change', 'adaptare', 'adaptation'],
  addiction:        ['dependență', 'addiction', 'alcool', 'alcohol', 'substanț', 'substance'],
  family:           ['famil', 'family', 'părinți', 'parents', 'copii', 'children'],
  parenting:        ['parentaj', 'parenting', 'copii', 'children', 'mamă', 'tată', 'mother', 'father'],
  identity:         ['identit', 'identity', 'sine', 'self', 'gen', 'gender', 'sexualit'],
  sleep:            ['somn', 'sleep', 'insomni', 'insomnia'],
  motivation:       ['motivați', 'motivation', 'scop', 'purpose', 'obiective', 'goals', 'procrastin'],
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeMatchScore(
  professional: Professional,
  prefs: MatchingPreference,
): number {
  return (
    WEIGHTS.specialization * specializationScore(professional.specializations, prefs.topics) +
    WEIGHTS.sessionFormat * formatScore(professional.sessionFormats, prefs.communicationFormats) +
    WEIGHTS.price * priceScore(professional.pricePerSession) +
    WEIGHTS.rating * ratingScore(professional.rating)
  );
}

function specializationScore(profSpecs: string[], seekerTopics: string[]): number {
  if (seekerTopics.length === 0) return 1.0;

  const matched = seekerTopics.filter(topic => {
    const keywords = TOPIC_KEYWORDS[topic] ?? [topic];
    return profSpecs.some(spec =>
      keywords.some(kw => spec.toLowerCase().includes(kw.toLowerCase())),
    );
  });

  return matched.length / seekerTopics.length;
}

function formatScore(profFormats: SessionFormat[], seekerFormats: SessionFormat[]): number {
  if (seekerFormats.length === 0) return 1.0;

  const matched = seekerFormats.filter(f => profFormats.includes(f));
  return matched.length / seekerFormats.length;
}

function priceScore(pricePerSession: number): number {
  return Math.max(0, (PRICE_CAP_RON - pricePerSession) / PRICE_CAP_RON);
}

function ratingScore(rating: number): number {
  return rating / 5;
}

// ─── Gender pre-filter ────────────────────────────────────────────────────────

export function matchesGenderPreference(
  professional: Professional,
  providerGender: string | null,
): boolean {
  if (!providerGender || providerGender === 'any') return true;
  if (!professional.gender) return true; // professional hasn't set gender — don't exclude them
  return professional.gender === providerGender;
}
