import bcrypt from 'bcrypt';

export class Password {
  private constructor(private readonly hashed: string) {}

  public getValue(): string {
    return this.hashed;
  }

  public static async create(raw: string): Promise<Password> {
    if (!this.isValid(raw)) {
      throw new Error('Password does not meet security requirements');
    }

    const hash = await bcrypt.hash(raw, 12);
    return new Password(hash);
  }

  public static fromHash(hashed: string): Password {
    if (!/^\$2[aby]\$/.test(hashed)) {
      throw new Error('Invalid bcrypt hash format');
    }
    return new Password(hashed);
  }

  private static isValid(password: string): boolean {
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  public static async compare(
    input: string,
    storedHash?: string,
  ): Promise<boolean> {
    if (!storedHash) return false;
    try {
      return await bcrypt.compare(input, storedHash);
    } catch (err: unknown) {
      throw new Error(`Error comparing password: ${(err as Error).message}`);
    }
  }
}
