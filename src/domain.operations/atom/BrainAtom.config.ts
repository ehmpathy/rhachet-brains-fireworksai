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
  // deepseek
  | 'fireworks/deepseek/v4-pro'
  | 'fireworks/deepseek/v4-flash'
  // moonshot/kimi
  | 'fireworks/kimi/k2.7-code'
  | 'fireworks/kimi/k2.6'
  // alibaba/qwen
  | 'fireworks/qwen/3.7-plus'
  // z.ai/glm
  | 'fireworks/glm/5.2'
  | 'fireworks/glm/5.1'
  // minimax
  | 'fireworks/minimax/m3'
  | 'fireworks/minimax/2.7'
  // fireworks/gpt-oss
  | 'fireworks/gpt-oss/120b'
  | 'fireworks/gpt-oss/20b';

/**
 * .what = model configuration by slug
 * .why = maps slugs to api model names, descriptions, and specs
 *
 * .sources:
 *   - rates: https://fireworks.ai/pricing
 *   - models: https://fireworks.ai/models
 *   - api docs: https://docs.fireworks.ai/reference/chat-completions-1
 *   - benchmarks: https://benchlm.ai/benchmarks/sweVerified
 */
export const CONFIG_BY_ATOM_SLUG: Record<
  FireworksBrainAtomSlug,
  BrainAtomConfig
> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // deepseek
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * deepseek-v4-pro — frontier capacity
   * .sources:
   *   - rates: $1.74/1M input, $3.48/1M output
   *   - context: 1M
   *   - swe-bench verified: 80.6%
   *   - mmlu-pro: 87.5%
   *   - gpqa-diamond: 90.1%
   */
  'fireworks/deepseek/v4-pro': {
    model: 'accounts/fireworks/models/deepseek-v4-pro',
    description: 'deepseek-v4-pro - frontier (1M, swe 80.6%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1.2 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$1.74', by: 1_000_000 }),
          output: dividePrice({ of: '$3.48', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } },
        grades: { swe: 80.6, mmlu: 87.5, gpqa: 90.1 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * deepseek-v4-flash — cheapfast
   *
   * .note = the `-0731` suffix is required. verified 2026-08-14: the
   *         un-suffixed `accounts/fireworks/models/deepseek-v4-flash` returns
   *         404 NOT_FOUND, while the `-0731` id serves. do not "tidy" the
   *         suffix away. a catalog page may still list the un-suffixed id as
   *         available; the api is authoritative over the catalog.
   *
   * .sources:
   *   - model: https://fireworks.ai/models/deepseek-ai/deepseek-v4-flash-0731
   *   - rates: $0.14/1M input, $0.28/1M output
   *   - context: 1M
   *   - swe-bench verified: 79.0%
   *   - gpqa-diamond: ~88%
   */
  'fireworks/deepseek/v4-flash': {
    model: 'accounts/fireworks/models/deepseek-v4-flash-0731',
    description: 'deepseek-v4-flash - cheapfast (1M, swe 79.0%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 150, per: { seconds: 1 } },
          latency: { seconds: 0.4 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.14', by: 1_000_000 }),
          output: dividePrice({ of: '$0.28', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } },
        grades: { swe: 79.0, gpqa: 88 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // moonshot/kimi
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * kimi-k2.7-code — agentic code, 30% fewer tokens than k2.6
   * .sources:
   *   - blog: https://fireworks.ai/blog/kimi-k2p7-code
   *   - rates: $0.95/1M input, $4.00/1M output
   *   - context: 256K
   */
  'fireworks/kimi/k2.7-code': {
    model: 'accounts/fireworks/models/kimi-k2p7-code',
    description: 'kimi-k2.7-code - agentic code (256K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.95', by: 1_000_000 }),
          output: dividePrice({ of: '$4.00', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 256_000 } },
        grades: {},
        cutoff: '2026-06-01',
        domain: 'SOFTWARE',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2.6 — strong swe-bench
   * .sources:
   *   - rates: $0.95/1M input, $4.00/1M output
   *   - context: 128K
   *   - swe-bench verified: 80.2%
   */
  'fireworks/kimi/k2.6': {
    model: 'accounts/fireworks/models/kimi-k2p6',
    description: 'kimi-k2.6 - frontier (128K, swe 80.2%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.95', by: 1_000_000 }),
          output: dividePrice({ of: '$4.00', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } },
        grades: { swe: 80.2 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // alibaba/qwen
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * qwen 3.7 plus — 3.55x faster than 3.6, hybrid reason
   * .sources:
   *   - blog: https://fireworks.ai/blog/qwen-3p7-plus
   *   - rates: $0.32/1M input, $1.28/1M output
   *   - context: 1M
   */
  'fireworks/qwen/3.7-plus': {
    model: 'accounts/fireworks/models/qwen3p7-plus',
    description: 'qwen3.7-plus - hybrid reason (1M)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 200, per: { seconds: 1 } },
          latency: { seconds: 0.4 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.32', by: 1_000_000 }),
          output: dividePrice({ of: '$1.28', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } },
        grades: {},
        cutoff: '2026-05-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // z.ai/glm
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * glm-5.2 — strongest open-source code
   * .sources:
   *   - blog: https://fireworks.ai/blog/glm-5p2
   *   - rates: $1.40/1M input, $4.40/1M output
   *   - context: 1M
   *   - swe-bench verified: 77.8%
   *   - swe-bench pro: 62.1%
   *   - gpqa-diamond: 92.9%
   *   - terminal-bench 2.1: 81.0
   */
  'fireworks/glm/5.2': {
    model: 'accounts/fireworks/models/glm-5p2',
    description: 'glm-5.2 - frontier code (1M, swe 77.8%, gpqa 92.9%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$1.40', by: 1_000_000 }),
          output: dividePrice({ of: '$4.40', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 1_000_000 } },
        grades: { swe: 77.8, gpqa: 92.9 },
        cutoff: '2026-06-01',
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
   *   - swe-bench verified: 77.8%
   */
  'fireworks/glm/5.1': {
    model: 'accounts/fireworks/models/glm-5p1',
    description: 'glm-5.1 - (128K, swe 77.8%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$1.40', by: 1_000_000 }),
          output: dividePrice({ of: '$4.40', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } },
        grades: { swe: 77.8 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // minimax
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * minimax-m3 — long context + native multimodal at 1/20th price
   * .sources:
   *   - blog: https://fireworks.ai/blog/minimax-m3-launch
   *   - rates: $0.30/1M input, $1.20/1M output
   *   - context: 500K (1M soon)
   *   - swe-bench verified: 80.5%
   */
  'fireworks/minimax/m3': {
    model: 'accounts/fireworks/models/minimax-m3',
    description: 'minimax-m3 - cheapfast multimodal (500K, swe 80.5%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 140, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.30', by: 1_000_000 }),
          output: dividePrice({ of: '$1.20', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 500_000 } },
        grades: { swe: 80.5 },
        cutoff: '2026-06-01',
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
   *   - swe-bench verified: 80.5%
   */
  'fireworks/minimax/2.7': {
    model: 'accounts/fireworks/models/minimax-m2p7',
    description: 'minimax-2.7 - (128K, swe 80.5%)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 140, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.30', by: 1_000_000 }),
          output: dividePrice({ of: '$1.20', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } },
        grades: { swe: 80.5 },
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // fireworks/gpt-oss
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * gpt-oss-120b
   * .sources:
   *   - rates: $0.15/1M input, $0.60/1M output
   *   - context: 128K
   */
  'fireworks/gpt-oss/120b': {
    model: 'accounts/fireworks/models/gpt-oss-120b',
    description: 'gpt-oss-120b - cheapfast (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 120, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.15', by: 1_000_000 }),
          output: dividePrice({ of: '$0.60', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } },
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
    description: 'gpt-oss-20b - cheapest (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 180, per: { seconds: 1 } },
          latency: { seconds: 0.3 },
        },
        cash: {
          per: 'token',
          cache: { get: asIsoPrice('$0'), set: asIsoPrice('$0') },
          input: dividePrice({ of: '$0.07', by: 1_000_000 }),
          output: dividePrice({ of: '$0.30', by: 1_000_000 }),
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } },
        grades: {},
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
};
