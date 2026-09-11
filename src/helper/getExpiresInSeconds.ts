export function getExpiresInSeconds(exp: string | number): number {
  if (typeof exp === 'number') return exp;

  const match = /^(\d+)(s|m|h|d)$/i.exec(exp.trim());
  if (!match) {
    throw new Error(
      `Invalid expiresIn format: "${exp}". Valid examples: 30s, 10m, 24h, 365d`,
    );
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * multipliers[unit];
}
