import { UserVerificationLogProps } from 'src/types/typeModel/userVerificationLog.props';
import { UserVerificationLog } from '../../domain/models/user_verifications';
import { UserVerificationLogsEntity } from '../typeorm/userVerificationLogs.entity';
import { UUID } from 'crypto';

export class UserVerificationLogMapper {
  static toDomain(entity: UserVerificationLogsEntity): UserVerificationLog {
    const props: UserVerificationLogProps = {
      userId: entity.userId,
      ipAddress: entity.ipAddress ?? undefined,
      deviceId: entity.deviceId ?? undefined,
      userAgent: entity.userAgent ?? undefined,
      type: entity.type,
      purpose: entity.purpose,
      status: entity.status,
      target: entity.target,
      tokenSentAt: entity.tokenSentAt ?? null,
      createdAt: entity.createdAt,
      verifiedAt: entity.verifiedAt ?? null,
      expiresAt: entity.expiresAt ?? null,
      attemptCount: entity.attemptCount,
    };

    return new UserVerificationLog(entity.id, props);
  }

  static toPersistence(
    domain: UserVerificationLog,
  ): UserVerificationLogsEntity {
    const entity = new UserVerificationLogsEntity();
    const props = domain.props;
    entity.id = domain.id as UUID;
    entity.userId = props.userId;
    entity.ipAddress = props.ipAddress ?? null;
    entity.deviceId = props.deviceId ?? null;
    entity.userAgent = props.userAgent ?? null;
    entity.type = props.type;
    entity.purpose = props.purpose;
    entity.status = props.status;
    entity.target = props.target;
    entity.tokenSentAt = props.tokenSentAt ?? null;
    entity.createdAt = props.createdAt;
    entity.verifiedAt = props.verifiedAt ?? null;
    entity.expiresAt = props.expiresAt ?? null;
    entity.attemptCount = props.attemptCount;

    return entity;
  }
}
