import { Inject, Injectable } from '@nestjs/common';
import { IUserQueryService } from 'src/modules/users/application/port/interface/IUserQueryService';
import { User } from 'src/modules/users/domain/models/user.model';

@Injectable()
export class IUserQueryAdapter implements IUserQueryService {
  constructor(
    @Inject('IUserQueryService')
    private readonly userQueryService: IUserQueryService,
  ) {}
  async getUserById(userId: string): Promise<User | null> {
    return await this.userQueryService.getUserById(userId);
  }

  async existUserById(userId: string): Promise<boolean> {
    return await this.userQueryService.existUserById(userId);
  }
}
