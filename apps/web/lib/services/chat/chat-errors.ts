/** Thrown when a chat action is denied after server-side authorization. */
export class ChatForbiddenError extends Error {
  readonly code = "CHAT_FORBIDDEN" as const;
  readonly status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "ChatForbiddenError";
  }
}

export class ChatUnauthorizedError extends Error {
  readonly code = "CHAT_UNAUTHORIZED" as const;
  readonly status = 401 as const;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "ChatUnauthorizedError";
  }
}

export class ChatNotFoundError extends Error {
  readonly code = "CHAT_NOT_FOUND" as const;
  readonly status = 404 as const;

  constructor(message = "Resource not found") {
    super(message);
    this.name = "ChatNotFoundError";
  }
}

/** Too many chat requests in a sliding window (HTTP 429). */
export class ChatRateLimitError extends Error {
  readonly code = "CHAT_RATE_LIMIT" as const;
  readonly status = 429 as const;

  constructor(message = "Too many requests. Try again shortly.") {
    super(message);
    this.name = "ChatRateLimitError";
  }
}
