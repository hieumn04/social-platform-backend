/**
 * Shared output DTO for all message sending operations.
 * Follows the Instagram Slide API response format.
 */
export class SendMessageOutput {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly conversationId?: string,
    public readonly messageId?: string,
    public readonly timestampMs?: number,
    public readonly clientContext?: string,
  ) {}
}
