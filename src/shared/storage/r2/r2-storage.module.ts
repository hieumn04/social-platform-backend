import { Global, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigModule } from '@/shared/config/config.module';
import { r2Config } from '@/shared/config/r2.config';
import { R2_S3_CLIENT } from './r2.constants';
import { R2StorageService } from './r2-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: R2_S3_CLIENT,
      inject: [r2Config.KEY],
      useFactory: (config: ConfigType<typeof r2Config>): S3Client =>
        new S3Client({
          region: 'auto',
          endpoint: config.endpoint,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
          maxAttempts: 3,
        }),
    },
    R2StorageService,
  ],
  exports: [R2StorageService],
})
export class R2StorageModule {}
