import type { BrainAtomSlugFireworksPinned } from '../BrainAtom.config';
import type { BrainAtomSlugFireworksLatest } from './AtomSlug.latest';
import type { BrainAtomSlugFireworksLegacy } from './AtomSlug.legacy';

/**
 * .what = every slug name `genBrainAtom` accepts
 * .why = a caller names one of three things, and all three reach a live model
 *
 * .the three:
 *   1. PINNED  — `fireworks/{family}/{tier}/{version}`, exact weights
 *   2. LATEST  — `fireworks/{family}/{tier}/latest`, we own the version churn
 *   3. LEGACY  — a name we published before the tier segment; kept forever
 *
 * ⇒ `asPinnedAtomSlug` casts any of them onto the ONE pinned slug that serves.
 *
 * .note = this union only ever GROWS. a name accepted in any prior release is
 *         accepted still, which is the whole promise of the package.
 */
export type BrainAtomSlugFireworks =
  | BrainAtomSlugFireworksPinned
  | BrainAtomSlugFireworksLatest
  | BrainAtomSlugFireworksLegacy;
