# Athena Nitro API TypeScript Interfaces

This document provides concise TypeScript definitions for each Nitro endpoint located under `server/api/`.  
The interfaces describe **request bodies**, **response payloads**, and any **required permissions** (currently none – all routes are public).

---

## 1. AI Chat – `POST /api/ai/chat`

```ts
/** Request body for the chat endpoint */
export interface ChatRequest {
  /** Message from the user */
  message: string;
  /** Optional context to prime the model */
  context?: string;
}

/** Successful response */
export interface ChatSuccessResponse {
  success: true;
  /** AI‑generated reply */
  response: string;
  /** Provider used: 'openai' | 'local' | 'fallback' */
  provider: 'openai' | 'local' | 'fallback';
}

/** Error response */
export interface ChatErrorResponse {
  success: false;
  /** Human‑readable error message */
  error: string;
  /** Fallback response text */
  response: string;
  provider: 'fallback';
}

/** Union type for all possible responses */
export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
```

**Permissions**: None (public).

---

## 2. Improve Text – `POST /api/ai/improve-text`

```ts
export type ImproveAction = 'grammar' | 'clarity' | 'professional' | 'creative' | 'simplify' | 'improve';

export interface ImproveTextRequest {
  /** Original text to be processed */
  text: string;
  /** Action to perform – defaults to 'improve' */
  action?: ImproveAction;
}

/** Successful response */
export interface ImproveTextSuccessResponse {
  success: true;
  /** Improved version of the input text */
  improvedText: string;
  provider: 'openai' | 'local';
  /** Action that was applied */
  action: ImproveAction;
  /** Length of original text */
  originalLength: number;
  /** Length of the improved text */
  improvedLength: number;
}

/** Error response – throws 500 */
export interface ImproveTextErrorResponse {
  /** HTTP error status */
  statusCode: 500;
  /** Error description */
  statusMessage: string;
}
```

**Permissions**: None.

---

## 3. AI Suggestions – `POST /api/ai/suggestions`

```ts
export type SuggestionType = 'document' | 'workspace' | 'content' | 'productivity' | 'general';

export interface SuggestionsRequest {
  /** Optional context for generating suggestions */
  context?: string;
  /** Category of suggestions – defaults to 'general' */
  type?: SuggestionType;
}

/** Single suggestion item */
export interface SuggestionItem {
  title: string;
  description: string;
  /** Optional action identifier */
  action?: string;
}

/** Successful response */
export interface SuggestionsSuccessResponse {
  success: true;
  /** Array of up to five suggestions */
  suggestions: SuggestionItem[];
  provider: 'openai' | 'local';
  type: SuggestionType;
}

/** Error response – throws 500 */
export interface SuggestionsErrorResponse {
  statusCode: 500;
  statusMessage: string;
}
```

**Permissions**: None.

---

## 4. Summarize Text – `POST /api/ai/summarize`

```ts
export interface SummarizeRequest {
  /** Text to be summarized */
  text: string;
  /** Maximum length of the summary (characters) – defaults to 200 */
  maxLength?: number;
}

/** Successful response */
export interface SummarizeSuccessResponse {
  success: true;
  /** Summary string */
  summary: string;
  provider: 'openai' | 'local';
  originalLength: number;
  summaryLength: number;
}

/** Error response – throws 500 */
export interface SummarizeErrorResponse {
  statusCode: 500;
  statusMessage: string;
}
```

**Permissions**: None.

---

## 5. Documents List – `GET /api/documents`

```ts
export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  createdAt: string; // ISO‑8601 timestamp
  updatedAt: string; // ISO‑8601 timestamp
}

/** Successful response */
export interface DocumentsResponse {
  data: DocumentItem[];
  message: string;
}
```

**Permissions**: None (public mock endpoint; in production would require auth).

---

## 6. API Test – `GET /api/test`

```ts
export interface TestResponse {
  message: string;
  timestamp: string; // ISO‑8601
}
```

**Permissions**: None.

---

*All interfaces are deliberately lightweight to match the current implementation.  When the API evolves (e.g., adds auth, pagination, or validation), extend the definitions accordingly.*