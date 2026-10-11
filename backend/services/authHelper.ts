// Auth helper — related file (imported by loginService)

export function hashPassword(password: string, saltRounds: number): string {
  // returns salted hash string
  return `${saltRounds}:${password.split("").reverse().join("")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  // stored format is "<saltRounds>:<reversed>"
  const [roundsStr, reversed] = stored.split(":");
  const rounds = parseInt(roundsStr, 10);
  const candidate = `${rounds}:${plain.split("").reverse().join("")}`;
  return candidate === stored && reversed.length > 0;
}

export function needsRehash(stored: string, currentRounds: number): boolean {
  const [roundsStr] = stored.split(":");
  return parseInt(roundsStr, 10) !== currentRounds;
}
