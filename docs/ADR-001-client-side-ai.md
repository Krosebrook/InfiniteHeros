# ADR 001: Client-Side AI Integration

## Status
**Accepted**

## Context
The application requires interaction with Google's Gemini API to generate text (narrative, choices, character dialogue) and images (comic panels). We need to decide how to integrate this API.

## Options Considered
1. **Server-Side Proxy:** Build a backend service (e.g., Node.js/Express) to handle API requests and manage a central API key.
2. **Client-Side Direct:** Use the `@google/genai` SDK directly in the browser, requiring the user to provide their own API key.

## Decision
We have chosen **Option 2: Client-Side Direct**.

## Rationale
- **Simplicity:** Reduces the operational overhead of maintaining a backend service.
- **Cost:** By requiring users to provide their own API keys, the application avoids incurring centralized API costs.
- **Privacy:** User prompts and generated content remain between the user's browser and Google's servers.
- **Deployment:** Allows the application to be deployed as a static Single Page Application (SPA) on platforms like Vercel, Netlify, or Firebase Hosting.

## Consequences
- **Security:** We must ensure the API key is handled securely in the client (e.g., stored in memory or `localStorage` with clear warnings).
- **User Experience:** Users must obtain and input an API key before using the app, which adds friction to the onboarding process.
- **CORS/Network:** We rely on the `@google/genai` SDK to handle CORS and network requests correctly from the browser environment.
