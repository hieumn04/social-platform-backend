/* =========================================================
   UUIDv4 <-> BigInt Utility (Production Ready)
   - Sinh UUIDv4 chuẩn RFC 4122 (sử dụng uuid package)
   - Convert sang BigInt numeric
   - Convert ngược BigInt -> UUID
========================================================= */

import { v4 as uuidv4 } from 'uuid';

/* =========================
   Generate UUIDv4 and BigInt
========================= */
export function generateUuidV4(): string {
  // UUID chuẩn v4, dạng string: '550e8400-e29b-41d4-a716-446655440000'
  return uuidv4();
}

/**
 * Convert UUID string -> BigInt
 * Example: '550e8400-e29b-41d4-a716-446655440000' -> BigInt
 */
export function uuidToBigInt(uuid: string): bigint {
  // xóa '-' và parse hex
  const hex = uuid.replace(/-/g, '');
  return BigInt('0x' + hex);
}

export function generateBigIntFromUuid(): bigint {
  const uuid = uuidv4(); // tự tạo UUIDv4
  const hex = uuid.replace(/-/g, '');
  return BigInt('0x' + hex);
}

export function generateBigIntFromUuidWithRaw(): {
  id: bigint;
  uuid: string;
} {
  const uuid = uuidv4();
  const hex = uuid.replace(/-/g, '');

  return {
    id: BigInt('0x' + hex),
    uuid,
  };
}

/**
 * Convert BigInt -> UUID string
 * Example: BigInt -> '550e8400-e29b-41d4-a716-446655440000'
 */
export function bigIntToUuid(value: bigint): string {
  // Chuyển BigInt -> hex string, pad đủ 32 chars
  let hex = value.toString(16).padStart(32, '0');

  // Chèn dấu '-' chuẩn UUID v4
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/* =========================
   Generate conversationId numeric
========================= */
/**
 * Sinh ID numeric BigInt từ UUIDv4
 * Dùng cho conversation.id
 */
export function generateConversationId(): bigint {
  const uuid = generateUuidV4();
  return uuidToBigInt(uuid);
}

/* =========================
   Example Usage
========================= */
if (require.main === module) {
  const uuid = generateUuidV4();
  console.log('UUIDv4:', uuid);

  const numeric = uuidToBigInt(uuid);
  console.log('BigInt ID:', numeric.toString());

  const backToUuid = bigIntToUuid(numeric);
  console.log('Back to UUID:', backToUuid);

  console.log('generateConversationId():', generateConversationId().toString());
}
