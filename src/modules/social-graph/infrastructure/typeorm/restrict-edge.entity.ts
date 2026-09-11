import { Entity, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('restrict_edge')
@Index('idx_restrict_restrictor', ['restrictorId'])
@Index('idx_restrict_restricted', ['restrictedId'])
export class RestrictEdgeEntity {
  @PrimaryColumn({
    type: 'bigint',
    name: 'restrictor_id',
  })
  restrictorId!: string;

  @PrimaryColumn({
    type: 'bigint',
    name: 'restricted_id',
  })
  restrictedId!: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
