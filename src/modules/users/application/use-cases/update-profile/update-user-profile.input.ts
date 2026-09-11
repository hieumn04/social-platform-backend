import { Gender } from '../../../../../shared/enums/gender.enum';

export class UpdateUserProfileInput {
  constructor(
    public readonly fullName: string,
    public readonly address: string,
    public readonly gender?: Gender,
  ) {}
}
