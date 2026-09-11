import { SearchRecipientsUseCase } from '@/modules/recipient-search/application/usecases/search-recipients.usecase';
import { UnauthorizedException } from '@nestjs/common';
import { RecipientSearchController } from './recipient-search.controller';

describe('RecipientSearchController', () => {
  const execute = jest.fn();
  const controller = new RecipientSearchController({
    execute,
  } as unknown as SearchRecipientsUseCase);

  beforeEach(() => jest.clearAllMocks());

  it('takes viewer identity from JWT context', async () => {
    execute.mockResolvedValue({ query: 'zh', ranked_recipients: [] });

    await controller.search({ query: 'zh', limit: 20 }, {
      user: { sub: 'viewer-1' },
    } as never);

    expect(execute).toHaveBeenCalledWith('viewer-1', 'zh', 20);
  });

  it('rejects missing authenticated viewer', async () => {
    await expect(
      controller.search({ query: 'zh', limit: 20 }, { user: null } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(execute).not.toHaveBeenCalled();
  });
});
