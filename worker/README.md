# StudentHub Cloudflare Worker Backend

This is the secure backend server for **StudentHub**, running on Cloudflare Workers at domain `api.backend.studenthub.sumanonline.com`.

## Features
- Proxy all Google Gemini AI requests securely without exposing API keys in frontend code.
- Endpoint `/api/chat`: AI Assistant queries with student context & history.
- Endpoint `/api/parse-routine`: AI Routine image & document parser.
- Endpoint `/api/parse-exam`: AI Exam timetable parser.
- Endpoint `/api/parse-holiday`: AI Holiday list parser.
- Endpoint `/api/health`: Health status endpoint.
- Automatic key load distribution across 5 Gemini API Keys (`GEMINI_API_KEY_1` to `GEMINI_API_KEY_5`).

## Setup & Deployment Instructions

### 1. Install Wrangler Dependencies
From this directory (`worker/`), run:
```bash
npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Set Environment Secrets on Cloudflare Worker
Run the following commands to add your Gemini API keys securely into your Cloudflare Worker environment:

```bash
npx wrangler secret put GEMINI_API_KEY_1
npx wrangler secret put GEMINI_API_KEY_2
npx wrangler secret put GEMINI_API_KEY_3
npx wrangler secret put GEMINI_API_KEY_4
npx wrangler secret put GEMINI_API_KEY_5
```
*(Paste the corresponding API key when prompted for each secret)*

### 4. Deploy to Cloudflare Workers
```bash
npx wrangler deploy
```

Once deployed, your Cloudflare Worker will handle all requests at `https://api.backend.studenthub.sumanonline.com`.
