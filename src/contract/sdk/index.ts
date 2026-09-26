import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by fireworks ai
 * .why = enables consumers to register fireworks ai atoms with genContextBrain
 *
 * .note = one atom per slug that serves under its OWN name. a slug with a
 *         ROUTED retirement is absent, because it resolves onto a successor
 *         already in this list — to include it would emit two atoms with the
 *         same slug. `getBrainAtomsByFireworksAI.unit.test.ts` holds this list
 *         to that invariant, so a future retirement cannot drift it.
 *
 * .note = `fireworks/deepseek/flash/v4` and `fireworks/glm/pro/5.2` are the two
 *         absent for that reason. both still WORK for a caller who names them
 *         — they route silently — they simply do not earn a second entry.
 *
 * .note = an AMBIGUOUS retirement is absent too — `deepseek/pro/v4`,
 *         `kimi/pro/k2.6`, `kimi/code/k2.7`. fireworks withdrew all three
 *         (measured 2026-09-26), so an atom for one could only 404. a caller who
 *         names one still gets the named error that lists its successors.
 *
 * 🔴 .note = every VERSIONLESS name is listed too, as its own atom under its
 *         own name — `fireworks/{family}/{tier}` and `…/{tier}/latest`. a
 *         consumer selects a brain from this list by `atom.slug`, so a name
 *         absent here cannot be chosen, however well `genBrainAtom` accepts it.
 *         the versionless names are the ones we recommend, so they must be the
 *         ones a consumer can pick (`rule.require.versionless-slugs-selectable`).
 *         `getBrainAtomsByFireworksAI.unit.test.ts` clamps the list to them.
 */
export const getBrainAtomsByFireworksAI = (): BrainAtom[] => {
  return [
    // deepseek
    genBrainAtom({ slug: 'fireworks/deepseek/pro' }),
    genBrainAtom({ slug: 'fireworks/deepseek/pro/latest' }),
    genBrainAtom({ slug: 'fireworks/deepseek/flash' }),
    genBrainAtom({ slug: 'fireworks/deepseek/flash/latest' }),
    genBrainAtom({ slug: 'fireworks/deepseek/flash/v4.1' }),
    // moonshot/kimi
    genBrainAtom({ slug: 'fireworks/kimi/pro' }),
    genBrainAtom({ slug: 'fireworks/kimi/pro/latest' }),
    genBrainAtom({ slug: 'fireworks/kimi/pro/k3' }),
    // z.ai/glm
    genBrainAtom({ slug: 'fireworks/glm/pro' }),
    genBrainAtom({ slug: 'fireworks/glm/pro/latest' }),
    genBrainAtom({ slug: 'fireworks/glm/pro/5.3' }),
    genBrainAtom({ slug: 'fireworks/glm/flash' }),
    genBrainAtom({ slug: 'fireworks/glm/flash/latest' }),
    genBrainAtom({ slug: 'fireworks/glm/flash/5.3' }),
    // minimax
    genBrainAtom({ slug: 'fireworks/minimax/flash' }),
    genBrainAtom({ slug: 'fireworks/minimax/flash/latest' }),
    genBrainAtom({ slug: 'fireworks/minimax/flash/m3' }),
    // gpt-oss
    genBrainAtom({ slug: 'fireworks/gpt-oss/flash' }),
    genBrainAtom({ slug: 'fireworks/gpt-oss/flash/latest' }),
    genBrainAtom({ slug: 'fireworks/gpt-oss/flash/120b' }),
    // nvidia/nemotron
    genBrainAtom({ slug: 'fireworks/nemotron/flash' }),
    genBrainAtom({ slug: 'fireworks/nemotron/flash/latest' }),
    genBrainAtom({ slug: 'fireworks/nemotron/flash/3.5' }),
  ];
};

// re-export types for consumer use
//
// .note = every name is [...noun][qualifier] — `BrainAtomSlugFireworks`, not
//         `FireworksBrainAtomSlug` (`rule.require.order.noun_adj`). so one
//         `BrainAtomSlug` prefix in an autocomplete shows a consumer every
//         form this package accepts. the supplier-first order scatters them
//         instead, under a word every symbol here already shares.
export type {
  BrainAtomSlugFireworksPinned,
  BrainSuppliesFireworks,
  CredsFireworks,
} from '../../domain.operations/atom/BrainAtom.config';
// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
// the slug vocabulary, so a consumer can name any accepted form
export type { BrainAtomSlugFireworks } from '../../domain.operations/atom/slug/AtomSlug';
export type {
  BrainAtomSlugFireworksLatest,
  BrainAtomSlugFireworksLatestBare,
} from '../../domain.operations/atom/slug/AtomSlug.latest';
// the versionless registries, so a consumer can read what each generic names today
export {
  LATEST_BY_BARE_SLUG,
  PINNED_BY_LATEST_SLUG,
} from '../../domain.operations/atom/slug/AtomSlug.latest';
export type { BrainAtomSlugFireworksLegacy } from '../../domain.operations/atom/slug/AtomSlug.legacy';
// the legacy registry, so a consumer can find the canonical name of an old slug
export { PINNED_BY_LEGACY_SLUG } from '../../domain.operations/atom/slug/AtomSlug.legacy';
// the retirement registry, so a consumer can audit their own slugs
export type {
  AtomRetirementFireworks,
  BrainAtomSlugFireworksRetired,
} from '../../domain.operations/atom/slug/AtomSlug.retired';
export { RETIREMENT_BY_ATOM_SLUG } from '../../domain.operations/atom/slug/AtomSlug.retired';
// the cast itself, so a consumer can ask which model a name reaches
export { asPinnedAtomSlug } from '../../domain.operations/atom/slug/asPinnedAtomSlug';
