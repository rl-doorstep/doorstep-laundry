/** Hours until email verification links expire. */
export const EMAIL_VERIFY_EXPIRY_HOURS = 48;

export function buildVerifyEmailUrl(baseUrl: string, token: string): string {
  const u = baseUrl.replace(/\/$/, "");
  return `${u}/verify-email?token=${encodeURIComponent(token)}`;
}

export function verificationEmailContent(verifyUrl: string) {
  const h = EMAIL_VERIFY_EXPIRY_HOURS;
  return {
    subject: "Verify your email – Doorstep Laundry",
    text: `Thanks for signing up. Click the link below to verify your email (valid for ${h} hours):\n\n${verifyUrl}\n\nIf you didn't create an account, you can ignore this email.`,
  };
}
