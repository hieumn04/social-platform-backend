import { Email } from 'src/modules/value-objects/email';
import { Password } from 'src/modules/value-objects/password';
import { AdminProps } from 'src/types/typeModel/admin';
import { AdminEntity } from '../typeorm/admin.entity';
import { Admin } from '../../domain/models/admin.model';

export class AdminMapper {
  static toDomain(entity: AdminEntity): Admin {
    if (!entity) {
      throw new Error('Cannot map null or undefined AdminEntity to domain');
    }

    const props: AdminProps = {
      name: entity.name,
      email: Email.create(entity.email ?? ''),
      passwordHash: Password.fromHash(entity.passwordHash ?? ''),
      role: entity.role,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isActive: entity.isActive,
    };

    return new Admin(entity.id, props);
  }

  static toEntity(domain: Admin): AdminEntity {
    if (!domain) {
      throw new Error('Cannot map null or undefined Admin domain to entity');
    }

    const entity = new AdminEntity();
    entity.id = domain.adminId;
    entity.name = domain.name;
    entity.email = domain.emailValue;
    entity.passwordHash = domain.passwordHash
      ? domain.passwordHash.getValue()
      : null;
    entity.role = domain.role;
    entity.isActive = domain.isActive;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    return entity;
  }
}
