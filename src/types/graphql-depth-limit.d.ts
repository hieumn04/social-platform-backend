declare module 'graphql-depth-limit' {
  import type { ValidationRule } from 'graphql';

  function depthLimit(maxDepth: number): ValidationRule;

  export = depthLimit;
}
