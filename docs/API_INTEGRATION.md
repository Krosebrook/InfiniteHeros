# API Integration Guide

The application interacts with Google's Gemini API using the `@google/genai` SDK. All API calls are encapsulated within the `aiService.ts` module.

## Initialization
The `aiService` must be initialized with a valid API key before use.
```typescript
import { initAI } from './aiService';
initAI('YOUR_API_KEY');
```

## Core Functions

### `generateComicPanel`
Generates the narrative text, choices, and image prompt for the next panel.
- **Model:** `gemini-3.1-pro-preview`
- **Input:** Current story context, user choice, world state, character bios.
- **Output:** JSON object containing narrative, choices, updated world state, and an image prompt.

### `generateImage`
Generates the comic panel artwork based on the prompt provided by `generateComicPanel`.
- **Model:** `gemini-3.1-flash-image-preview`
- **Input:** Image prompt, art style, aspect ratio.
- **Output:** Base64 encoded image string.

### `generateCharacterBios`
Auto-generates character names and backstories based on the selected genre and tone.
- **Model:** `gemini-3.1-pro-preview`
- **Output:** JSON object containing character details.

### `analyzeCharacterImage`
Analyzes an uploaded image to generate a matching character name and backstory.
- **Model:** `gemini-3.1-pro-preview`
- **Input:** Base64 encoded image, role (Hero/Villain).
- **Output:** JSON object containing character details.

### `generateCharacterResponse`
Handles the interactive chat feature.
- **Model:** `gemini-3.1-pro-preview`
- **Input:** Character persona, user message, current story context.
- **Output:** Text response from the character.

## Error Handling
The `aiService` includes basic error handling and retry logic for API calls. If an image generation fails (e.g., due to safety filters), the application falls back to a placeholder image or prompts the user to try again.
