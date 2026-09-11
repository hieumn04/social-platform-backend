import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { RoleEntity } from '../typeorm/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), LoggerModule],
  // providers: [
  //   {
  //     provide: 'UserRepository',
  //     useClass: UserEntityRepositoryImpl,
  //   },
  // ],
  exports: [TypeOrmModule],
})
export class RolePersistenceModule {}
