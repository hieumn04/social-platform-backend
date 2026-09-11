import { RoleEntity } from '../typeorm/role.entity';
import { RoleProps } from 'src/types/typeModel/roleProp';
import { RoleModel } from '../../domain/models/role.model';

export class RoleMapper {
  static toDomain(entity: RoleEntity): RoleModel {
    const props: RoleProps = {
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      permissions: entity.permissions || [],
      isSystemRole: entity.isSystemRole,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
    return new RoleModel(entity.id, props);
  }

  static toEntity(domain: RoleModel): RoleEntity {
    const entity = new RoleEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.description = domain.description;
    entity.permissions = domain.permissions;
    entity.isSystemRole = domain.isSystemRole;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
