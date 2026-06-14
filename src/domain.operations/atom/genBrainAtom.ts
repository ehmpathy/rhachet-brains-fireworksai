import { BadRequestError } from 'helpful-errors';
import OpenAI from 'openai';
import type { ContextBrainSupplier } from 'rhachet';
import {
  BrainAtom,
  type BrainEpisode,
  BrainOutput,
  BrainOutputMetrics,
  type BrainPlugs,
  type BrainPlugToolExecution,
  type BrainPlugToolInvocation,
  calcBrainOutputCost,
  castBriefsToPrompt,
  genBrainContinuables,
  getSdkCredsFromBrainSupplies,
} from 'rhachet/brains';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';
import { z } from 'zod';

import { castContentToOutputSchema } from '../../infra/cast/castContentToOutputSchema';
import { castFromFireworksToolCall } from '../../infra/cast/castFromFireworksToolCall';
import { castIntoFireworksToolDef } from '../../infra/cast/castIntoFireworksToolDef';
import { castIntoFireworksToolMessages } from '../../infra/cast/castIntoFireworksToolMessages';
import {
  type BrainSuppliesFireworks,
  CONFIG_BY_ATOM_SLUG,
  type FireworksBrainAtomSlug,
} from './BrainAtom.config';

// re-export for consumers
export type {
  BrainSuppliesFireworks,
  FireworksBrainAtomSlug,
} from './BrainAtom.config';

/**
 * .what = typed context for fireworks brain supplier
 * .why = enables type-safe credential injection via genContextBrainSupplier('fireworks', ...)
 */
export type ContextBrainSupplierFireworks = ContextBrainSupplier<
  'fireworks',
  BrainSuppliesFireworks
>;

/**
 * .what = factory to generate fireworks ai brain atom instances
 * .why = enables model variant selection via slug
 *
 * .note = fireworks ai api is openai-compatible with baseURL override
 *
 * .example
 *   genBrainAtom({ slug: 'fireworks/deepseek/v4-flash' }) // fast + cheap
 *   genBrainAtom({ slug: 'fireworks/minimax/2.7' }) // best swe-bench (80.5%)
 *   genBrainAtom({ slug: 'fireworks/kimi/k2.6' }) // high capability
 */
export const genBrainAtom = (input: {
  slug: FireworksBrainAtomSlug;
}): BrainAtom<ContextBrainSupplierFireworks> => {
  // guard for invalid slug (runtime protection for js callers)
  const config = CONFIG_BY_ATOM_SLUG[input.slug];
  const validSlugs = Object.keys(CONFIG_BY_ATOM_SLUG);
  if (!config)
    throw new BadRequestError(
      `invalid fireworks brain atom slug: '${input.slug}'. valid slugs: ${validSlugs.join(', ')}`,
      { slug: input.slug, valid: validSlugs },
    );

  return new BrainAtom({
    repo: 'fireworks',
    slug: input.slug,
    description: config.description,
    spec: config.spec,

    /**
     * .what = stateless inference with optional tool use
     * .why = provides direct model access for tasks
     *
     * .note = outputs are non-deterministic (llm inference)
     * .note = supports continuation via `on.episode`
     * .note = supports tool use via `plugs.tools`
     */
    ask: async <TOutput, TPlugs extends BrainPlugs = BrainPlugs>(
      askInput: {
        on?: { episode: BrainEpisode };
        plugs?: TPlugs;
        role: { briefs?: Artifact<typeof GitFile>[] };
        prompt: string | BrainPlugToolExecution[];
        schema: { output: z.Schema<TOutput> };
      },
      context?: ContextBrainSupplierFireworks,
    ): Promise<BrainOutput<TOutput, 'atom', TPlugs>> => {
      // track start time for elapsed duration
      const startedAt = Date.now();

      // compose system prompt from briefs
      const systemPrompt = askInput.role.briefs
        ? await castBriefsToPrompt({ briefs: askInput.role.briefs })
        : undefined;

      // get credentials via context (keyrack shorthand or getter)
      const supplier = context?.['brain.supplier.fireworks'];
      if (!supplier?.creds)
        throw new BadRequestError(
          'FIREWORKS_API_KEY required — provide via context',
        );
      const creds = await getSdkCredsFromBrainSupplies({
        creds: supplier.creds,
        keys: ['FIREWORKS_API_KEY'],
      });
      const openai = new OpenAI({
        apiKey: creds.FIREWORKS_API_KEY,
        baseURL: 'https://api.fireworks.ai/inference/v1',
      });

      // build messages array with prior exchanges for continuation
      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      if (askInput.on?.episode) {
        for (const exchange of askInput.on.episode.exchanges) {
          messages.push({ role: 'user', content: exchange.input });
          messages.push({ role: 'assistant', content: exchange.output });
        }
      }

      // handle prompt: string or BrainPlugToolExecution[]
      const promptIsToolExecutions = Array.isArray(askInput.prompt);
      if (promptIsToolExecutions) {
        // tool continuation: add assistant message with tool_calls, then tool messages
        const executions = askInput.prompt as BrainPlugToolExecution[];

        // reconstruct assistant message with tool_calls from prior exchange
        // note: this is needed because fireworks ai expects the assistant message before tool messages
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] =
          executions.map((exec) => ({
            id: exec.exid,
            type: 'function' as const,
            function: {
              name: exec.slug,
              arguments: JSON.stringify(exec.input),
            },
          }));

        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        });

        // add tool result messages
        const toolMessages = castIntoFireworksToolMessages({ executions });
        messages.push(...toolMessages);
      } else {
        // regular prompt
        messages.push({ role: 'user', content: askInput.prompt as string });
      }

      // convert zod schema to json schema for structured output
      const jsonSchema = z.toJSONSchema(askInput.schema.output);

      // convert tools to fireworks ai format if plugged
      const tools = askInput.plugs?.tools?.map((tool) =>
        castIntoFireworksToolDef({ tool }),
      );

      // determine if tools are present and whether this is a continuation
      const hasTools = tools && tools.length > 0;
      const isToolContinuation = promptIsToolExecutions;

      // fail-fast: tools + structured output schema not supported by most models
      // vllm constraint: "model must not generate both text and tool calls in same generation"
      // when tools are plugged, output schema must be z.string() to allow plain text responses
      if (hasTools && !isToolContinuation) {
        const schemaType = jsonSchema.type;
        if (schemaType !== 'string') {
          throw new BadRequestError(
            `when tools are plugged, output schema must be z.string() (found: ${schemaType}). most open-source models support either tool_calls or structured json, but not both. use z.string() and parse the response yourself if structure is needed.`,
            { schemaType, tools: askInput.plugs?.tools?.map((t) => t.slug) },
          );
        }
      }

      // include response_format only when we want structured output
      // fireworks ai constraint: "cannot specify response format and function call at the same time"
      // so we must omit response_format entirely when tools are present (initial OR continuation)
      const wantStructuredOutput = !hasTools;
      const response = await openai.chat.completions.create({
        model: config.model,
        messages,
        ...(hasTools ? { tools, tool_choice: 'auto' as const } : {}),
        ...(wantStructuredOutput
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'response',
                  strict: true,
                  schema: jsonSchema,
                },
              },
            }
          : {}),
      });

      // extract response message
      const message = response.choices[0]?.message;
      const content = message?.content ?? '';
      const toolCalls = message?.tool_calls;

      // calculate elapsed time
      const elapsedMs = Date.now() - startedAt;

      // extract token usage from response
      const tokensInput = response.usage?.prompt_tokens ?? 0;
      const tokensOutput = response.usage?.completion_tokens ?? 0;
      const tokensCached =
        (
          response.usage as {
            prompt_tokens_details?: { cached_tokens?: number };
          }
        )?.prompt_tokens_details?.cached_tokens ?? 0;

      // calculate character counts
      const promptLength = promptIsToolExecutions
        ? JSON.stringify(askInput.prompt).length
        : (askInput.prompt as string).length;
      const charsInput = (systemPrompt?.length ?? 0) + promptLength;
      const charsOutput = content.length;

      // define size for metrics and cost calculation
      const size = {
        tokens: {
          input: tokensInput,
          output: tokensOutput,
          cache: { get: tokensCached, set: 0 },
        },
        chars: {
          input: charsInput,
          output: charsOutput,
          cache: { get: 0, set: 0 },
        },
      };

      // calculate cash costs via rhachet utility
      const { cash } = calcBrainOutputCost({
        for: { tokens: size.tokens },
        with: { cost: { cash: config.spec.cost.cash } },
      });

      // build metrics
      const metrics = new BrainOutputMetrics({
        size,
        cost: {
          time: { milliseconds: elapsedMs },
          cash,
        },
      });

      // handle tool calls if present
      if (toolCalls && toolCalls.length > 0) {
        // brain requested tool invocations
        const invocations: BrainPlugToolInvocation[] = toolCalls.map(
          (toolCall) => castFromFireworksToolCall({ toolCall }),
        );

        // build continuables for tool call exchange
        const { episode, series } = await genBrainContinuables({
          for: { grain: 'atom' },
          on: { episode: askInput.on?.episode ?? null, series: null },
          with: {
            exchange: {
              input: promptIsToolExecutions
                ? JSON.stringify(askInput.prompt)
                : (askInput.prompt as string),
              output: JSON.stringify(toolCalls),
              exid: response.id ?? null,
            },
            episode: { exid: response.id ?? null },
          },
        });

        // note: cast input because TypeScript can't verify conditional types at construction
        return new BrainOutput({
          output: null,
          calls: { tools: invocations },
          metrics,
          episode,
          series,
        } as unknown as BrainOutput<TOutput, 'atom', TPlugs>);
      }

      // parse response content based on schema type
      const output = castContentToOutputSchema({
        content,
        schema: askInput.schema.output,
      });

      // build continuables (episode + series) for this invocation
      const { episode, series } = await genBrainContinuables({
        for: { grain: 'atom' },
        on: { episode: askInput.on?.episode ?? null, series: null },
        with: {
          exchange: {
            input: promptIsToolExecutions
              ? JSON.stringify(askInput.prompt)
              : (askInput.prompt as string),
            output: content,
            exid: response.id ?? null,
          },
          episode: { exid: response.id ?? null },
        },
      });

      // note: cast input because TypeScript can't verify conditional types at construction
      return new BrainOutput({
        output,
        calls: null,
        metrics,
        episode,
        series,
      } as unknown as BrainOutput<TOutput, 'atom', TPlugs>);
    },
  });
};
