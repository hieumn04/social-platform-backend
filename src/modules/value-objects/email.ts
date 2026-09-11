export class Email {
  private constructor(private readonly value: string) {}

  public static create(email?: string): Email {
    if (!email) {
      throw new Error('Email is required');
    }

    if (!this.validate(email)) {
      throw new Error('Email không hợp lệ');
    }

    if (this.isBlacklisted(email)) {
      throw new Error('Email thuộc danh sách đen');
    }

    return new Email(email);
  }

  public static fromPersistence(email: string): Email {
    if (!this.validate(email)) {
      throw new Error('Email invalid on persistence');
    }
    return new Email(email.toLowerCase());
  }

  private static validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isBlacklisted(email: string): boolean {
    const blacklistedDomains = [
      'tempmail.com',
      '10minutemail.com',
      'trashmail.net',
    ];
    const domain = email.split('@')[1];
    return blacklistedDomains.includes(domain);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.getValue();
  }
}
