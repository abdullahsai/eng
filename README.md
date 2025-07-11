# Dashboard App

This simple Node.js application serves a small Arabic dashboard. Use it to manage a list of API endpoints and view statistics for the reports provided by each endpoint.

## Usage

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

If your sources require authentication, set an `API_KEY` environment variable. The
server will include it in an `X-API-Key` header when fetching reports.

3. Visit `http://localhost:3000` for the dashboard or `http://localhost:3000/settings.html` to manage API URLs.

Data sources are stored in `sources.json`.
