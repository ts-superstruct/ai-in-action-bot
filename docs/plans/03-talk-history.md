# Talk History Query Feature – Planning Doc

## Overview

This feature enables users to query the AI in Action bot about previous talks, e.g., "@bot has there been a talk about A2A before?" or "@bot what talks have been about agents?". The bot should reply in the same format as for upcoming speakers.

## High-Level Architecture

- **Data Source:** All talks (past and future) are stored in the `ScheduledSpeaker` MongoDB collection.
- **Query Logic:** When a user asks about past talks, the bot fetches all talks from the database, filters for those with a `scheduledDate` in the past, and uses the LLM to evaluate which talks match the user's query (by topic).
- **Modular Components:**
  - **Database Access Module:** Handles fetching all scheduled talks.
  - **Talk History:** Filters past talks and delegates matching to the LLM.
  - **LLM Matching Module:** Uses the LLM to determine which talks are relevant to the query.
  - **Discord Intent Handler:** Detects user queries about past talks and formats responses.

## Implementation Steps

1. **Design and implement a `talkHistory` module** (e.g., `lib/talkHistory.js`):
    - Fetch all talks from `ScheduledSpeaker`.
    - Filter for past talks.
    - Expose a function to query past talks by topic (delegating matching to the LLM).
2. **Update Discord intent handling** (in `lib/discord/index.js`):
    - Add logic to detect queries about past talks using LLM intent detection.
    - Call the `talkHistory` and format the response.
3. **Integrate LLM for topic matching** (e.g., via `lib/llm/index.js`):
    - Pass the user's query and the list of past talk topics to the LLM.
    - Receive and process the LLM's response to identify relevant talks.
4. **Testing:**
    - Write unit tests for `talkHistory` (mocking DB and LLM).
    - Write integration tests for Discord intent handling (mocking LLM and DB as needed).
    - Add/extend tests for LLM matching logic.

## Files to Update or Add

- **New:** `lib/talkHistory.js` (core logic for querying/filtering past talks)
- **Update:**
  - `lib/discord/index.js` (handle new user queries)
  - `models/scheduledSpeaker.js` (no change needed, but used for fetching data)
- **New/Update:** Test files:
  - `test/talkHistory.test.js` (unit tests for the new service)

## Modularity

- **Database logic** is isolated in the service, allowing DB mocking.
- **LLM logic** is abstracted, so it can be stubbed/mocked in tests.
- **Discord intent handling** is separated from business logic, supporting independent testing.

## Tests

- Unit tests for `talkHistory`:
  - Fetching and filtering past talks.
  - Delegating topic matching to the LLM.

---
