// Centralized error code definitions for POST-UPP

export const ERROR_CODES = {
  // Authentication errors (AUTH_xxx)
  AUTH_001: { message: 'Please log in to continue', userMessage: 'Login required' },
  AUTH_002: { message: 'Session expired', userMessage: 'Please log in again' },
  AUTH_003: { message: 'Invalid credentials', userMessage: 'Check your email and password' },
  
  // Chat errors (CHAT_xxx)
  CHAT_001: { message: 'Missing participant UUID', userMessage: 'Cannot create chat' },
  CHAT_002: { message: 'Invalid UUID format', userMessage: 'Invalid user ID' },
  CHAT_003: { message: 'Cannot chat with yourself', userMessage: 'Cannot message yourself' },
  CHAT_004: { message: 'Failed to create chat', userMessage: 'Chat creation failed' },
  CHAT_005: { message: 'No chat ID returned', userMessage: 'Chat setup incomplete' },
  CHAT_006: { message: 'Failed to add participants', userMessage: 'Cannot add participants' },
  
  // Post errors (POST_xxx)
  POST_001: { message: 'Failed to create post', userMessage: 'Cannot create post' },
  POST_002: { message: 'Failed to update post', userMessage: 'Cannot update post' },
  POST_003: { message: 'Failed to delete post', userMessage: 'Cannot delete post' },
  POST_004: { message: 'Post not found', userMessage: 'Post not found' },
  
  // Database errors (DB_xxx)
  DB_001: { message: 'RLS policy violation', userMessage: 'Permission denied' },
  DB_002: { message: 'Foreign key constraint', userMessage: 'Invalid reference' },
  DB_003: { message: 'Unique constraint violation', userMessage: 'Already exists' },
  
  // Network errors (NET_xxx)
  NET_001: { message: 'Network request failed', userMessage: 'Connection error' },
  NET_002: { message: 'Timeout', userMessage: 'Request timed out' },
  
  // Generic
  UNKNOWN: { message: 'Unknown error', userMessage: 'Something went wrong' },
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
