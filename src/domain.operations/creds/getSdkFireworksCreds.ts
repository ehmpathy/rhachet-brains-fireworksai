import { BadRequestError } from 'helpful-errors';
import { keyrack } from 'rhachet/keyrack';
import type { Empty } from 'type-fns';

import type { ContextBrainSupplierFireworks } from '../atom/genBrainAtom';

/**
 * .what = get fireworks sdk credentials
 * .why = single source of truth for fireworks credential lookup
 *
 * .patterns:
 *   1. keyrack shorthand — auto-discovers FIREWORKS_API_KEY from keyrack
 *   2. explicit getter — custom credential source (vault, kms, db)
 *   3. env fallback — process.env.FIREWORKS_API_KEY
 */
export const getSdkFireworksCreds = async (
  input: Empty,
  context?: ContextBrainSupplierFireworks,
): Promise<{ FIREWORKS_API_KEY: string }> => {
  // extract supplier from context
  const supplier = context?.['brain.supplier.fireworks'];

  // supplier provided: get creds
  if (supplier?.creds) {
    const creds = supplier.creds;

    // keyrack shorthand
    if (typeof creds === 'object' && 'keyrack' in creds) {
      const result = await keyrack.get({
        for: { key: 'FIREWORKS_API_KEY' },
        owner: creds.keyrack.owner,
        env: creds.keyrack.env,
      });

      // handle grant attempt result
      if (result.attempt.status !== 'granted') {
        throw new BadRequestError(
          `FIREWORKS_API_KEY keyrack ${result.attempt.status}`,
          {
            owner: creds.keyrack.owner,
            env: creds.keyrack.env,
            status: result.attempt.status,
            ...(result.attempt.status === 'absent' ||
            result.attempt.status === 'locked'
              ? { message: result.attempt.message, fix: result.attempt.fix }
              : {}),
            ...(result.attempt.status === 'blocked'
              ? { reasons: result.attempt.reasons, fix: result.attempt.fix }
              : {}),
          },
        );
      }
      return { FIREWORKS_API_KEY: result.attempt.grant.key.secret };
    }

    // explicit getter
    if (typeof creds === 'function') {
      const result = await creds();
      return {
        FIREWORKS_API_KEY:
          result?.FIREWORKS_API_KEY ??
          BadRequestError.throw(
            'creds getter returned undefined FIREWORKS_API_KEY',
          ),
      };
    }
  }

  // fallback to env var
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    throw new BadRequestError(
      'FIREWORKS_API_KEY required — provide via context or env',
    );
  }
  return { FIREWORKS_API_KEY: apiKey };
};
