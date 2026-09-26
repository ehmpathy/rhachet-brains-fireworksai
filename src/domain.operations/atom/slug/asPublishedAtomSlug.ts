import type { BrainAtomSlugFireworksPinned } from '../BrainAtom.config';
import type { BrainAtomSlugFireworks } from './AtomSlug';
import {
  type BrainAtomSlugFireworksLatest,
  type BrainAtomSlugFireworksLatestBare,
  isLatestAtomSlug,
  isLatestBareAtomSlug,
} from './AtomSlug.latest';
import { asPinnedAtomSlug } from './asPinnedAtomSlug';

/**
 * .what = the name a built atom carries as its `slug`
 * .why = a registry selects an atom by `atom.slug`. so a versionless name must
 *        survive onto the atom, or no consumer can choose it by that name
 *
 * .the split:
 *   - VERSIONLESS (`/latest`, bare) — kept as named. it is a TRUE name for the
 *     model it reaches today, and the name a consumer chose on purpose
 *   - all else — the pinned slug it resolves to. a retired name no longer
 *     serves, so an atom that claimed it would lie in every metric and log
 *
 * .example
 *   asPublishedAtomSlug({ slug: 'fireworks/deepseek/flash' })        // 'fireworks/deepseek/flash'
 *   asPublishedAtomSlug({ slug: 'fireworks/deepseek/flash/latest' }) // 'fireworks/deepseek/flash/latest'
 *   asPublishedAtomSlug({ slug: 'fireworks/deepseek/flash/v4' })     // 'fireworks/deepseek/flash/v4.1'
 */
export const asPublishedAtomSlug = (input: {
  slug: BrainAtomSlugFireworks;
}):
  | BrainAtomSlugFireworksPinned
  | BrainAtomSlugFireworksLatest
  | BrainAtomSlugFireworksLatestBare => {
  // a versionless name is published as named
  if (isLatestAtomSlug(input.slug)) return input.slug;
  if (isLatestBareAtomSlug(input.slug)) return input.slug;

  // every other name is published as the pinned slug that serves it
  return asPinnedAtomSlug({ slug: input.slug });
};
