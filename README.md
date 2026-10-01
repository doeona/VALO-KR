# VALO.KR V5.0.4 — Node.js 24 Clean Local Build

This local build is intentionally free of `better-sqlite3`, Python, node-gyp, and native database compilation.

## Windows quick start

Open PowerShell in this folder:

```powershell
npm.cmd install
npm.cmd start
```

Then open:

`http://localhost:3000`

Health check:

`http://localhost:3000/api/health`

## Optional demo login

Create a `.env` file from `.env.example`, or set:

```text
ENABLE_DEV_MODE=true
```

The local demo API is for UI testing only. Real Riot Sign On and Riot API access require a Riot Production application and approved credentials.

## Important

This is a local test build. Before public launch, replace the demo auth/data paths with the approved Riot RSO/API integration, configure HTTPS, production secrets, legal contact/retention details, and review Riot policies.
