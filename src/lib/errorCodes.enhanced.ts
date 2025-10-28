// Enhanced error code system with user-friendly messages and developer codes

export const ERROR_CODES = {
  // Authentication errors (AUTH_xxx)
  AUTH_001: { 
    code: 'AUTH_001',
    message: 'User not authenticated', 
    userMessage: 'Please log in to continue',
    action: 'Redirect to login'
  },
  AUTH_002: { 
    code: 'AUTH_002',
    message: 'Session expired', 
    userMessage: 'Your session has expired',
    action: 'Please log in again'
  },
  AUTH_003: { 
    code: 'AUTH_003',
    message: 'Invalid credentials', 
    userMessage: 'Email or password is incorrect',
    action: 'Check your credentials'
  },
  
  // Chat errors (CHAT_xxx)
  CHAT_001: { 
    code: 'CHAT_001',
    message: 'Failed to load chats', 
    userMessage: 'Could not load chats',
    action: 'Try refreshing the page'
  },
  CHAT_002: { 
    code: 'CHAT_002',
    message: 'Failed to send message', 
    userMessage: 'Message not sent',
    action: 'Check connection and try again'
  },
  CHAT_003: { 
    code: 'CHAT_003',
    message: 'Invalid chat ID', 
    userMessage: 'Chat not found',
    action: 'Select a different chat'
  },
  CHAT_004: { 
    code: 'CHAT_004',
    message: 'Failed to create chat', 
    userMessage: 'Could not start chat',
    action: 'Please try again'
  },
  
  // Post errors (POST_xxx)
  POST_001: { 
    code: 'POST_001',
    message: 'Failed to create post', 
    userMessage: 'Post not created',
    action: 'Please try again'
  },
  POST_002: { 
    code: 'POST_002',
    message: 'Failed to delete post', 
    userMessage: 'Could not delete post',
    action: 'Try again later'
  },
  POST_003: { 
    code: 'POST_003',
    message: 'Post not found', 
    userMessage: 'This post no longer exists',
    action: 'Refresh your feed'
  },
  
  // Poll errors (POLL_xxx)
  POLL_001: { 
    code: 'POLL_001',
    message: 'Failed to create poll', 
    userMessage: 'Could not create poll',
    action: 'Check your options and try again'
  },
  POLL_002: { 
    code: 'POLL_002',
    message: 'Failed to vote', 
    userMessage: 'Vote not recorded',
    action: 'Please try again'
  },
  
  // Event errors (EVENT_xxx)
  EVENT_001: { 
    code: 'EVENT_001',
    message: 'Failed to create event', 
    userMessage: 'Could not create event',
    action: 'Check details and try again'
  },
  EVENT_002: { 
    code: 'EVENT_002',
    message: 'Event not found', 
    userMessage: 'This event does not exist',
    action: 'Check the event link'
  },
  
  // Group errors (GROUP_xxx)
  GROUP_001: { 
    code: 'GROUP_001',
    message: 'Failed to create group', 
    userMessage: 'Could not create group',
    action: 'Try again with different settings'
  },
  GROUP_002: { 
    code: 'GROUP_002',
    message: 'Failed to join group', 
    userMessage: 'Could not join group',
    action: 'Try again later'
  },
  
  // Upload errors (UPLOAD_xxx)
  UPLOAD_001: { 
    code: 'UPLOAD_001',
    message: 'File too large', 
    userMessage: 'File is too large',
    action: 'Maximum size is 5MB'
  },
  UPLOAD_002: { 
    code: 'UPLOAD_002',
    message: 'Invalid file type', 
    userMessage: 'File type not supported',
    action: 'Please upload an image or video'
  },
  UPLOAD_003: { 
    code: 'UPLOAD_003',
    message: 'Upload failed', 
    userMessage: 'Upload failed',
    action: 'Check connection and try again'
  },
  
  // Network errors (NET_xxx)
  NET_001: { 
    code: 'NET_001',
    message: 'Network request failed', 
    userMessage: 'Connection problem',
    action: 'Check your internet connection'
  },
  NET_002: { 
    code: 'NET_002',
    message: 'Request timeout', 
    userMessage: 'Request took too long',
    action: 'Try again'
  },
  
  // Rate limit errors (RATE_xxx)
  RATE_001: { 
    code: 'RATE_001',
    message: 'Rate limit exceeded', 
    userMessage: 'Too many requests',
    action: 'Please wait and try again'
  },
  
  // Generic
  UNKNOWN: { 
    code: 'UNKNOWN',
    message: 'Unknown error occurred', 
    userMessage: 'Something went wrong',
    action: 'Please try again'
  },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export const getErrorDetails = (code: string) => {
  return ERROR_CODES[code as ErrorCode] || ERROR_CODES.UNKNOWN;
};

export const formatErrorForUser = (code: string, details?: string) => {
  const error = getErrorDetails(code);
  return {
    title: error.userMessage,
    description: error.action,
    code: error.code, // Show code for developers
    technicalDetails: details, // Hidden by default
  };
};

export const formatErrorForDev = (code: string, details?: string) => {
  const error = getErrorDetails(code);
  return {
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    action: error.action,
    details,
  };
};
