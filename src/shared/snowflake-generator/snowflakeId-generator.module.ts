import { ConfigModule } from '@/shared/config/config.module';
import { SnowflakeIdGenerator } from '@/shared/snowflake-generator/snowflakeId-generator';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule],
  providers: [SnowflakeIdGenerator],
  exports: [SnowflakeIdGenerator],
})
export class SnowflakeIdModule {}
