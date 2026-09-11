// import { toBigInt } from '@/helpers/helper';

function toBigInt(id: string | number | bigint): bigint {
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  if (typeof id === 'string') return BigInt(id);
  throw new Error('Invalid ID type');
}
/* =========================
   Thread Types (ONLY for thread_key)
========================= */
export const ThreadType = {
  KEY: 1n, // DM route
  GROUP: 2n, // room / group
  PAGE: 3n,
} as const;

export type ThreadType = (typeof ThreadType)[keyof typeof ThreadType];

/* =========================
   Constants (64-bit layout)
========================= */
const TYPE_SHIFT = 56n;
const BASE_MASK = (1n << 56n) - 1n;
const SECRET = 0x9e3779b97f4a7c15n; // golden ratio XOR secret

/* =========================
   THREAD KEY (deterministic)
========================= */

/**
 * Dùng cho route FE: /direct/t/{thread_key}
 * - Thread_key 1-1 cho user
 * - Deterministic
 * - FE route luôn ổn
 */
export function getThreadKeyFromUser(userId: string | number | bigint): bigint {
  const baseId = buildBaseId(toBigInt(userId));
  return encode(ThreadType.KEY, baseId);
}

/**
 * Thread_key cho group / page
 */
export function getThreadKeyFromRoom(roomId: string | number | bigint): bigint {
  const baseId = buildBaseId(toBigInt(roomId));
  return encode(ThreadType.GROUP, baseId);
}

/* =========================
   Core Encode / Decode
========================= */
function encode(type: ThreadType, baseId: bigint): bigint {
  return (type << TYPE_SHIFT) | (baseId & BASE_MASK);
}

export function decodeThreadKey(id: bigint) {
  const type = id >> TYPE_SHIFT;
  const baseId = id & BASE_MASK;
  return {
    type,
    baseId,
    typeName: getTypeName(type),
  };
}

/* =========================
   Base ID (deterministic + pseudo-random)
========================= */
function buildBaseId(id: bigint): bigint {
  // Xáo trộn nhẹ bằng PRIME_64 và secret
  return (id * SECRET) & BASE_MASK;
}

/* =========================
   Type Helpers
========================= */
export function getTypeName(type: bigint): string {
  switch (type) {
    case ThreadType.KEY:
      return 'THREAD_KEY';
    case ThreadType.GROUP:
      return 'GROUP';
    case ThreadType.PAGE:
      return 'PAGE';
    default:
      return 'UNKNOWN';
  }
}

export function isThreadKey(id: bigint): boolean {
  return id >> TYPE_SHIFT === ThreadType.KEY;
}

if (require.main === module) {
  const ids = [
    '297542249485438976',
    297542608165539840n,
    '297542608165539840',
    123456789,
  ];

  console.log('--- ThreadKey Test ---');
  for (const id of ids) {
    const key = getThreadKeyFromUser(id);
    const decoded = decodeThreadKey(key);
    console.log(`userId=${id} -> threadKey=${key}`);
    console.log('Decoded:', decoded);
  }

  const roomId = '987654321098765432';
  const roomKey = getThreadKeyFromRoom(roomId);
  console.log(`roomId=${roomId} -> threadKey=${roomKey}`);
  console.log('Decoded room:', decodeThreadKey(roomKey));
}
