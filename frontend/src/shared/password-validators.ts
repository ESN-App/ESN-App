// Mirrors the backend's ASP.NET Identity password policy (min length 8, requires a digit and an
// uppercase letter) so the requirement is validated and explained in one place, not discovered
// only after a round trip to the server.
export function isPasswordValid(value: string): boolean {
  return value.length >= 8 && /[0-9]/.test(value) && /[A-Z]/.test(value);
}

export const PASSWORD_REQUIREMENTS_HINT =
  'At least 8 characters, including 1 uppercase letter and 1 number.';

export function passwordsMismatch(password: string, confirmPassword: string): boolean {
  return Boolean(password && confirmPassword && password !== confirmPassword);
}

/** Same rule as Angular's Validators.email. */
const EMAIL_PATTERN =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
