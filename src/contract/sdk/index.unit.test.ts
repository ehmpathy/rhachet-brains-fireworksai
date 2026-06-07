import { BrainAtom } from 'rhachet';
import { getError, given, then, when } from 'test-fns';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
import { getBrainAtomsByFireworksAI } from './index';

describe('rhachet-brains-fireworksai.unit', () => {
  given('[case1] getBrainAtomsByFireworksAI', () => {
    when('[t0] called', () => {
      then('returns array with 10 atoms', () => {
        const atoms = getBrainAtomsByFireworksAI();
        expect(atoms).toHaveLength(10);
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
        expect(slugs).toHaveLength(10);
        expect(slugs[0]).toContain('fireworks/');
        expect(slugs).toMatchSnapshot();
      });

      then('specs match snapshot', () => {
        const atoms = getBrainAtomsByFireworksAI();
        const specs = atoms.map((a: BrainAtom) => ({
          slug: a.slug,
          spec: a.spec,
        }));
        expect(specs).toHaveLength(10);
        expect(specs[0]).toHaveProperty('spec');
        expect(specs[0]).toHaveProperty('slug');
        expect(specs).toMatchSnapshot();
      });
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
