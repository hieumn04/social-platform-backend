import { validate } from 'class-validator';
import { PersistedGraphqlDto } from './persisted-graphql.dto';

function request(
  variables?: unknown,
  includeVariables = true,
): PersistedGraphqlDto {
  const dto = new PersistedGraphqlDto();
  dto.doc_id = '30000000000000001';

  if (includeVariables) {
    dto.variables = variables as Record<string, unknown>;
  }

  return dto;
}

describe('PersistedGraphqlDto', () => {
  it('accepts an empty variables object for operations without variables', async () => {
    await expect(validate(request({}))).resolves.toEqual([]);
  });

  it('accepts an omitted variables field and uses an empty object', async () => {
    const dto = request(undefined, false);

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.variables).toEqual({});
  });

  it.each(['invalid', [], 1, null])(
    'rejects non-object variables: %p',
    async (value) => {
      const errors = await validate(request(value));

      expect(errors.some((error) => error.property === 'variables')).toBe(true);
    },
  );
});
