import { DataSource } from 'typeorm';

import { RoleEntity } from 'src/modules/authorization/infrastructure/typeorm/role.entity';
import { chatRoomRoleData, roleData } from '../data/roles.data';
import { RoleMapper } from 'src/modules/authorization/infrastructure/mapper/role.mapper';
import { RoleModel } from 'src/modules/authorization/domain/models/role.model';

// export async function seedUsers(dataSource: DataSource) {
//   const userRepo = dataSource.getRepository(UserEntity);
//   const entities = userData.map(userEntityFactory);

//   await userRepo.insert(entities);
//   console.log(`Seeded ${entities.length} users`);
// }

export async function seedRole(dataSource: DataSource) {
  const roleRepo = dataSource.getRepository(RoleEntity);

  const combinedRoleData = [...roleData, ...chatRoomRoleData];
  const entities = combinedRoleData.map((data) => {
    const domain = RoleModel.createNew(data.id, data);
    return RoleMapper.toEntity(domain);
  });

  await roleRepo
    .createQueryBuilder()
    .insert()
    .into(RoleEntity)
    .values(entities)
    .orIgnore()
    .execute();

  console.log(`Seeded ${entities.length} roles`);
}
