import { UserRepository } from '../../../domain/repositories/user-write.interface.repository';
import { RegisterInput } from './input';
import { RegisterOutput } from './output';

export class RegisterWithOtpUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  // async execute(input: RegisterInput): Promise<RegisterOutput> {
  //   const existed = await this.userRepo.existsByEmail(input.email);
  //   if (existed) throw new Error('Email already registered');
  // }
}
