export enum StatusRegister {
  PHONE = 'phone',
  EMAIL = 'email',
  BOTH = 'both',
}

export enum Method {
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
  CHANGE_EMAIL = 'change-email',
  CHANGE_PHONENUMBER = 'change-phone-number',
  LOGIN_OTP = 'login-otp',
  VERIFY_DEVICE = 'verify-device',
  VERIFY_2FA = 'verify-2fa',
  UNLOCK_ACCOUNT = 'unlock-account',
  LOGIN = 'login',
  REFRESH = 'refresh',
  EXPIREDREFRESH = 'expired-refresh',
}

export enum Status {
  SENT = 'sent',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}
