export const UPDATE_INBOX_ORDER_LUA = `
local pinned_key = KEYS[1]
local normal_key = KEYS[2]
local thread_id  = ARGV[1]
local score      = ARGV[2]

local is_pinned = redis.call('ZSCORE', pinned_key, thread_id)

if is_pinned then
    redis.call('ZREM', normal_key, thread_id)
    return redis.call('ZADD', pinned_key, score, thread_id)
else
    redis.call('ZREM', pinned_key, thread_id)
    return redis.call('ZADD', normal_key, score, thread_id)
end
`;
