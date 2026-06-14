import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by fireworks ai
 * .why = enables consumers to register fireworks ai atoms with genContextBrain
 */
export const getBrainAtomsByFireworksAI = (): BrainAtom[] => {
  return [
    genBrainAtom({ slug: 'fireworks/qwen3.6/plus' }),
    genBrainAtom({ slug: 'fireworks/deepseek/v4-pro' }),
    genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' }),
    genBrainAtom({ slug: 'fireworks/kimi/k2.5' }),
    genBrainAtom({ slug: 'fireworks/kimi/k2.6' }),
    genBrainAtom({ slug: 'fireworks/glm/5.1' }),
    genBrainAtom({ slug: 'fireworks/minimax/2.5' }),
    genBrainAtom({ slug: 'fireworks/minimax/2.7' }),
    genBrainAtom({ slug: 'fireworks/gpt-oss/120b' }),
    genBrainAtom({ slug: 'fireworks/gpt-oss/20b' }),
  ];
};

// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

// re-export types for consumer use
export type {
  BrainSuppliesFireworks,
  FireworksCreds,
  FireworksBrainAtomSlug,
} from '../../domain.operations/atom/BrainAtom.config';
