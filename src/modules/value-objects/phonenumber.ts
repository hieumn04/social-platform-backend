export class PhoneNumber {
  private constructor(private readonly value: string) {}

  public static createForLogin(phoneNumber?: string): PhoneNumber {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    if (!/^\d{9,15}$/.test(phoneNumber)) {
      throw new Error('Phone number is invalid');
    }

    return new PhoneNumber(phoneNumber);
  }

  public static create(phoneNumber?: string): PhoneNumber {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const normalized = this.normalizeAndValidate(
      phoneNumber,
      'Phone number is invalid',
    );
    return new PhoneNumber(normalized);
  }

  public static fromPersistence(phoneNumber: string): PhoneNumber {
    const normalized = this.normalizeAndValidate(
      phoneNumber,
      'Phone number invalid on persistence',
    );
    return new PhoneNumber(normalized);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.getValue();
  }

  private static normalizeAndValidate(
    phoneNumber: string,
    errorMessage: string,
  ): string {
    const normalized = phoneNumber.replace(/\D/g, '');
    if (!/^\d{9,15}$/.test(normalized)) {
      throw new Error(errorMessage);
    }
    return normalized;
  }
}
