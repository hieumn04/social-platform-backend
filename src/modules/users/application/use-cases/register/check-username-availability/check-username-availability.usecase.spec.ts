import { UserWriteRepository } from '@/modules/users/domain/repositories/user-write.interface.repository';
import { CheckUsernameAvailabilityUseCase } from './check-username-availability.usecase';

describe('CheckUsernameAvailabilityUseCase', () => {
  const repository = {
    existsByUsername: jest.fn(),
  } as unknown as jest.Mocked<UserWriteRepository>;
  const useCase = new CheckUsernameAvailabilityUseCase(repository);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes and reports an available username', async () => {
    repository.existsByUsername.mockResolvedValue(false);

    await expect(useCase.execute('  Zhou_Ye  ')).resolves.toEqual({
      available: true,
      username: 'zhou_ye',
    });
    expect(repository.existsByUsername).toHaveBeenCalledWith('zhou_ye');
  });

  it('reports an existing username case-insensitively', async () => {
    repository.existsByUsername.mockResolvedValue(true);

    await expect(useCase.execute('ZHOUYE11')).resolves.toMatchObject({
      available: false,
      username: 'zhouye11',
      reason: 'USERNAME_TAKEN',
    });
  });

  it('rejects invalid format without querying persistence', async () => {
    await expect(useCase.execute('bad name')).resolves.toMatchObject({
      available: false,
      reason: 'USERNAME_FORMAT',
    });
    expect(repository.existsByUsername).not.toHaveBeenCalled();
  });
});
