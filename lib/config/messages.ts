/**
 * File: lib/config/messages.ts
 * Description: Centralized application messages (Errors, Success, Validation).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

export const ACTION_MESSAGES = {
  AUTH: {
    ERR_MISSING_CREDS: 'Email and password are required.',
    ERR_INVALID_CREDS: 'Invalid credentials.',
    ERR_UNAUTHORIZED: 'Access denied. Insufficient permissions.',
    ERR_SUPERADMIN_ONLY:
      'Unauthorized: Only SuperAdmins can perform this action.',
    ERR_VALIDATION: 'Invalid input data.',
    SUCCESS_REGISTER: 'Admin registered successfully.',
  },
  TOURNAMENTS: {
    UNAUTHORIZED: 'Unauthorized: Admin access required.',
    VALIDATION_ERROR: 'Validation Error',
    DATABASE_ERROR: 'Database Error: An unexpected error occurred.',
    DB_CREATE_ERROR: 'Database Error: Failed to create tournament.',
    DB_UPDATE_ERROR: 'Database Error: Failed to update tournament.',
    DB_DELETE_ERROR: 'Database Error: Failed to delete tournament.',
    DUPLICATE_SLUG:
      'A tournament with this slug already exists. Please choose another one.',
    DELETE_SUCCESS: 'Tournament deleted successfully.',
    NOT_FOUND: 'Tournament not found.',
    FIELD_DATA_CONSTRAINT: (label: string) =>
      `Cannot remove field "${label}" as it contains user data.`,
    FIELD_SECURITY_ERROR: (id: string) =>
      `Security Error: Field "${id}" does not belong to this tournament.`,
  },
  ADMIN: {
    UNAUTHORIZED: 'Access Denied.',
    NOT_FOUND: 'Resource not found.',
    UPDATE_SUCCESS: 'Update successful.',
    DELETE_SUCCESS: 'Delete successful.',
    CREATE_SUCCESS: 'Creation successful.',
    SUCCESS_CREATE: 'Admin created successfully.',
    SUCCESS_UPDATE: 'Admin updated successfully.',
    SUCCESS_DELETE: 'Admin deleted successfully.',
    SUCCESS_RESET: 'Password reset successfully.',
    ERR_UNAUTHORIZED: 'Unauthorized operation.',
    ERR_SUPERADMIN_ONLY:
      'Unauthorized: Only SuperAdmins can perform this action.',
    ERR_PROTECTED_SUPERADMIN: 'Cannot modify or delete another SuperAdmin.',
    ERR_USER_NOT_FOUND: 'User not found.',
    ERR_EMAIL_EXISTS: 'Failed to create admin. Email might already exist.',
    ERR_GENERIC: 'An error occurred while processing your request.',
    ERR_VALIDATION: 'Invalid fields provided.',
  },
  SETTINGS: {
    SUCCESS: 'Settings updated successfully.',
    ERR_UPLOAD: 'Failed to upload logo file.',
    ERR_VALIDATION: 'Invalid form data. Please check your inputs.',
    ERR_DB: 'Database error: Failed to save settings.',
  },
} as const

export const UI_MESSAGES = {
  LOGIN: {
    LABEL_EMAIL: 'Email',
    PLACEHOLDER_EMAIL: 'admin@belouga.com',
    LABEL_PASSWORD: 'Mot de passe',
    PLACEHOLDER_PASSWORD: '••••••••',
    BTN_LOGIN: 'Se connecter',
    BTN_PENDING: 'Connexion...',
  },
} as const
