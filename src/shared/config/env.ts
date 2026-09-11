export const ENVIRONMENTS = ['development', 'production', 'test'] as const;

export type NodeEnv = (typeof ENVIRONMENTS)[number];

export function parseNodeEnv(env?: string): NodeEnv {
  return ENVIRONMENTS.includes(env as NodeEnv)
    ? (env as NodeEnv)
    : 'development';
}
