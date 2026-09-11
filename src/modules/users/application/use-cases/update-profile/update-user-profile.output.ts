import { Gender } from '../../../../../shared/enums/gender.enum';

export class UpdateUserProfileOutput {
  constructor(
    public readonly fullName: string,
    public readonly address: string,
    public readonly updatedAt: Date,
    public readonly gender?: Gender,
  ) {}
}
