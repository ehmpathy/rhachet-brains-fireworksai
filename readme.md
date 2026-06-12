# rhachet-brains-fireworksai

rhachet brain.atom adapter for fireworks ai open-source models

## install

```sh
npm install rhachet-brains-fireworksai
```

## usage

```ts
import { genBrainAtom } from 'rhachet-brains-fireworksai';
import { z } from 'zod';

// create a brain atom for direct model inference
const brainAtom = genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' });

// simple string output
const { output: explanation } = await brainAtom.ask({
  role: { briefs: [] },
  prompt: 'explain this code',
  schema: { output: z.string() },
});

// structured object output
const { output: { summary, issues } } = await brainAtom.ask({
  role: { briefs: [] },
  prompt: 'analyze this code',
  schema: { output: z.object({ summary: z.string(), issues: z.array(z.string()) }) },
});
```

## available brains

### atoms (via genBrainAtom)

stateless inference with tool use support. all models below are verified on fireworks ai serverless.

#### frontier tier

highest capability models for complex tasks.

| slug | model | context | swe-bench | input | output |
| --- | --- | --- | --- | --- | --- |
| `fireworks/kimi/k2.6` | Kimi-K2.6 | 128K | 80.2% | $0.95/1M | $4.00/1M |
| `fireworks/minimax/2.7` | MiniMax-M2.7 | 128K | 80.5% | $0.30/1M | $1.20/1M |
| `fireworks/minimax/2.5` | MiniMax-M2.5 | 128K | 80.2% | $0.30/1M | $1.20/1M |
| `fireworks/deepseek/v4-pro` | DeepSeek-V4-Pro | 1M | 79.4% | $1.74/1M | $3.48/1M |
| `fireworks/deepseek/v4-flash` | DeepSeek-V4-Flash | 1M | 78.6% | $0.14/1M | $0.28/1M |
| `fireworks/glm/5.1` | GLM-5.1 | 128K | 77.8% | $1.40/1M | $4.40/1M |
| `fireworks/kimi/k2.5` | Kimi-K2.5 | 128K | 76.8% | $0.60/1M | $3.00/1M |

#### cheapfast tier

models optimized for high-volume inference at low cost.

| slug | model | context | swe-bench | input | output |
| --- | --- | --- | --- | --- | --- |
| `fireworks/gpt-oss/20b` | GPT-OSS-20B | 128K | — | $0.07/1M | $0.30/1M |
| `fireworks/deepseek/v4-flash` | DeepSeek-V4-Flash | 1M | 78.6% | $0.14/1M | $0.28/1M |
| `fireworks/gpt-oss/120b` | GPT-OSS-120B | 128K | — | $0.15/1M | $0.60/1M |
| `fireworks/minimax/2.5` | MiniMax-M2.5 | 128K | 80.2% | $0.30/1M | $1.20/1M |
| `fireworks/minimax/2.7` | MiniMax-M2.7 | 128K | 80.5% | $0.30/1M | $1.20/1M |
| `fireworks/qwen3.6/plus` | Qwen-3.6-Plus | 131K | — | $0.50/1M | $3.00/1M |

> swe-bench verified scores from [llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) and fireworks ai model cards.

### tool use support

all 10 models support tool use via the openai-compatible function call api. tested capabilities:

| capability | status |
| --- | --- |
| tool invocation | all models |
| tool continuation | all models |
| structured output | all models (without tools) |

## credentials

two patterns for credential injection:

### repo level — keyrack shorthand

auto-discover `FIREWORKS_API_KEY` from keyrack:

```ts
import { genBrainAtom, genContextBrainSupplier } from 'rhachet-brains-fireworksai';

const context = genContextBrainSupplier('fireworks', {
  creds: { keyrack: { owner: 'ehmpath', env: 'prod' } },
});

const brainAtom = genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' });
const { output } = await brainAtom.ask({ ... }, context);
```

### user level — explicit getter

per-request credentials from vault, kms, or multi-tenant source:

```ts
import { genBrainAtom, genContextBrainSupplier } from 'rhachet-brains-fireworksai';

const context = genContextBrainSupplier('fireworks', {
  creds: async () => ({
    FIREWORKS_API_KEY: await vault.get(`tenant/${tenantId}/fireworks`),
  }),
});

const brainAtom = genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' });
const { output } = await brainAtom.ask({ ... }, context);
```

### fallback — environment variable

if no context provided, falls back to `FIREWORKS_API_KEY` environment variable.

get your api key at https://api.fireworks.ai/inference/settings/api-keys

## sources

- [fireworks ai api docs](https://docs.fireworks.ai/reference/chat-completions-1)
- [fireworks ai models](https://docs.fireworks.ai/docs/serverless-models)
- [fireworks ai rates](https://docs.fireworks.ai/serverless/rates)
