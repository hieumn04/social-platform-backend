import { InboxFolder } from '@/shared/enums/roomStatus.enum';

export class InputModeMapper {
  static fromFolder(folder: InboxFolder): number {
    switch (folder) {
      case InboxFolder.PRIMARY:
        return 0;

      case InboxFolder.REQUESTS:
      case InboxFolder.HIDDEN:
      case InboxFolder.SPAM:
        return 1;

      default:
        return 0;
    }
  }
}
