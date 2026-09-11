import { CreateUserCommand } from '@/types/typeModel/userProp';

export class CreateNewUserInput {
  constructor(public readonly userProps: CreateUserCommand) {}
}
