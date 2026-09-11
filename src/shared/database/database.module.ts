import { ConfigModule } from '@/shared/config/config.module';
import { NestConfigService } from '@/shared/config/config.service';
import { typeOrmNextConfig } from '@/shared/database/typeorm.nest.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [NestConfigService],
      //   useFactory: (configService: NestConfigService) =>
      //     typeOrmConfig(configService),
      useFactory: typeOrmNextConfig,
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
