import { ValidationPipe } from '@nestjs/common';

export const GlobalValidatePipe = new ValidationPipe({
  whitelist: true,
  forbidUnknownValues: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
