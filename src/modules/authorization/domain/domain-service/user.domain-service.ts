import { CreateUserParamsStrict } from 'src/types/typeModel/userProp';
import { User } from '../models/role.model';
import { UserRepository } from '../repositories/user.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UserDomainService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepo: UserRepository,
  ) {}
  canUpdateProfile(user: User): boolean {
    return user.isActive && !user.isDeleted;
  }

  async createUser(
    userId: string,
    props: CreateUserParamsStrict,
  ): Promise<void> {
    const user = User.createNew(userId, props);
    await this.userRepo.save(user);
  }
}
