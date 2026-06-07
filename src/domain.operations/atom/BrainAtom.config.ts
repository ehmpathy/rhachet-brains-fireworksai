import { asIsoPrice, dividePrice } from 'iso-price';
import { BrainSpec } from 'rhachet';

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
 * .what = supported fireworks ai atom slugs
 * .why = enables type-safe slug specification with model variants
 */
export type FireworksBrainAtomSlug =
  | 'fireworks/qwen3/coder-next'
  | 'fireworks/qwen3/coder-480b'
  | 'fireworks/qwen3/235b'
  | 'fireworks/deepseek/v3.1'
  | 'fireworks/deepseek/r1'
  | 'fireworks/kimi/k2'
  | 'fireworks/kimi/k2.5'
  | 'fireworks/llama4/maverick'
  | 'fireworks/llama3.3/70b'
  | 'fireworks/glm/4.7';

/**
 * .what = model configuration by slug
 * .why = maps slugs to api model names, descriptions, and specs
 *
 * .sources:
 *   - rates: https://fireworks.ai/pricing
 *   - models: https://docs.fireworks.ai/docs/serverless-models
 *   - api docs: https://docs.fireworks.ai/reference/chat-completions-1
 */
export const CONFIG_BY_ATOM_SLUG: Record<
  FireworksBrainAtomSlug,
  BrainAtomConfig
> = {
  /**
   * qwen3-coder-next
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.50/1M input, $1.20/1M output)
   *   - context: 262K
   *   - swe-bench: 74.2% verified
   *   - architecture: 80B total, 3B active (moe)
   */
  'fireworks/qwen3/coder-next': {
    model: 'Qwen/Qwen3-Coder-Next-FP8',
    description: 'qwen3-coder-next - best cost/performance for code (262K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 150, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'), // no cache rate on fireworks ai
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.50', by: 1_000_000 }), // $0.50/1M tokens
          output: dividePrice({ of: '$1.20', by: 1_000_000 }), // $1.20/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: { swe: 74.2 }, // 74.2% swe-bench verified
        cutoff: '2025-06-01',
        domain: 'SOFTWARE',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * qwen3-coder-480b
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($2.00/1M input, $2.00/1M output)
   *   - context: 262K
   *   - swe-bench: 69.6% verified
   *   - architecture: 480B total, 35B active (moe)
   */
  'fireworks/qwen3/coder-480b': {
    model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
    description: 'qwen3-coder-480b - large code model (262K)',
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
          input: dividePrice({ of: '$2.00', by: 1_000_000 }), // $2.00/1M tokens
          output: dividePrice({ of: '$2.00', by: 1_000_000 }), // $2.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: { swe: 69.6 }, // 69.6% swe-bench verified
        cutoff: '2025-06-01',
        domain: 'SOFTWARE',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * qwen3-235b
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.20/1M input, $0.60/1M output)
   *   - context: 131K
   *   - architecture: 235B total, 22B active (moe)
   */
  'fireworks/qwen3/235b': {
    model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
    description: 'qwen3-235b - general purpose (131K)',
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
          input: dividePrice({ of: '$0.20', by: 1_000_000 }), // $0.20/1M tokens
          output: dividePrice({ of: '$0.60', by: 1_000_000 }), // $0.60/1M tokens
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
   * deepseek-v3.1
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($1.25/1M input, $1.25/1M output)
   *   - context: 128K
   *   - architecture: 671B total, 37B active (moe)
   */
  'fireworks/deepseek/v3.1': {
    model: 'deepseek-ai/DeepSeek-V3.1',
    description: 'deepseek-v3.1 - frontier open-source (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 100, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.25', by: 1_000_000 }), // $1.25/1M tokens
          output: dividePrice({ of: '$1.25', by: 1_000_000 }), // $1.25/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2025-03-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * deepseek-r1
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($3.00/1M input, $7.00/1M output)
   *   - context: 128K
   *   - architecture: 671B total, 37B active (moe), chain-of-thought
   */
  'fireworks/deepseek/r1': {
    model: 'deepseek-ai/DeepSeek-R1',
    description: 'deepseek-r1 - chain-of-thought (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 60, per: { seconds: 1 } },
          latency: { seconds: 1.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$3.00', by: 1_000_000 }), // $3.00/1M tokens
          output: dividePrice({ of: '$7.00', by: 1_000_000 }), // $7.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2025-03-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($1.00/1M input, $3.00/1M output)
   *   - context: 128K
   *   - architecture: 1T total (moe)
   */
  'fireworks/kimi/k2': {
    model: 'moonshotai/Kimi-K2-Instruct',
    description: 'kimi-k2 - large general purpose (128K)',
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
          input: dividePrice({ of: '$1.00', by: 1_000_000 }), // $1.00/1M tokens
          output: dividePrice({ of: '$3.00', by: 1_000_000 }), // $3.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2025-06-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2.5
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.50/1M input, $2.80/1M output)
   *   - context: 128K
   *   - swe-bench: 76.8% verified
   */
  'fireworks/kimi/k2.5': {
    model: 'moonshotai/Kimi-K2.5',
    description: 'kimi-k2.5 - best swe-bench on fireworks ai (128K)',
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
          input: dividePrice({ of: '$0.50', by: 1_000_000 }), // $0.50/1M tokens
          output: dividePrice({ of: '$2.80', by: 1_000_000 }), // $2.80/1M tokens
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
   * llama-4-maverick
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.27/1M input, $0.85/1M output)
   *   - context: 1M
   *   - architecture: 17B active, 128 experts (moe)
   */
  'fireworks/llama4/maverick': {
    model: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    description: 'llama-4-maverick - large context (1M)',
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
          input: dividePrice({ of: '$0.27', by: 1_000_000 }), // $0.27/1M tokens
          output: dividePrice({ of: '$0.85', by: 1_000_000 }), // $0.85/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } }, // 1M context
        grades: {},
        cutoff: '2025-03-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * llama-3.3-70b
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.88/1M input, $0.88/1M output)
   *   - context: 128K
   *   - architecture: 70B dense
   */
  'fireworks/llama3.3/70b': {
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    description: 'llama-3.3-70b - balanced dense model (128K)',
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
          input: dividePrice({ of: '$0.88', by: 1_000_000 }), // $0.88/1M tokens
          output: dividePrice({ of: '$0.88', by: 1_000_000 }), // $0.88/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2024-12-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * glm-4.7
   * .sources:
   *   - rates: https://fireworks.ai/pricing ($0.45/1M input, $2.00/1M output)
   *   - context: 128K
   *   - swe-bench: 73.8% verified
   */
  'fireworks/glm/4.7': {
    model: 'zai-org/GLM-4.7',
    description: 'glm-4.7 - strong code + general (128K)',
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
          input: dividePrice({ of: '$0.45', by: 1_000_000 }), // $0.45/1M tokens
          output: dividePrice({ of: '$2.00', by: 1_000_000 }), // $2.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: { swe: 73.8 }, // 73.8% swe-bench verified
        cutoff: '2025-06-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
};
