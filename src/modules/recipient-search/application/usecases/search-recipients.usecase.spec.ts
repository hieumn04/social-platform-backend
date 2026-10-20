import { IRecipientSearchRepository } from '@/modules/recipient-search/domain/repositories/recipient-search.repository';
import { BadRequestException } from '@nestjs/common';
import { SearchRecipientsUseCase } from './search-recipients.usecase';

describe('SearchRecipientsUseCase', () => {
  let repository: jest.Mocked<IRecipientSearchRepository>;
  let useCase: SearchRecipientsUseCase;

  beforeEach(() => {
    repository = { search: jest.fn() };
    useCase = new SearchRecipientsUseCase(repository);
  });

  it('normalizes input and maps lightweight recipient results', async () => {
    repository.search.mockResolvedValue([
      {
        id: '20',
        username: 'zhouye11',
        fullName: 'Zhou Ye',
        profilePicUrl: null,
        isVerified: true,
        threadFbid: 'thread-20',
      },
      {
        id: '30',
        username: 'yeahzhoou',
        fullName: 'Zhou Ye',
        profilePicUrl: 'https://cdn.example/avatar.jpg',
        isVerified: false,
        threadFbid: null,
      },
    ]);

    await expect(useCase.execute('10', '  ZHOU  ', 10)).resolves.toEqual({
      query: 'zhou',
      ranked_recipients: [
        {
          id: '20',
          username: 'zhouye11',
          full_name: 'Zhou Ye',
          profile_pic_url: null,
          is_verified: true,
          has_existing_thread: true,
          thread_fbid: 'thread-20',
        },
        {
          id: '30',
          username: 'yeahzhoou',
          full_name: 'Zhou Ye',
          profile_pic_url: 'https://cdn.example/avatar.jpg',
          is_verified: false,
          has_existing_thread: false,
          thread_fbid: null,
        },
      ],
    });
    expect(repository.search).toHaveBeenCalledWith('10', 'zhou', 10);
  });

  it('accepts a one-character query', async () => {
    repository.search.mockResolvedValue([]);

    await expect(useCase.execute('10', ' Z ')).resolves.toEqual({
      query: 'z',
      ranked_recipients: [],
    });
    expect(repository.search).toHaveBeenCalledWith('10', 'z', 10);
  });

  it.each(['', '   ', 'a'.repeat(51)])(
    'rejects invalid query %p before persistence',
    async (query) => {
      await expect(useCase.execute('10', query)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.search).not.toHaveBeenCalled();
    },
  );

  it.each([0, 1.5, 11])('rejects invalid limit %p', async (limit) => {
    await expect(useCase.execute('10', 'zh', limit)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.search).not.toHaveBeenCalled();
  });
});
