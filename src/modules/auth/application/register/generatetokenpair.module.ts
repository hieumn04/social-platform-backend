import { Module } from '@nestjs/common';
import { TokenModule } from '../../infrastructure/service/token.module';
import { GenarateTokenPairUseCase } from './genaratetokenpair.use-case';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  imports: [TokenModule, LoggerModule],
  providers: [GenarateTokenPairUseCase],
  exports: [GenarateTokenPairUseCase],
})
export class GenerateTokenPairModule {}
