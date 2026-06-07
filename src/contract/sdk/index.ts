import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by fireworks ai
 * .why = enables consumers to register fireworks ai atoms with genContextBrain
 */
export const getBrainAtomsByFireworksAI = (): BrainAtom[] => {
  return [
    genBrainAtom({ slug: 'fireworks/qwen3/coder-next' }),
    genBrainAtom({ slug: 'fireworks/qwen3/coder-480b' }),
    genBrainAtom({ slug: 'fireworks/qwen3/235b' }),
    genBrainAtom({ slug: 'fireworks/deepseek/v3.1' }),
    genBrainAtom({ slug: 'fireworks/deepseek/r1' }),
    genBrainAtom({ slug: 'fireworks/kimi/k2' }),
    genBrainAtom({ slug: 'fireworks/kimi/k2.5' }),
    genBrainAtom({ slug: 'fireworks/llama4/maverick' }),
    genBrainAtom({ slug: 'fireworks/llama3.3/70b' }),
    genBrainAtom({ slug: 'fireworks/glm/4.7' }),
  ];
};

// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
