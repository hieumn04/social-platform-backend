import { EntityManager } from 'typeorm';
import { Email } from 'src/modules/value-objects/email';
import { Role } from 'src/modules/authorization/domain/models/role.model';
import { Admin } from '../models/admin.model';

export interface AdminRepository {
  // ===== Query methods =====
  findById(adminId: string): Promise<Admin | null>;
  findByEmail(email: Email): Promise<Admin | null>;
  findAll(): Promise<Admin[]>;
  findByRole(role: Role): Promise<Admin[]>;

  // ===== Existence checks =====
  existsById(adminId: string): Promise<boolean>;
  existsByEmail(email: Email): Promise<boolean>;

  // ===== Persistence methods =====
  save(admin: Admin, manager?: EntityManager): Promise<void>;
  insert(admin: Admin, manager?: EntityManager): Promise<void>;
  update(admin: Admin, manager?: EntityManager): Promise<void>;

  // ===== State control =====
  activate(adminId: string, manager?: EntityManager): Promise<void>;
  deactivate(adminId: string, manager?: EntityManager): Promise<void>;

  // ===== Deletion =====
  softDelete(adminId: string, manager?: EntityManager): Promise<void>;
  hardDelete(adminId: string, manager?: EntityManager): Promise<void>;
}
