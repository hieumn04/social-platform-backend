import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenRepositoryImpl } from './RefreshTokenEntity.repository';
import { RefreshTokenEntity } from '../typeorm/refreshTokens.Entity';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [
    {
      provide: 'RefreshTokenRepository',
      useClass: RefreshTokenRepositoryImpl,
    },
  ],
  exports: ['RefreshTokenRepository', TypeOrmModule],
})
export class RefreshPersistenceModule {}
