import { UserAgentResult } from 'src/types/express';

export class UserAgent {
  private readonly props: UserAgentResult;

  private constructor(props: UserAgentResult) {
    this.validate(props);

    this.props = {
      ...props,
      deviceType: props.deviceType ?? 'unknown',
      version: props.version ?? '0.0.0',
    };
  }

  get platform(): string {
    return this.props.platform;
  }
  get os(): string {
    return this.props.os;
  }
  get browser(): string {
    return this.props.browser;
  }
  get version(): string {
    return this.props.version;
  }
  get rawUserAgent(): string {
    return this.props.rawUserAgent;
  }
  get deviceType(): string | undefined {
    return this.props.deviceType;
  }

  equals(other: UserAgent): boolean {
    return JSON.stringify(this.toObject()) === JSON.stringify(other.toObject());
  }

  toObject(): UserAgentResult {
    return { ...this.props };
  }

  static create(props: UserAgentResult | null | undefined): UserAgent {
    if (!props) {
      throw new Error('UserAgentResult must not be null or undefined');
    }
    return new UserAgent(props);
  }

  private validate(props: UserAgentResult): void {
    if (!props.browser) throw new Error('UserAgent: browser is required');
    if (!props.rawUserAgent)
      throw new Error('UserAgent: rawUserAgent is required');
    if (props.rawUserAgent.length > 500)
      throw new Error('UserAgent: rawUserAgent is too long');
    if (!props.platform) throw new Error('UserAgent: platform is required');
    if (!props.os) throw new Error('UserAgent: os is required');

    const allowedDeviceTypes = [
      'Mobile',
      'Desktop',
      'Tablet',
      'Bot',
      'Unknown',
    ];
    if (props.deviceType && !allowedDeviceTypes.includes(props.deviceType)) {
      console.warn(
        `UserAgent: deviceType "${props.deviceType}" is invalid, defaulting to 'Unknown'`,
      );
    }

    if (props.version && !/^\d+(\.\d+)*$/.test(props.version)) {
      console.warn(
        `UserAgent: version "${props.version}" is invalid, defaulting to '0.0.0'`,
      );
    }
  }
}
