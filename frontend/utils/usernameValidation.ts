const allowedCharacters = /^[a-z0-9.]+$/;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const isValidUsername = (value: string) => {
  if (!value) return false;
  if (!allowedCharacters.test(value)) return false;
  if (value.startsWith('.') || value.endsWith('.')) return false;
  if (value.includes('..')) return false;
  return true;
};

export const usernameValidationMessage =
  'Use lowercase letters, numbers, and dots only. No spaces or consecutive dots, and no dot at the start or end.';
