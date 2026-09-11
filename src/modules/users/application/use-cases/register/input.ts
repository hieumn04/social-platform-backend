export class RegisterInput {
  constructor(
    public readonly name: string,
    public readonly fullname: string,
    public readonly email: string,
    public readonly password: string,
    public readonly address: string,
    public readonly phoneNumber: string,
    public readonly gender?: string,
    public readonly role?: string,
  ) {}
}
