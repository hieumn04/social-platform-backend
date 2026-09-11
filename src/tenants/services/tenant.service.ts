import { Injectable } from '@nestjs/common';
import { Tenant } from '../tenants.interface';

@Injectable()
export class TenantService {
  private tenants: Tenant[] = [
    { slug: 'abc', name: 'Company 111' },
    { slug: 'xyz', name: 'Company 222' },
  ];

  async findBySlug(slug: string): Promise<Tenant | undefined> {
    return this.tenants.find((t) => t.slug === slug);
  }
}
