import { given, then, when } from 'test-fns';

import {
  type BrainAtomSlugFireworksPinned,
  CONFIG_BY_ATOM_SLUG,
} from '../../domain.operations/atom/BrainAtom.config';
import { asPinnedAtomSlug } from '../../domain.operations/atom/slug/asPinnedAtomSlug';
import { getBrainAtomsByFireworksAI } from './index';

describe('getBrainAtomsByFireworksAI', () => {
  given('[case1] the published catalog', () => {
    const atoms = getBrainAtomsByFireworksAI();

    when('[t0] the listed slugs are read', () => {
      then('no slug appears twice', () => {
        // .why = a routed retirement resolves onto its successor, so a list
        //        that holds both would emit two atoms under one slug. this is
        //        the clamp on that exact defect — it goes red if a future
        //        retirement is added without its old slug removed from the
        //        list.
        const slugs = atoms.map((atom) => atom.slug);
        expect(slugs.length).toEqual(new Set(slugs).size);
      });

      then('every listed atom resolves to its own slug', () => {
        // .why = a slug that resolves elsewhere does not belong in the
        //        catalog, because the atom it produces carries a different
        //        name than the one asked for.
        for (const atom of atoms) {
          expect(
            asPinnedAtomSlug({
              slug: atom.slug as BrainAtomSlugFireworksPinned,
            }),
          ).toEqual(atom.slug);
        }
      });

      then('the catalog covers every configured slug that stands alone', () => {
        // .why = the complement of the check above. together they pin the
        //        list to exactly the set of slugs that serve under their own
        //        name — no silent omission, no duplicate.
        const owed = (
          Object.keys(CONFIG_BY_ATOM_SLUG) as BrainAtomSlugFireworksPinned[]
        ).filter((slug) => asPinnedAtomSlug({ slug }) === slug);
        expect(atoms.map((atom) => atom.slug).sort()).toEqual(owed.sort());
      });

      then('the catalog is not empty', () => {
        expect(atoms.length).toBeGreaterThan(0);
      });
    });
  });
});
