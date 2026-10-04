# Human Memory Search

A polished, local-first prototype for searching your own memories, notes, ideas and experiences.

## Run it

No build step is required.

1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. Start searching or click **New memory**.

## Deploy to GitHub Pages

The `Deploy to GitHub Pages` workflow checks the JavaScript and publishes the static site whenever a change is pushed to `main`. Pull requests run the validation and prepare the site artifact without deploying it. After the workflow completes, the live URL is available in the workflow run and the repository's **Deployments** section.

To enable deployment, make sure GitHub Pages is configured to use **GitHub Actions** in the repository's Pages settings.

## What is included

- Natural-language-style memory search
- Relevance scoring based on memory text, category and tags
- Timeline view
- Memory insights dashboard
- Favorites collection
- Add, favorite and delete memories
- Filter by category and sort by recency or relevance
- Keyboard shortcuts: `Ctrl/Cmd + K` to search and `Ctrl/Cmd + N` to capture
- Persistent browser storage with `localStorage`
- JSON export
- Responsive mobile sidebar
- Privacy-first local storage
- Realistic seeded sample memories

## Important

This version is a fully working frontend prototype. Search uses a lightweight local relevance score over memory text, tags, categories and dates; it does not call an AI service or send data to a server. A production version can replace the scoring layer with embeddings + MongoDB Vector Search for semantic retrieval.

## Suggested production stack

- Frontend: HTML/CSS/JavaScript or React
- Backend: Node.js + Express
- Database: MongoDB
- Semantic search: MongoDB Vector Search + embeddings
- Authentication: Auth.js / Clerk / custom JWT
- AI layer: OpenAI-compatible model API
- Storage: MongoDB + object storage for attachments
