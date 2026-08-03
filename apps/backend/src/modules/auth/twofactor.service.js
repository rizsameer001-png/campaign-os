import { authenticator } from 'otplib';

/** AUTH-A-003: TOTP secret generation for authenticator-app based 2FA. */
export function generateTotpSecret(email) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, 'Election Campaign OS', secret);
  return { secret, otpauthUrl };
}

export function verifyTotpCode(secret, token) {
  return authenticator.verify({ token, secret });
}
