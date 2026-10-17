# VALO.KR V5.1.0 — Rank Profile UI

VALO.KR responsive Node.js site with current competitive rank and historical peak rank display areas.

## Windows quick start

```powershell
npm.cmd install
npm.cmd start
```

Open `http://localhost:3000`.

## Demo preview

Set `ENABLE_DEV_MODE=true` in the local `.env` file or hosting environment, then open the home page and choose **데모 대시보드 보기**. The preview uses clearly labelled sample rank values; they are not real player data.

## Render deployment

Build command: `npm install`
Start command: `npm start`

After updating the GitHub repository, Render should deploy the new commit automatically. Keep secrets out of GitHub and configure them in Render Environment.

## Riot integration status

The current/peak rank cards and `/api/rank` response contract are ready for later integration, but actual Riot RSO and production API access are **not implemented** in this build. Actual player rank data requires Riot approval and the approved endpoints/data scope. Historical peak rank may need to be derived from available season/act records; it is not guaranteed by a single universal endpoint.

Demo values are for layout preview only and must not be presented as authentic player statistics.
