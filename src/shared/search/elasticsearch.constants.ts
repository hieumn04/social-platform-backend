export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');

export class ElasticsearchIndexKeys {
  static userDirectoryPhysical(base: string, version: number): string {
    return `${base}_v${version}`;
  }

  static userDirectoryReadAlias(base: string): string {
    return `${base}_read`;
  }

  static userDirectoryWriteAlias(base: string): string {
    return `${base}_write`;
  }
}
