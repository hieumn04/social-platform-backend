export class CreateNewUserOutput {
  constructor(
    public readonly message: string,
    public readonly success: boolean,
    public readonly userId?: string,
  ) {}
}
