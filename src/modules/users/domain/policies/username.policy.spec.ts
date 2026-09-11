import { normalizeUsername, validateUsername } from './username.policy';

describe('username policy', () => {
  it('normalizes username casing and surrounding whitespace', () => {
    expect(normalizeUsername('  ZhouYe_11  ')).toBe('zhouye_11');
  });

  it.each(['zhouye11', 'zhou.ye', 'zhou_ye'])('accepts %s', (username) => {
    expect(validateUsername(username)).toBeNull();
  });

  it.each(['', 'ab', 'a'.repeat(31), 'bad name', '.zhou', 'zhou.', 'zhou..ye'])(
    'rejects %p',
    (username) => {
      expect(validateUsername(username)).not.toBeNull();
    },
  );
});
