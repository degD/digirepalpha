Digital repertoire manager built with Next.js, CodeMirror, and browser-local storage.

## Development

Install dependencies with Bun, then start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
# Unit tests
bun test

# Linting
bun run lint

# Install the Playwright engines used by this project once
bunx playwright install chromium webkit

# End-to-end tests, against a production build on port 3001
bun run test:e2e
```

The Playwright suite runs independently in desktop Chromium and WebKit. It covers search, song creation and deletion, editor persistence and chord controls, routing states, and complete database import/export workflows.

## Storage

Songs are stored in the browser's local storage. Use the Data page to export a `db.songs` backup or replace the local database from a backup.
