# System Architecture

## High-Level Design
Infinite Heroes (Flash Comics) is a Single Page Application (SPA) built with React and Vite. The application operates entirely on the client side, interacting directly with the Google Gemini API for all AI-driven content generation.

## Component Architecture
The application is structured around a central orchestrator component (`App.tsx`) that manages the global state and coordinates interactions between various sub-components.

- **`App.tsx`:** The main entry point. Manages the `worldState` (inventory, health, stats), the `history` (array of generated pages/panels), and the current UI view (Setup, Book, Map, etc.).
- **`Setup.tsx`:** Handles initial configuration (Genre, Art Style, Language, Tone, Layout) and character creation (Hero, Sidekick, Villain).
- **`Book.tsx`:** Renders the generated comic panels and narrative text.
- **`Panel.tsx`:** Represents a single comic panel, including the image, narrative, and user choices.
- **`MultiverseMap.tsx`:** Visualizes the branching narrative and allows users to navigate back to previous decision points.
- **`CharacterChatDialog.tsx`:** Provides an interface for interacting with generated characters.
- **`Inventory.tsx`:** Displays the user's current items and stats.
- **`ExportDialog.tsx`:** Handles exporting the comic to PDF or ZIP formats.

## Data Flow
1. **Initialization:** The user configures the story and characters in `Setup.tsx`.
2. **Generation:** `App.tsx` calls `aiService.ts` to generate the initial narrative and choices based on the setup parameters.
3. **Rendering:** The generated data is added to the `history` state and rendered by `Book.tsx` and `Panel.tsx`.
4. **Interaction:** The user selects a choice.
5. **Update:** `App.tsx` updates the `worldState` based on the choice and calls `aiService.ts` to generate the next panel.
6. **Iteration:** Steps 3-5 repeat, building the comic dynamically.

## External Services
- **Google Gemini API (`@google/genai`):** Used for text generation (`gemini-3.1-pro-preview`) and image generation (`gemini-3.1-flash-image-preview`).
- **Browser APIs:** `localStorage` for saving game state, `speechSynthesis` for TTS, and `Canvas API` for image processing during export.
