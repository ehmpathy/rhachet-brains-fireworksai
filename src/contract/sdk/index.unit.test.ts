import { BrainAtom } from 'rhachet';
import { given, then, when } from 'test-fns';

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

      then('includes fireworks/qwen3/coder-next', () => {
        const atoms = getBrainAtomsByFireworksAI();
        const slugs = atoms.map((a: BrainAtom) => a.slug);
        expect(slugs).toContain('fireworks/qwen3/coder-next');
      });
    });
  });

  given('[case2] genBrainAtom factory', () => {
    when('[t0] called with fireworks/qwen3/coder-next slug', () => {
      const atom = genBrainAtom({ slug: 'fireworks/qwen3/coder-next' });

      then('returns BrainAtom instance', () => {
        expect(atom).toBeInstanceOf(BrainAtom);
      });

      then('has correct slug', () => {
        expect(atom.slug).toEqual('fireworks/qwen3/coder-next');
      });

      then('has correct repo', () => {
        expect(atom.repo).toEqual('fireworks');
      });
    });
  });
});
