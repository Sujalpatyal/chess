<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/80e7df13-955f-4a7e-96ae-6f9a350f6117

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` if you want to override the local port.
3. Run the complete app (React frontend, API, and Socket.IO multiplayer backend):
   `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in a browser. The backend
   health endpoint is available at [http://localhost:3000/health](http://localhost:3000/health).

## Production

Build and serve both the frontend and backend from one Node process:

```sh
npm run build
npm start
```
