// PLACEHOLDER DATA — no real OTP is sent. Any 6-digit code except the
// designated "wrong code" below resolves as success, purely for demo flow.

export const MOCK_CORRECT_OTP = '482913';
export const MOCK_INCORRECT_OTP_DEMO = '000000'; // typing this simulates a failed verification
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(name.length - 1, 3))}@${domain}`;
}
