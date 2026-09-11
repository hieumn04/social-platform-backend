export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSenderPort {
  sendMail(params: SendMailParams): Promise<void>;
}
