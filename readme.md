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
const brainAtom = genBrainAtom({ slug: 'fireworks/qwen3/coder-next' });

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

stateless inference without tool use.

| slug | model id | context | swe-bench | input | output |
| --- | --- | --- | --- | --- | --- |
| `fireworks/qwen3/coder-next` | Qwen/Qwen3-Coder-Next-FP8 | 262K | 74.2% | $0.50/1M | $1.20/1M |
| `fireworks/qwen3/coder-480b` | Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8 | 262K | 69.6% | $2.00/1M | $2.00/1M |
| `fireworks/qwen3/235b` | Qwen/Qwen3-235B-A22B-Instruct-2507-tput | 131K | — | $0.20/1M | $0.60/1M |
| `fireworks/deepseek/v3.1` | deepseek-ai/DeepSeek-V3.1 | 128K | — | $1.25/1M | $1.25/1M |
| `fireworks/deepseek/r1` | deepseek-ai/DeepSeek-R1 | 128K | — | $3.00/1M | $7.00/1M |
| `fireworks/kimi/k2` | moonshotai/Kimi-K2-Instruct | 128K | — | $1.00/1M | $3.00/1M |
| `fireworks/kimi/k2.5` | moonshotai/Kimi-K2.5 | 128K | 76.8% | $0.50/1M | $2.80/1M |
| `fireworks/llama4/maverick` | meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 | 1M | — | $0.27/1M | $0.85/1M |
| `fireworks/llama3.3/70b` | meta-llama/Llama-3.3-70B-Instruct-Turbo | 128K | — | $0.88/1M | $0.88/1M |
| `fireworks/glm/4.7` | zai-org/GLM-4.7 | 128K | 73.8% | $0.45/1M | $2.00/1M |

## why fireworks ai

fireworks ai rates include managed fine-tune access ($6-10/1M tokens) and high-throughput serverless infrastructure. some model authors offer cheaper direct apis for inference-only:

| model | fireworks ai (in/out) | author direct (in/out) | author api |
| --- | --- | --- | --- |
| deepseek v3 | $1.25/$1.25 | **$0.28/$0.42** (3-4x cheaper) | [api.deepseek.com](https://api-docs.deepseek.com/quick_start/pricing) |
| deepseek r1 | $3.00/$7.00 | **$0.28/$0.42** (10-17x cheaper) | [api.deepseek.com](https://api-docs.deepseek.com/quick_start/pricing) |
| kimi k2 | $1.00/$3.00 | **$0.60/$2.50** (~35% cheaper) | [platform.moonshot.ai](https://platform.moonshot.ai/docs/pricing/chat) |
| kimi k2.5 | $0.50/$2.80 | $0.60/$3.00 (at parity) | [platform.moonshot.ai](https://platform.moonshot.ai/docs/pricing/chat) |
| qwen3 coder-next | **$0.50/$1.20** | $1.00/$5.00 (fireworks ai cheaper) | [alibabacloud.com](https://www.alibabacloud.com/help/en/model-studio/model-pricing) |
| glm-4.7 | **$0.45/$2.00** | $0.60/$2.20 (fireworks ai cheaper) | [z.ai](https://docs.z.ai/guides/overview/pricing) |
| llama 4 maverick | $0.27/$0.85 | ~$0.27/$0.85 (at parity) | [llama.com](https://www.llama.com/products/llama-api/) |

**tldr:** deepseek's direct api is dramatically cheaper. kimi k2 is modestly cheaper via moonshot. the rest are at parity or more expensive than fireworks ai. fireworks ai's premium buys fine-tune access and unified multi-model infrastructure.

## environment

requires `FIREWORKS_API_KEY` environment variable.

get your api key at https://api.fireworks.ai/inference/settings/api-keys

## sources

- [fireworks ai api docs](https://docs.fireworks.ai/reference/chat-completions-1)
- [fireworks ai models](https://docs.fireworks.ai/docs/serverless-models)
- [fireworks ai rates](https://fireworks.ai/pricing)
- [deepseek rates](https://api-docs.deepseek.com/quick_start/pricing)
- [moonshot rates](https://platform.moonshot.ai/docs/pricing/chat)
- [alibaba model studio rates](https://www.alibabacloud.com/help/en/model-studio/model-pricing)
- [zhipu z.ai rates](https://docs.z.ai/guides/overview/pricing)
- [meta llama api](https://www.llama.com/products/llama-api/)
