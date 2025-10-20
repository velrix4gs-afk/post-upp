// Centralized error code definitions for POST-UPP

export const ERROR_CODES = {
  // Authentication errors (AUTH_xxx)
  AUTH_001: { message: 'User not authenticated', userMessage: 'Please log in to continue' },
  AUTH_002: { message: 'Session expired', userMessage: 'Your session expired. Please log in again.' },
  AUTH_003: { message: 'Invalid credentials', userMessage: 'Check your email and password' },
  
  // Chat errors (CHAT_xxx)
  CHAT_001: { message: 'participant_uuid is required', userMessage: 'Could not start chat. Missing user information.' },
  CHAT_002: { message: 'Invalid UUID format', userMessage: 'Invalid user selected. Please try selecting again.' },
  CHAT_003: { message: 'Cannot create chat with yourself', userMessage: 'You cannot send messages to yourself.' },
  CHAT_004: { message: 'Failed to create chat - check RLS policies', userMessage: 'Failed to create chat. Please try again later.' },
  CHAT_005: { message: 'Chat created but no ID returned - RLS policy issue', userMessage: 'Chat creation incomplete. Please refresh and try again.' },
  CHAT_006: { message: 'Failed to add participants - check RLS policies', userMessage: 'Could not add participants. Please try again.' },
  CHAT_ERROR: { message: 'Chat operation failed', userMessage: 'Chat operation failed. Please try again.' },
  
  // Post errors (POST_xxx)
  POST_001: { message: 'Failed to create post', userMessage: 'Failed to create post. Please try again.' },
  POST_002: { message: 'Failed to update post', userMessage: 'Cannot update post. Please try again.' },
  POST_003: { message: 'Failed to delete post', userMessage: 'Cannot delete post. Please try again.' },
  POST_004: { message: 'Post not found', userMessage: 'Post not found' },
  
  // Upload errors (UPLOAD_xxx)
  UPLOAD_001: { message: 'File too large', userMessage: 'File is too large. Maximum size is 5MB.' },
  UPLOAD_002: { message: 'Invalid file type', userMessage: 'Invalid file type. Please upload an image.' },
  UPLOAD_003: { message: 'Upload failed', userMessage: 'Failed to upload file. Please try again.' },
  
  // Database errors (DB_xxx)
  DB_001: { message: 'Database error - RLS policy violation', userMessage: 'Permission denied. You may not have access.' },
  DB_002: { message: 'Foreign key constraint violation', userMessage: 'Invalid reference. Please check your data.' },
  DB_003: { message: 'Unique constraint violation', userMessage: 'This item already exists.' },
  
  // Network errors (NET_xxx)
  NET_001: { message: 'Network request failed', userMessage: 'Network error. Please check your connection.' },
  NET_002: { message: 'Request timeout', userMessage: 'Request timed out. Please try again.' },
  
  // Generic
  UNKNOWN: { message: 'Unknown error occurred', userMessage: 'Something went wrong. Please try again.' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export const getErrorMessage = (code: string): { message: string; userMessage: string } => {
  return ERROR_CODES[code as ErrorCode] || ERROR_CODES.UNKNOWN;
};

export const formatError = (code: string, details?: string) => {
  const error = getErrorMessage(code);
  return {
    code,
    message: error.message,
    userMessage: error.userMessage,
    details: details || undefined,
  };
};
