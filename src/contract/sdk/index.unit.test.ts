import { BrainAtom } from 'rhachet';
import { getError, given, then, when } from 'test-fns';

import { CONFIG_BY_ATOM_SLUG } from '../../domain.operations/atom/BrainAtom.config';
import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
import { getBrainAtomsByFireworksAI } from './index';

describe('rhachet-brains-fireworksai.unit', () => {
  given('[case1] getBrainAtomsByFireworksAI', () => {
    when('[t0] called', () => {
      then('returns array with 11 atoms', () => {
        const atoms = getBrainAtomsByFireworksAI();
        expect(atoms).toHaveLength(11);
      });

      then('returns BrainAtom instances', () => {
        const atoms = getBrainAtomsByFireworksAI();
        for (const atom of atoms) {
          expect(atom).toBeInstanceOf(BrainAtom);
        }
      });

      then('includes fireworks/deepseek/v4-flash', () => {
        const atoms = getBrainAtomsByFireworksAI();
        const slugs = atoms.map((a: BrainAtom) => a.slug);
        expect(slugs).toContain('fireworks/deepseek/v4-flash');
      });

      then('slugs match snapshot', () => {
        const atoms = getBrainAtomsByFireworksAI();
        const slugs = atoms.map((a: BrainAtom) => a.slug);
        expect(slugs).toHaveLength(11);
        expect(slugs[0]).toContain('fireworks/');
        expect(slugs).toMatchSnapshot();
      });

      then('specs match snapshot', () => {
        const atoms = getBrainAtomsByFireworksAI();
        const specs = atoms.map((a: BrainAtom) => ({
          slug: a.slug,
          spec: a.spec,
        }));
        expect(specs).toHaveLength(11);
        expect(specs[0]).toHaveProperty('spec');
        expect(specs[0]).toHaveProperty('slug');
        expect(specs).toMatchSnapshot();
      });
    });
  });

  given('[case1b] CONFIG_BY_ATOM_SLUG model ids', () => {
    // .why = the account-qualified model id is closure-captured by genBrainAtom,
    //        so no BrainAtom snapshot can observe it. without this snapshot a
    //        retired or mistyped id reaches consumers unseen, and surfaces only
    //        as a 404 at call time in whichever repo takes the default brain.
    when('[t0] read from config', () => {
      then('model id by slug matches snapshot', () => {
        const modelBySlug = Object.fromEntries(
          Object.entries(CONFIG_BY_ATOM_SLUG).map(([slug, config]) => [
            slug,
            config.model,
          ]),
        );
        expect(modelBySlug).toMatchSnapshot();
      });

      then('every model id is account-qualified', () => {
        for (const config of Object.values(CONFIG_BY_ATOM_SLUG)) {
          expect(config.model).toMatch(/^accounts\/[\w-]+\/models\/[\w.-]+$/);
        }
      });

      // .why = clamps the regression where v4-flash pointed at the retired
      //        preview id and 404'd for every consumer on the default brain.
      //        stated as a plain assertion, not a snapshot, so it keeps its
      //        teeth even where the runner passes --updateSnapshot.
      then(
        'v4-flash points at the -0731 release id, not the retired preview',
        () => {
          expect(
            CONFIG_BY_ATOM_SLUG['fireworks/deepseek/v4-flash'].model,
          ).toEqual('accounts/fireworks/models/deepseek-v4-flash-0731');
        },
      );
    });
  });

  given('[case2] genBrainAtom factory', () => {
    when('[t0] called with fireworks/deepseek/v4-flash slug', () => {
      const atom = genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' });

      then('returns BrainAtom instance', () => {
        expect(atom).toBeInstanceOf(BrainAtom);
      });

      then('has correct slug', () => {
        expect(atom.slug).toEqual('fireworks/deepseek/v4-flash');
      });

      then('has correct repo', () => {
        expect(atom.repo).toEqual('fireworks');
      });

      then('spec matches snapshot', () => {
        expect(atom.spec).toBeDefined();
        expect(atom.spec).toMatchSnapshot();
      });
    });

    when('[t1] called with invalid slug', () => {
      then('throws BadRequestError with helpful message', async () => {
        const error = await getError(() =>
          // @ts-expect-error - invalid slug test case
          genBrainAtom({ slug: 'invalid/slug' }),
        );
        expect(error.message).toContain('invalid fireworks brain atom slug');
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
