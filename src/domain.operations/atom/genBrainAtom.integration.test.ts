import { UnexpectedCodePathError } from 'helpful-errors';
import path from 'path';
import { genContextBrainSupplier } from 'rhachet';
import type {
  BrainPlugToolDefinition,
  BrainPlugToolExecution,
} from 'rhachet/brains';
import { genArtifactGitFile } from 'rhachet-artifact-git';
import { getError, given, then, useThen, when } from 'test-fns';
import { z } from 'zod';

import { TEST_ASSETS_DIR } from '../../.test/assets/dir';
import type {
  BrainSuppliesFireworks,
  FireworksBrainAtomSlug,
} from './BrainAtom.config';
import { genBrainAtom } from './genBrainAtom';

const BRIEFS_DIR = path.join(TEST_ASSETS_DIR, '/example.briefs');

const outputSchema = z.object({ content: z.string() });

// tool use requires z.string() schema (vllm cannot do structured output + tool calls together)
const toolOutputSchema = z.string();

// keyrack context for all tests
const context = genContextBrainSupplier<'fireworks', BrainSuppliesFireworks>(
  'fireworks',
  { creds: { keyrack: { owner: 'ehmpath', env: 'test' } } },
);

describe('genBrainAtom.integration', () => {
  // note: k2.5 excluded from model loop tests due to slow Fireworks infrastructure
  jest.setTimeout(90000);

  // use deepseek-v4-flash for fast integration tests
  const brainAtom = genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' });

  // use minimax/m3 for tool use tests (reliable tool call + slug support)
  const brainAtomWithTools = genBrainAtom({ slug: 'fireworks/minimax/m3' });

  given('[case1] genBrainAtom({ slug: "fireworks/deepseek/v4-flash" })', () => {
    when('[t0] atom is created', () => {
      then('repo is "fireworks"', () => {
        expect(brainAtom.repo).toEqual('fireworks');
      });

      then('slug is "fireworks/deepseek/v4-flash"', () => {
        expect(brainAtom.slug).toEqual('fireworks/deepseek/v4-flash');
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
        brainAtom.ask(
          {
            role: {},
            prompt: 'respond with exactly: hello world',
            schema: { output: outputSchema },
          },
          context,
        ),
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
        const result = await brainAtom.ask(
          {
            role: { briefs },
            prompt: 'say hello',
            schema: { output: outputSchema },
          },
          context,
        );
        expect(result.output.content).toBeDefined();
        expect(result.output.content).toContain('ZEBRA42');
      });
    });
  });

  given('[case3] episode continuation', () => {
    when('[t0] ask is called with initial prompt', () => {
      const resultFirst = useThen('it succeeds', async () =>
        brainAtom.ask(
          {
            role: {},
            prompt:
              'remember this secret code: MANGO77. respond with "code received"',
            schema: { output: outputSchema },
          },
          context,
        ),
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
        brainAtom.ask(
          {
            role: {},
            prompt:
              'remember this secret code: PAPAYA99. respond with "code stored"',
            schema: { output: outputSchema },
          },
          context,
        ),
      );

      const resultSecond = useThen('second ask succeeds', async () =>
        brainAtom.ask(
          {
            on: { episode: resultFirst.episode },
            role: {},
            prompt: 'what was the secret code i told you to remember?',
            schema: { output: outputSchema },
          },
          context,
        ),
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
    // all serverless-available models
    // note: llama4 excluded due to 404 errors (possibly geo-restricted or deployment issue)
    const allSlugs: FireworksBrainAtomSlug[] = [
      'fireworks/deepseek/v4-pro',
      'fireworks/deepseek/v4-flash',
      'fireworks/kimi/k2.7-code',
      'fireworks/kimi/k2.6',
      'fireworks/qwen/3.7-plus',
      'fireworks/glm/5.2',
      'fireworks/minimax/m3',
      'fireworks/minimax/2.7',
      'fireworks/gpt-oss/120b',
      'fireworks/gpt-oss/20b',
    ];

    const briefs = [
      genArtifactGitFile({
        uri: path.join(BRIEFS_DIR, 'secret-code.brief.md'),
      }),
    ];

    for (const slug of allSlugs) {
      when(`[${slug}] ask is called with briefs`, () => {
        // .note = prompt is neutral ('acknowledge this message'), not 'say hello' — a
        //         literal 'say hello' competed with the brief's directive, and several
        //         open-weight models (observed: minimax/m3, glm/5.2, qwen/3.7-plus)
        //         intermittently followed the surface prompt and dropped the brief.
        //         attempts raised 3->5 as a secondary margin; llm inference stays
        //         probabilistic even with the prompt no longer in tension with the brief.
        then.repeatably({
          attempts: 5,
          criteria: 'SOME',
        })('response contains ZEBRA42', async () => {
          const atom = genBrainAtom({ slug });
          const result = await atom.ask(
            {
              role: { briefs },
              prompt: 'acknowledge this message',
              schema: { output: outputSchema },
            },
            context,
          );
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
        brainAtomWithTools.ask(
          {
            role: {},
            prompt: 'what is the current weather in austin, texas?',
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        ),
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
        brainAtomWithTools.ask(
          {
            role: {},
            prompt: 'what is the weather in new york city?',
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        ),
      );

      const resultSecond = useThen(
        'second ask with tool executions succeeds',
        async () => {
          const invocation = resultFirst.calls?.tools?.[0];
          if (!invocation)
            throw new UnexpectedCodePathError('no tool invocation found', {
              resultFirst,
            });

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

          return brainAtomWithTools.ask(
            {
              on: { episode: resultFirst.episode },
              role: {},
              prompt: executions,
              schema: { output: toolOutputSchema },
              plugs: { tools: [weatherTool] },
            },
            context,
          );
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
        const resultFirst = await brainAtomWithTools.ask(
          {
            role: {},
            prompt: 'what is the weather in tokyo?',
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        );

        const invocation = resultFirst.calls?.tools?.[0];
        if (!invocation)
          throw new UnexpectedCodePathError('no tool invocation found', {
            resultFirst,
          });

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

        const resultSecond = await brainAtomWithTools.ask(
          {
            on: { episode: resultFirst.episode },
            role: {},
            prompt: executions,
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        );

        // brain should handle error gracefully
        expect(resultSecond.output).toBeDefined();
        expect(resultSecond.output).not.toBeNull();
      });
    });

    when('[t1] signal is error:malfunction', () => {
      then('brain handles system failure gracefully', async () => {
        // first get tool call
        const resultFirst = await brainAtomWithTools.ask(
          {
            role: {},
            prompt: 'what is the weather in london?',
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        );

        const invocation = resultFirst.calls?.tools?.[0];
        if (!invocation)
          throw new UnexpectedCodePathError('no tool invocation found', {
            resultFirst,
          });

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

        const resultSecond = await brainAtomWithTools.ask(
          {
            on: { episode: resultFirst.episode },
            role: {},
            prompt: executions,
            schema: { output: toolOutputSchema },
            plugs: { tools: [weatherTool] },
          },
          context,
        );

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
    // all models that support tool use
    // note: llama4 excluded due to 404 errors (possibly geo-restricted or deployment issue)
    const toolCompatSlugs: FireworksBrainAtomSlug[] = [
      'fireworks/deepseek/v4-pro',
      'fireworks/deepseek/v4-flash',
      'fireworks/kimi/k2.7-code',
      'fireworks/kimi/k2.6',
      'fireworks/qwen/3.7-plus',
      'fireworks/glm/5.2',
      'fireworks/minimax/m3',
      'fireworks/minimax/2.7',
      'fireworks/gpt-oss/120b',
      'fireworks/gpt-oss/20b',
    ];

    for (const slug of toolCompatSlugs) {
      when(`[${slug}] ask is called with tools`, () => {
        then.repeatably({
          attempts: 3,
          criteria: 'SOME',
        })('tool invocation works', async () => {
          const atom = genBrainAtom({ slug });
          const result = await atom.ask(
            {
              role: {},
              prompt: 'what is the current weather in seattle?',
              schema: { output: toolOutputSchema },
              plugs: { tools: [weatherTool] },
            },
            context,
          );
          // model should invoke the weather tool
          // note: some models (kimi) strip the namespace from tool names
          expect(result.calls).toBeDefined();
          expect(result.calls?.tools?.length).toBeGreaterThan(0);
          const toolSlug = result.calls?.tools?.[0]?.slug ?? '';
          expect(toolSlug === 'weather.lookup' || toolSlug === 'lookup').toBe(
            true,
          );
        });
      });
    }
  });

  given('[case10] error paths', () => {
    when('[t0] tools plugged with non-string schema', () => {
      then('throws BadRequestError with helpful message', async () => {
        const error = await getError(() =>
          brainAtomWithTools.ask(
            {
              role: {},
              prompt: 'hello',
              schema: { output: z.object({ value: z.number() }) },
              plugs: { tools: [weatherTool] },
            },
            context,
          ),
        );
        expect(error.message).toContain('when tools are plugged');
        expect(error.message).toContain('z.string()');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case11] tool use on open-source models', () => {
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
      'fireworks/minimax/m3',
      'fireworks/minimax/2.7',
    ];

    for (const slug of modelsToTest) {
      when(`[${slug}] tool invocation and continuation`, () => {
        then.repeatably({
          attempts: 3,
          criteria: 'SOME',
        })('tool call + continuation works', async () => {
          const atom = genBrainAtom({ slug });

          // first call: brain should request tool
          const resultFirst = await atom.ask(
            {
              role: {},
              prompt:
                'Call the calculator tool to multiply 6 times 9. You must call the tool.',
              plugs: { tools: [calculatorTool] },
              schema: { output: toolOutputSchema },
            },
            context,
          );

          // verify tool call is returned
          expect(resultFirst.output).toBeNull();
          expect(resultFirst.calls?.tools).toBeDefined();
          expect(resultFirst.calls?.tools?.length).toBeGreaterThan(0);
          expect(resultFirst.calls?.tools?.[0]?.slug).toEqual(
            'calculator.multiply',
          );

          // second call: feed tool result, expect text output
          const toolCall = resultFirst.calls?.tools?.[0];
          if (!toolCall)
            throw new UnexpectedCodePathError('no tool call in first result', {
              resultFirst,
            });

          const resultSecond = await atom.ask(
            {
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
            },
            context,
          );

          // verify output is valid string with result
          expect(resultSecond.output).not.toBeNull();
          expect(typeof resultSecond.output).toEqual('string');
          expect(resultSecond.output).toContain('54');
        });
      });
    }
  });
});
