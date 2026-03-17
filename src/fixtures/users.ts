import * as dotenv from 'dotenv';
dotenv.config();

export type UserRole =
  | 'standard'
  | 'locked_out'
  | 'problem'
  | 'performance_glitch'
  | 'error';

export interface User {
  username: string;
  password: string;
  role: UserRole;
  description: string;
}

const PASSWORD = process.env.PASSWORD ?? (() => { throw new Error('PASSWORD env var not set'); })();

const userMap: Record<UserRole, () => User> = {
  standard: () => ({
    username: process.env.STANDARD_USER ?? (() => { throw new Error('STANDARD_USER env var not set'); })(),
    password: PASSWORD,
    role: 'standard',
    description: 'Normal user with full access',
  }),
  locked_out: () => ({
    username: process.env.LOCKED_OUT_USER ?? (() => { throw new Error('LOCKED_OUT_USER env var not set'); })(),
    password: PASSWORD,
    role: 'locked_out',
    description: 'User that is locked out of the application',
  }),
  problem: () => ({
    username: process.env.PROBLEM_USER ?? (() => { throw new Error('PROBLEM_USER env var not set'); })(),
    password: PASSWORD,
    role: 'problem',
    description: 'User that experiences UI glitches',
  }),
  performance_glitch: () => ({
    username: process.env.PERFORMANCE_GLITCH_USER ?? (() => { throw new Error('PERFORMANCE_GLITCH_USER env var not set'); })(),
    password: PASSWORD,
    role: 'performance_glitch',
    description: 'User that experiences slow responses',
  }),
  error: () => ({
    username: process.env.ERROR_USER ?? (() => { throw new Error('ERROR_USER env var not set'); })(),
    password: PASSWORD,
    role: 'error',
    description: 'User that experiences errors on actions',
  }),
};

/**
 * Returns a User object for the given role. All values are sourced
 * exclusively from environment variables, no hardcoding anywhere.
 */
export function getUser(role: UserRole): User {
  const factory = userMap[role];
  if (!factory) {
    throw new Error(`Unknown user role: "${role}"`);
  }
  return factory();
}

/** Convenience shorthand for the standard (happy-path) user. */
export const standardUser = () => getUser('standard');
