// user-query.adapter.ts

import { UserRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { IUserQueryService } from '../interface/IUserQueryService';
import { User } from 'src/modules/users/domain/models/user.model';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UserQueryService implements IUserQueryService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepo: UserRepository,
  ) {}

  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepo.findById(userId);
  }
}
