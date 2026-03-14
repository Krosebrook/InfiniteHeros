# Deployment Guide

Infinite Heroes is a static Single Page Application (SPA) built with Vite and React. It can be deployed to any static hosting provider.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Build Process
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application for production:
   ```bash
   npm run build
   ```
4. The compiled static files will be located in the `dist/` directory.

## Hosting Options

### Vercel / Netlify
1. Connect your GitHub repository to Vercel or Netlify.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Deploy!

### Firebase Hosting
1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
   - Select your project.
   - Set the public directory to `dist`.
   - Configure as a single-page app (rewrite all urls to `/index.html`).
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Environment Variables
The application does not require any build-time environment variables for the Gemini API key, as it is provided by the user at runtime via the UI. However, if you wish to hardcode a key for a private deployment, you can modify `useApiKey.ts` to read from `import.meta.env.VITE_GEMINI_API_KEY`.
