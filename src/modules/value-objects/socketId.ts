export class SocketId {
  private constructor(private readonly value: string) {
    if (!value) {
      throw new Error('SocketId is required');
    }
  }

  static from(value: string): SocketId {
    return new SocketId(value);
  }

  equals(other: SocketId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): string {
    return this.value;
  }
}
