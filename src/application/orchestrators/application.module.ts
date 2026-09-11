import { Module } from '@nestjs/common';
import { LoginController } from './controllers/login.controllers';

import { TestDeviceController } from './controllers/testdevice.controllers';
import { DeviceController } from './controllers/device.controllers';
import { RequestContextController } from './controllers/requestContext.controller';
import { RequestContextModule } from 'src/shared/context/request-context-service.module';
import { LoginUserModule } from './usecases/loginuserorchestrator/LoginUserModule';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { RevokeTokenModule } from 'src/modules/auth/application/use-cases/revoke/revoke-refresh-token.module';
import { RefreshTokenModule } from 'src/modules/auth/application/use-cases/refresh/refresh-token.module';
import { GenerateTokenPairModule } from 'src/modules/auth/application/register/generatetokenpair.module';
import { CsrfGuardsModule } from '@/modules/auth/guards/csrf-guards.module';

@Module({
  imports: [
    LoginUserModule,
    RequestContextModule,
    RefreshTokenModule,
    LoggerModule,
    CsrfGuardsModule,
    RevokeTokenModule,
    RefreshTokenModule,
    GenerateTokenPairModule,
  ],

  controllers: [
    LoginController,
    TestDeviceController,
    DeviceController,
    RequestContextController,
  ],
})
export class OrchestratorsModule {}
