import { BadRequestError } from 'helpful-errors';
import path from 'path';
import type {
  BrainPlugToolDefinition,
  BrainPlugToolExecution,
} from 'rhachet/brains';
import { genArtifactGitFile } from 'rhachet-artifact-git';
import { given, then, useThen, when } from 'test-fns';
import { z } from 'zod';

import { TEST_ASSETS_DIR } from '../../.test/assets/dir';
import type { FireworksBrainAtomSlug } from './BrainAtom.config';
import { genBrainAtom } from './genBrainAtom';

const BRIEFS_DIR = path.join(TEST_ASSETS_DIR, '/example.briefs');

const outputSchema = z.object({ content: z.string() });

// tool use requires z.string() schema (vllm cannot do structured output + tool calls together)
const toolOutputSchema = z.string();

if (!process.env.FIREWORKS_API_KEY)
  throw new BadRequestError(
    'FIREWORKS_API_KEY is required for integration tests',
  );

describe('genBrainAtom.integration', () => {
  jest.setTimeout(30000);

  // use qwen3-coder-next for fast integration tests
  const brainAtom = genBrainAtom({ slug: 'fireworks/qwen3/coder-next' });

  // use kimi/k2.5 for tool use tests (good tool call capability)
  const brainAtomWithTools = genBrainAtom({ slug: 'fireworks/kimi/k2.5' });

  given('[case1] genBrainAtom({ slug: "fireworks/qwen3/coder-next" })', () => {
    when('[t0] atom is created', () => {
      then('repo is "fireworks"', () => {
        expect(brainAtom.repo).toEqual('fireworks');
      });

      then('slug is "fireworks/qwen3/coder-next"', () => {
        expect(brainAtom.slug).toEqual('fireworks/qwen3/coder-next');
      });

      then('description is defined', () => {
        expect(brainAtom.description).toBeDefined();
        expect(brainAtom.description.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] ask is called', () => {
    when('[t0] with simple prompt', () => {
      // call the operation once and share result across assertions
      const result = useThen('it returns a response', async () =>
        brainAtom.ask({
          role: {},
          prompt: 'respond with exactly: hello world',
          schema: { output: outputSchema },
        }),
      );

      then('response contains "hello"', () => {
        expect(result.output.content).toBeDefined();
        expect(result.output.content.length).toBeGreaterThan(0);
        expect(result.output.content.toLowerCase()).toContain('hello');
      });

      then('metrics includes token counts', () => {
        expect(result.metrics.size.tokens.input).toBeGreaterThan(0);
        expect(result.metrics.size.tokens.output).toBeGreaterThan(0);
      });

      then('metrics includes cash costs', () => {
        expect(result.metrics.cost.cash.deets.input).toBeDefined();
        expect(result.metrics.cost.cash.deets.output).toBeDefined();
        expect(result.metrics.cost.cash.total).toBeDefined();
      });

      then('metrics includes time cost', () => {
        expect(result.metrics.cost.time).toBeDefined();
      });
    });

    when('[t1] with briefs', () => {
      then('response leverages knowledge from brief', async () => {
        const briefs = [
          genArtifactGitFile({
            uri: path.join(BRIEFS_DIR, 'secret-code.brief.md'),
          }),
        ];
        const result = await brainAtom.ask({
          role: { briefs },
          prompt: 'say hello',
          schema: { output: outputSchema },
        });
        expect(result.output.content).toBeDefined();
        expect(result.output.content).toContain('ZEBRA42');
      });
    });
  });

  given('[case3] episode continuation', () => {
    when('[t0] ask is called with initial prompt', () => {
      const resultFirst = useThen('it succeeds', async () =>
        brainAtom.ask({
          role: {},
          prompt:
            'remember this secret code: MANGO77. respond with "code received"',
          schema: { output: outputSchema },
        }),
      );

      then('it returns an episode', () => {
        expect(resultFirst.episode).toBeDefined();
        expect(resultFirst.episode.hash).toBeDefined();
        expect(resultFirst.episode.exchanges).toHaveLength(1);
      });

      then('series is null for atoms', () => {
        expect(resultFirst.series).toBeNull();
      });
    });

    when('[t1] ask is called with continuation via on.episode', () => {
      const resultFirst = useThen('first ask succeeds', async () =>
        brainAtom.ask({
          role: {},
          prompt:
            'remember this secret code: PAPAYA99. respond with "code stored"',
          schema: { output: outputSchema },
        }),
      );

      const resultSecond = useThen('second ask succeeds', async () =>
        brainAtom.ask({
          on: { episode: resultFirst.episode },
          role: {},
          prompt: 'what was the secret code i told you to remember?',
          schema: { output: outputSchema },
        }),
      );

      then('continuation remembers context from prior exchange', () => {
        expect(resultSecond.output.content).toContain('PAPAYA99');
      });

      then('episode accumulates exchanges', () => {
        expect(resultSecond.episode.exchanges).toHaveLength(2);
      });
    });
  });

  given('[case4] all models leverage briefs', () => {
    // note: kimi/k2 excluded due to persistent 503 availability issues on fireworks ai
    // the model is still in BrainAtom.config for users who want to try it
    const allSlugs: FireworksBrainAtomSlug[] = [
      'fireworks/qwen3/coder-next',
      'fireworks/qwen3/coder-480b',
      'fireworks/qwen3/235b',
      'fireworks/deepseek/v3.1',
      'fireworks/deepseek/r1',
      'fireworks/kimi/k2.5',
      'fireworks/llama4/maverick',
      'fireworks/llama3.3/70b',
      'fireworks/glm/4.7',
    ];

    const briefs = [
      genArtifactGitFile({
        uri: path.join(BRIEFS_DIR, 'secret-code.brief.md'),
      }),
    ];

    for (const slug of allSlugs) {
      when(`[${slug}] ask is called with briefs`, () => {
        then.repeatably({
          attempts: 3,
          criteria: 'SOME',
        })('response contains ZEBRA42', async () => {
          const atom = genBrainAtom({ slug });
          const result = await atom.ask({
            role: { briefs },
            prompt: 'say hello',
            schema: { output: outputSchema },
          });
          expect(result.output.content).toContain('ZEBRA42');
        });
      });
    }
  });

  // tool definition for tool use tests
  const weatherTool: BrainPlugToolDefinition = {
    slug: 'weather.lookup',
    name: 'Weather Lookup',
    description: 'get current weather for a city',
    schema: {
      input: z.object({ city: z.string() }),
      output: z.object({ temp: z.number(), conditions: z.string() }),
    },
  };

  given('[case5] tool invocation', () => {
    when('[t0] tools plugged, prompt requires tool use', () => {
      const result = useThen('it returns tool calls', async () =>
        brainAtomWithTools.ask({
          role: {},
          prompt: 'what is the current weather in austin, texas?',
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        }),
      );

      then('result.calls.tools contains invocations', () => {
        expect(result.calls).toBeDefined();
        expect(result.calls?.tools).toBeDefined();
        expect(result.calls?.tools?.length).toBeGreaterThan(0);
      });

      then('result.output is null', () => {
        expect(result.output).toBeNull();
      });

      then('each invocation has exid, slug, input', () => {
        const invocation = result.calls?.tools?.[0];
        expect(invocation?.exid).toBeDefined();
        expect(invocation?.slug).toEqual('weather.lookup');
        expect(invocation?.input).toBeDefined();
      });

      then('invocation.input is typed per tool schema', () => {
        const invocation = result.calls?.tools?.[0];
        expect(invocation?.input).toHaveProperty('city');
        const input = invocation?.input as { city: string };
        expect(typeof input.city).toEqual('string');
      });
    });

    // note: test "tools plugged, brain answers directly" is NOT supported by Fireworks AI
    // when tools are present, we cannot send response_format (model ignores tools)
    // so if the model answers directly, output won't conform to schema
    // this is a Fireworks AI limitation; xAI handles this differently
  });

  given('[case6] tool continuation', () => {
    when('[t0] ask returns tool calls, then continue with executions', () => {
      const resultFirst = useThen('first ask returns tool calls', async () =>
        brainAtomWithTools.ask({
          role: {},
          prompt: 'what is the weather in new york city?',
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        }),
      );

      const resultSecond = useThen(
        'second ask with tool executions succeeds',
        async () => {
          const invocation = resultFirst.calls?.tools?.[0];
          if (!invocation) throw new Error('no tool invocation found');

          const executions: BrainPlugToolExecution[] = [
            {
              exid: invocation.exid,
              slug: invocation.slug,
              input: invocation.input,
              signal: 'success',
              output: { temp: 45, conditions: 'cloudy' },
              metrics: { cost: { time: { milliseconds: 100 } } },
            },
          ];

          return brainAtomWithTools.ask({
            on: { episode: resultFirst.episode },
            role: {},
            prompt: executions,
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          });
        },
      );

      then('brain synthesizes final answer from tool results', () => {
        expect(resultSecond.output).toBeDefined();
        expect(resultSecond.output).not.toBeNull();
        expect(typeof resultSecond.output).toEqual('string');
      });

      then('episode.exchanges accumulates tool exchange', () => {
        expect(resultSecond.episode.exchanges.length).toBeGreaterThan(1);
      });

      then('result.calls is null after final answer', () => {
        expect(resultSecond.calls).toBeNull();
      });
    });
  });

  given('[case7] error signals in tool execution', () => {
    when('[t0] signal is error:constraint', () => {
      then('brain receives error context and responds', async () => {
        // first get tool call
        const resultFirst = await brainAtomWithTools.ask({
          role: {},
          prompt: 'what is the weather in tokyo?',
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        });

        const invocation = resultFirst.calls?.tools?.[0];
        if (!invocation) throw new Error('no tool invocation found');

        // continue with error:constraint signal
        const executions: BrainPlugToolExecution[] = [
          {
            exid: invocation.exid,
            slug: invocation.slug,
            input: invocation.input,
            signal: 'error:constraint',
            output: { error: new Error('city not found in database') },
            metrics: { cost: { time: { milliseconds: 50 } } },
          },
        ];

        const resultSecond = await brainAtomWithTools.ask({
          on: { episode: resultFirst.episode },
          role: {},
          prompt: executions,
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        });

        // brain should handle error gracefully
        expect(resultSecond.output).toBeDefined();
        expect(resultSecond.output).not.toBeNull();
      });
    });

    when('[t1] signal is error:malfunction', () => {
      then('brain handles system failure gracefully', async () => {
        // first get tool call
        const resultFirst = await brainAtomWithTools.ask({
          role: {},
          prompt: 'what is the weather in london?',
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        });

        const invocation = resultFirst.calls?.tools?.[0];
        if (!invocation) throw new Error('no tool invocation found');

        // continue with error:malfunction signal
        const executions: BrainPlugToolExecution[] = [
          {
            exid: invocation.exid,
            slug: invocation.slug,
            input: invocation.input,
            signal: 'error:malfunction',
            output: { error: new Error('weather service unavailable') },
            metrics: { cost: { time: { milliseconds: 30 } } },
          },
        ];

        const resultSecond = await brainAtomWithTools.ask({
          on: { episode: resultFirst.episode },
          role: {},
          prompt: executions,
          schema: { output: toolOutputSchema },
          plugs: { tools: [weatherTool] },
        });

        // brain should handle malfunction gracefully
        expect(resultSecond.output).toBeDefined();
        expect(resultSecond.output).not.toBeNull();
      });
    });
  });

  // note: case8 "structured output with tools on initial invocation" is NOT supported by Fireworks AI
  // Fireworks AI prioritizes json_schema over tool invocation when both are present
  // so we cannot send response_format for initial invocation when tools are plugged
  // structured output works on tool continuation (when prompt is BrainPlugToolExecution[])
  // this is a Fireworks AI limitation; xAI handles this differently

  given('[case9] tool use model compatibility', () => {
    // note: kimi/k2 excluded due to persistent 503 availability issues on fireworks ai
    // the model is still in BrainAtom.config for users who want to try it
    const toolCompatSlugs: FireworksBrainAtomSlug[] = [
      'fireworks/qwen3/coder-next',
      'fireworks/qwen3/coder-480b',
      'fireworks/qwen3/235b',
      'fireworks/deepseek/v3.1',
      'fireworks/kimi/k2.5',
      'fireworks/llama4/maverick',
      'fireworks/llama3.3/70b',
      'fireworks/glm/4.7',
    ];

    for (const slug of toolCompatSlugs) {
      when(`[${slug}] ask is called with tools`, () => {
        then.repeatably({
          attempts: 3,
          criteria: 'SOME',
        })('tool invocation works', async () => {
          const atom = genBrainAtom({ slug });
          const result = await atom.ask({
            role: {},
            prompt: 'what is the current weather in seattle?',
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          });
          // model should invoke the weather tool
          expect(result.calls).toBeDefined();
          expect(result.calls?.tools?.length).toBeGreaterThan(0);
          expect(result.calls?.tools?.[0]?.slug).toEqual('weather.lookup');
        });
      });
    }
  });

  given('[case10] tool use on open-source models', () => {
    const calculatorTool: BrainPlugToolDefinition = {
      slug: 'calculator.multiply',
      name: 'Calculator Multiply',
      description: 'Multiplies two numbers together',
      schema: {
        input: z.object({
          a: z.number().describe('First number'),
          b: z.number().describe('Second number'),
        }),
        output: z.object({ result: z.number() }),
      },
    };

    // test tool use on models that support it
    const modelsToTest: FireworksBrainAtomSlug[] = [
      'fireworks/kimi/k2.5',
      'fireworks/glm/4.7',
    ];

    for (const slug of modelsToTest) {
      when(`[${slug}] tool invocation and continuation`, () => {
        then.repeatably({
          attempts: 3,
          criteria: 'SOME',
        })('tool call + continuation works', async () => {
          const atom = genBrainAtom({ slug });

          // first call: brain should request tool
          const resultFirst = await atom.ask({
            role: {},
            prompt:
              'Call the calculator tool to multiply 6 times 9. You must call the tool.',
            plugs: { tools: [calculatorTool] },
            schema: { output: toolOutputSchema },
          });

          // verify tool call is returned
          expect(resultFirst.output).toBeNull();
          expect(resultFirst.calls?.tools).toBeDefined();
          expect(resultFirst.calls?.tools?.length).toBeGreaterThan(0);
          expect(resultFirst.calls?.tools?.[0]?.slug).toEqual(
            'calculator.multiply',
          );

          // second call: feed tool result, expect text output
          const toolCall = resultFirst.calls?.tools?.[0];
          if (!toolCall) throw new Error('no tool call in first result');

          const resultSecond = await atom.ask({
            on: { episode: resultFirst.episode },
            role: {},
            prompt: [
              {
                exid: toolCall.exid,
                slug: toolCall.slug,
                input: toolCall.input,
                signal: 'success' as const,
                output: { result: 54 },
                metrics: { cost: { time: { milliseconds: 1 } } },
              },
            ],
            plugs: { tools: [calculatorTool] },
            schema: { output: toolOutputSchema },
          });

          // verify output is valid string with result
          expect(resultSecond.output).not.toBeNull();
          expect(typeof resultSecond.output).toEqual('string');
          expect(resultSecond.output).toContain('54');
        });
      });
    }
  });
});
