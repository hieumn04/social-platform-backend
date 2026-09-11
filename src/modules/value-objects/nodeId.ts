import { v4 as uuidv4 } from 'uuid';

export class NodeId {
  private constructor(private readonly value: string) {
    if (!value) {
      throw new Error('NodeId is required');
    }
  }

  static generate(): NodeId {
    return new NodeId(uuidv4());
  }

  static from(value: string): NodeId {
    return new NodeId(value);
  }

  equals(other: NodeId): boolean {
    return this.value === other.value;
  }

  getValue(): string {
    return this.value;
  }
}
