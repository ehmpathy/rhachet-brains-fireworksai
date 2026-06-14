import { asIsoPrice, dividePrice } from 'iso-price';
import { BrainSpec, type BrainSuppliesCreds } from 'rhachet/brains';

/**
 * .what = atom config type
 * .why = shared type for model configs
 */
export type BrainAtomConfig = {
  model: string;
  description: string;
  spec: BrainSpec;
};

/**
 * .what = credential keys required by fireworks ai
 * .why = enables type-safe credential lookup via rhachet's BrainSuppliesCreds
 */
export type FireworksCreds = { FIREWORKS_API_KEY: string };

/**
 * .what = supplies for fireworks brain supplier
 * .why = enables credential injection via keyrack shorthand or explicit getter
 *
 * .patterns:
 *   - keyrack shorthand: { keyrack: { owner: 'ehmpath', env: 'prod' } }
 *   - explicit getter: () => Promise<{ FIREWORKS_API_KEY: string }>
 */
export type BrainSuppliesFireworks = {
  creds: BrainSuppliesCreds<FireworksCreds>;
};

/**
 * .what = supported fireworks ai atom slugs
 * .why = enables type-safe slug specification with model variants
 *
 * .note = only includes models available on fireworks ai serverless
 *         see: https://docs.fireworks.ai/serverless/rates
 */
export type FireworksBrainAtomSlug =
  | 'fireworks/qwen3.6/plus'
  | 'fireworks/deepseek/v4-pro'
  | 'fireworks/deepseek/v4-flash'
  | 'fireworks/kimi/k2.5'
  | 'fireworks/kimi/k2.6'
  | 'fireworks/glm/5.1'
  | 'fireworks/minimax/2.5'
  | 'fireworks/minimax/2.7'
  | 'fireworks/gpt-oss/120b'
  | 'fireworks/gpt-oss/20b';

/**
 * .what = model configuration by slug
 * .why = maps slugs to api model names, descriptions, and specs
 *
 * .sources:
 *   - rates: https://fireworks.ai/rates
 *   - models: https://docs.fireworks.ai/serverless/rates
 *   - api docs: https://docs.fireworks.ai/reference/chat-completions-1
 */
export const CONFIG_BY_ATOM_SLUG: Record<
  FireworksBrainAtomSlug,
  BrainAtomConfig
> = {
  /**
   * qwen 3.6 plus
   * .sources:
   *   - rates: $0.50/1M input, $3.00/1M output
   *   - context: 131K
   */
  'fireworks/qwen3.6/plus': {
    model: 'accounts/fireworks/models/qwen3p6-plus',
    description: 'qwen3.6-plus - general purpose (131K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 120, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.50', by: 1_000_000 }), // $0.50/1M tokens
          output: dividePrice({ of: '$3.00', by: 1_000_000 }), // $3.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 131_000 } }, // 131K context
        grades: {},
        cutoff: '2025-07-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * deepseek-v4-pro
   * .sources:
   *   - rates: $1.74/1M input, $3.48/1M output
   *   - context: 1M
   *   - swe-bench: 79.4% verified
   *   - mmlu-pro: 87.5%
   *   - gpqa-diamond: 90.1%
   */
  'fireworks/deepseek/v4-pro': {
    model: 'accounts/fireworks/models/deepseek-v4-pro',
    description: 'deepseek-v4-pro - frontier open-source (1M)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1.2 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.74', by: 1_000_000 }), // $1.74/1M tokens
          output: dividePrice({ of: '$3.48', by: 1_000_000 }), // $3.48/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } }, // 1M context
        grades: { swe: 79.4, mmlu: 87.5, gpqa: 90.1 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * deepseek-v4-flash
   * .sources:
   *   - rates: $0.14/1M input, $0.28/1M output
   *   - context: 1M
   *   - swe-bench: 78.6% verified
   *   - gpqa-diamond: ~88%
   */
  'fireworks/deepseek/v4-flash': {
    model: 'accounts/fireworks/models/deepseek-v4-flash',
    description: 'deepseek-v4-flash - cheapfast frontier (1M)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 150, per: { seconds: 1 } },
          latency: { seconds: 0.4 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.14', by: 1_000_000 }), // $0.14/1M tokens
          output: dividePrice({ of: '$0.28', by: 1_000_000 }), // $0.28/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } }, // 1M context
        grades: { swe: 78.6, gpqa: 88 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2.5
   * .sources:
   *   - rates: $0.60/1M input, $3.00/1M output
   *   - context: 128K
   *   - swe-bench: 76.8% verified
   */
  'fireworks/kimi/k2.5': {
    model: 'accounts/fireworks/models/kimi-k2p5',
    description: 'kimi-k2.5 - strong swe-bench (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 100, per: { seconds: 1 } },
          latency: { seconds: 0.8 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.60', by: 1_000_000 }), // $0.60/1M tokens
          output: dividePrice({ of: '$3.00', by: 1_000_000 }), // $3.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 76.8 }, // 76.8% swe-bench verified
        cutoff: '2025-07-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2.6
   * .sources:
   *   - rates: $0.95/1M input, $4.00/1M output
   *   - context: 128K
   *   - swe-bench: 80.2% verified
   */
  'fireworks/kimi/k2.6': {
    model: 'accounts/fireworks/models/kimi-k2p6',
    description: 'kimi-k2.6 - frontier swe-bench (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.95', by: 1_000_000 }), // $0.95/1M tokens
          output: dividePrice({ of: '$4.00', by: 1_000_000 }), // $4.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 80.2 }, // 80.2% swe-bench verified
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * glm-5.1
   * .sources:
   *   - rates: $1.40/1M input, $4.40/1M output
   *   - context: 128K
   *   - swe-bench: 77.8% verified
   */
  'fireworks/glm/5.1': {
    model: 'accounts/fireworks/models/glm-5p1',
    description: 'glm-5.1 - frontier general (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.40', by: 1_000_000 }), // $1.40/1M tokens
          output: dividePrice({ of: '$4.40', by: 1_000_000 }), // $4.40/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 77.8 }, // 77.8% swe-bench verified
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * minimax-2.5
   * .sources:
   *   - rates: $0.30/1M input, $1.20/1M output
   *   - context: 128K
   *   - swe-bench: 80.2% verified
   */
  'fireworks/minimax/2.5': {
    model: 'accounts/fireworks/models/minimax-m2p5',
    description: 'minimax-2.5 - cheapfast high swe-bench (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 140, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.30', by: 1_000_000 }), // $0.30/1M tokens
          output: dividePrice({ of: '$1.20', by: 1_000_000 }), // $1.20/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 80.2 }, // 80.2% swe-bench verified
        cutoff: '2026-02-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * minimax-2.7
   * .sources:
   *   - rates: $0.30/1M input, $1.20/1M output
   *   - context: 128K
   *   - swe-bench: 80.5% verified
   */
  'fireworks/minimax/2.7': {
    model: 'accounts/fireworks/models/minimax-m2p7',
    description: 'minimax-2.7 - cheapfast highest swe-bench (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 140, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.30', by: 1_000_000 }), // $0.30/1M tokens
          output: dividePrice({ of: '$1.20', by: 1_000_000 }), // $1.20/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 80.5 }, // 80.5% swe-bench verified
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * gpt-oss-120b
   * .sources:
   *   - rates: $0.15/1M input, $0.60/1M output
   *   - context: 128K
   */
  'fireworks/gpt-oss/120b': {
    model: 'accounts/fireworks/models/gpt-oss-120b',
    description: 'gpt-oss-120b - cheapfast general (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 120, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.15', by: 1_000_000 }), // $0.15/1M tokens
          output: dividePrice({ of: '$0.60', by: 1_000_000 }), // $0.60/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * gpt-oss-20b
   * .sources:
   *   - rates: $0.07/1M input, $0.30/1M output
   *   - context: 128K
   */
  'fireworks/gpt-oss/20b': {
    model: 'accounts/fireworks/models/gpt-oss-20b',
    description: 'gpt-oss-20b - cheapest general (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 180, per: { seconds: 1 } },
          latency: { seconds: 0.3 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.07', by: 1_000_000 }), // $0.07/1M tokens
          output: dividePrice({ of: '$0.30', by: 1_000_000 }), // $0.30/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
};
