const allowedCharacters = /^[a-z0-9.]+$/;

export const normalizeUsername = (value = '') => value.trim().toLowerCase();

export const isValidUsername = (value = '') => {
  if (!value) return false;
  if (!allowedCharacters.test(value)) return false;
  if (value.startsWith('.') || value.endsWith('.')) return false;
  if (value.includes('..')) return false;
  return true;
};

export const usernameValidationMessage =
  'Username must be lowercase and can only include letters, numbers, and dots. No spaces, no consecutive dots, and no dot at the start or end.';
