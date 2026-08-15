import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by fireworks ai
 * .why = enables consumers to register fireworks ai atoms with genContextBrain
 */
export const getBrainAtomsByFireworksAI = (): BrainAtom[] => {
  return [
    // deepseek
    genBrainAtom({ slug: 'fireworks/deepseek/v4-pro' }),
    genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' }),
    // moonshot/kimi
    genBrainAtom({ slug: 'fireworks/kimi/k2.7-code' }),
    genBrainAtom({ slug: 'fireworks/kimi/k2.6' }),
    // alibaba/qwen
    genBrainAtom({ slug: 'fireworks/qwen/3.7-plus' }),
    // z.ai/glm
    genBrainAtom({ slug: 'fireworks/glm/5.2' }),
    // minimax
    genBrainAtom({ slug: 'fireworks/minimax/m3' }),
    genBrainAtom({ slug: 'fireworks/minimax/2.7' }),
    // gpt-oss
    genBrainAtom({ slug: 'fireworks/gpt-oss/120b' }),
    genBrainAtom({ slug: 'fireworks/gpt-oss/20b' }),
  ];
};

// re-export types for consumer use
export type {
  BrainSuppliesFireworks,
  FireworksBrainAtomSlug,
  FireworksCreds,
} from '../../domain.operations/atom/BrainAtom.config';
// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
