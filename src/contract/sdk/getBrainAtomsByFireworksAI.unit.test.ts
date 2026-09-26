import { given, then, when } from 'test-fns';

import {
  type BrainAtomSlugFireworksPinned,
  CONFIG_BY_ATOM_SLUG,
} from '../../domain.operations/atom/BrainAtom.config';
import type { BrainAtomSlugFireworks } from '../../domain.operations/atom/slug/AtomSlug';
import {
  LATEST_BY_BARE_SLUG,
  PINNED_BY_LATEST_SLUG,
} from '../../domain.operations/atom/slug/AtomSlug.latest';
import { isRetiredAtomSlug } from '../../domain.operations/atom/slug/AtomSlug.retired';
import { asPinnedAtomSlug } from '../../domain.operations/atom/slug/asPinnedAtomSlug';
import { getBrainAtomsByFireworksAI } from './index';

/**
 * .what = every pinned slug with no retirement on record
 * .why = a ROUTED retirement resolves onto its successor, and an AMBIGUOUS one
 *        is withdrawn and can only 404 — so neither is owed an atom
 */
const getAllPinnedSlugsStandalone = (): BrainAtomSlugFireworksPinned[] =>
  (Object.keys(CONFIG_BY_ATOM_SLUG) as BrainAtomSlugFireworksPinned[]).filter(
    (slug) => !isRetiredAtomSlug(slug),
  );

/**
 * .what = every versionless name — `/latest` and bare
 * .why = these are the names we recommend, so each is owed its own atom
 */
const getAllVersionlessSlugs = (): BrainAtomSlugFireworks[] => [
  ...(Object.keys(PINNED_BY_LATEST_SLUG) as BrainAtomSlugFireworks[]),
  ...(Object.keys(LATEST_BY_BARE_SLUG) as BrainAtomSlugFireworks[]),
];

describe('getBrainAtomsByFireworksAI', () => {
  given('[case1] the published catalog', () => {
    const atoms = getBrainAtomsByFireworksAI();
    const slugs = atoms.map((atom) => atom.slug);

    when('[t0] the listed slugs are read', () => {
      then('no slug appears twice', () => {
        // .why = a routed retirement resolves onto its successor, so a list
        //        that holds both would emit two atoms under one slug.
        expect(slugs.length).toEqual(new Set(slugs).size);
      });

      then(
        'the catalog is exactly the standalone pins plus every versionless name',
        () => {
          // .why = the exact set, both directions: no silent omission, no
          //        stray entry. a pin retired onto a successor drops out; a
          //        generic added to a registry must appear here.
          const owed = [
            ...getAllPinnedSlugsStandalone(),
            ...getAllVersionlessSlugs(),
          ];
          expect([...slugs].sort()).toEqual([...owed].sort());
        },
      );

      then('the catalog is not empty', () => {
        expect(atoms.length).toBeGreaterThan(0);
      });
    });

    // 🔴 .why = the clamp for the defect that shipped in v0.2.0: every
    //           `/latest` slug was accepted by `genBrainAtom` and ABSENT from
    //           this list, and the atom it built carried the pinned slug. so
    //           `choice: 'fireworks/deepseek/flash/latest'` found no atom, and
    //           the names this package recommends could not be chosen at all.
    //           (`rule.require.versionless-slugs-selectable`)
    when('[t1] each versionless name is looked up by name', () => {
      then('every versionless name is selectable as an atom slug', () => {
        const absent = getAllVersionlessSlugs().filter(
          (slug) => !slugs.includes(slug),
        );
        expect(absent).toEqual([]);
      });

      then('the versionless set is not empty', () => {
        // .why = guards the guard — an empty set would pass the check above
        expect(getAllVersionlessSlugs().length).toBeGreaterThan(0);
      });

      then(
        'each versionless atom carries the spec of the pin it reaches',
        () => {
          // .why = an alias exports the SAME brain, never a lookalike
          for (const slug of getAllVersionlessSlugs()) {
            const atomAlias = atoms.find((atom) => atom.slug === slug);
            const atomPinned = atoms.find(
              (atom) => atom.slug === asPinnedAtomSlug({ slug }),
            );
            expect(atomPinned).toBeDefined();
            expect(atomAlias?.spec).toEqual(atomPinned?.spec);
          }
        },
      );

      then('no listed atom is a retired pin', () => {
        // .why = a retired pin either routes elsewhere or is withdrawn; an atom
        //        for it is a brain a consumer can choose and never use
        const retired = slugs.filter((slug) => isRetiredAtomSlug(slug));
        expect(retired).toEqual([]);
      });

      then('the bare deepseek flash name is listed', () => {
        // .why = the literal name from the report, stated plainly so the clamp
        //        keeps its teeth even if the registries themselves are emptied
        expect(slugs).toContain('fireworks/deepseek/flash');
        expect(slugs).toContain('fireworks/deepseek/flash/latest');
      });
    });
  });
});
