import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantService } from 'src/tenants/services/tenant.service';

@Injectable()
export class TenantsMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const rawHost = req.headers.host;
    const hostname = rawHost?.includes(':') ? rawHost.split(':')[0] : rawHost;

    if (!hostname || !hostname.includes('.')) {
      return res.status(400).json({ message: 'Missing subdomain' });
    }

    const subdomain = hostname.split('.')[0];

    const tenant = await this.tenantService.findBySlug(subdomain);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    req.tenant = tenant;
    next();
  }
}
