export interface ThreadIdHasher {
  hash(value: string): string;
}

export const THREAD_ID_HASHER = Symbol('ThreadIdHasher');
