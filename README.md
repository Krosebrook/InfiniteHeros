
# Infinite Heroes: AI-Powered Comic Generator

Infinite Heroes is a React-based Progressive Web App (PWA) that generates personalized, branching comic books using Google's Gemini models. It features a physics-inspired book interface, text-to-speech narration, and a "Multiverse Map" for exploring different narrative timelines.

## Features

*   **Generative Storytelling**: Creates dynamic scripts, dialogue, and choices based on user-selected genres and tones.
*   **Visual Novel Mode**: Renders consistent characters (Hero, Ally, Villain) across pages using specific visual reference prompts.
*   **Multiverse Map**: A visual node graph representing the branching narrative tree. Users can jump to any previous decision point and explore alternative outcomes.
*   **World State Tracking**: Persists inventory and character status (e.g., "Holding Key", "Injured Arm") to reduce AI hallucination and improve continuity.
*   **Interactive Panels**:
    *   **Remixing**: Users can instruction-edit specific panels (e.g., "Make the sky red").
    *   **Video Generation**: Transforms static panels into motion comics using Veo.
    *   **TTS**: Reads dialogue aloud using specific character voices.
    *   **Manual Bubble Management**: 
        *   **Add**: Insert new bubbles manually via the 💬 button.
        *   **Edit**: Drag to move, click text to type.
        *   **Style**: Double-click bubbles to cycle between Speech, Thought, Caption, and SFX styles.
        *   **Delete**: Hover over a bubble and click '×' to remove.

## Architecture

### AI Models (Google GenAI)

The application leverages the latest Gemini models via `@google/genai`:

*   **Text & Logic**: `gemini-3-pro-preview`
    *   Used for scriptwriting, world state updates, and JSON structured output.
*   **Image Generation**: `gemini-3-pro-image-preview`
    *   Used for high-fidelity comic panel generation and cover art.
*   **Image Editing**: `gemini-2.5-flash-image`
    *   Used for the "Remix" feature (inpainting/editing via instruction).
*   **Video**: `veo-3.1-fast-generate-preview`
    *   Used to animate specific panels into 4-second motion clips.
*   **Speech**: `gemini-2.5-flash-preview-tts`
    *   Used for generating character voiceovers.

### Data Structure: The Story Tree

Unlike linear visual novels, Infinite Heroes stores data as a Directed Acyclic Graph (DAG) to support time travel.

*   **`ComicFace`**: Represents a single page/node.
    *   `id`: Unique UUID.
    *   `parentId`: The ID of the page that led to this one.
    *   `choiceLabel`: The user decision that created this branch.
    *   `narrative`: Contains the scene description, dialogue bubbles, and choices.
*   **`storyTree`**: A hash map (`Record<string, ComicFace>`) containing every node ever generated in the session.
*   **`history`**: An array representing the *current* active timeline (path from Root to Leaf).

## Setup

1.  **Environment Variables**:
    *   Ensure `process.env.API_KEY` is available (handled via `window.aistudio` injection in this environment).
2.  **Dependencies**:
    *   React 19
    *   `@google/genai` SDK
    *   `jspdf` / `jszip` for exporting.

## Best Practices Implemented

*   **Prompt Engineering**: Uses "Clean Art" prompts (requesting no text in images) to avoid artifacts, overlaying HTML bubbles instead.
*   **State Management**: Uses `useRef` for heavy objects (history, tree) to avoid excessive re-renders during high-frequency updates, while syncing with `useState` for UI reactivity.
*   **Resiliency**: Implements exponential backoff for AI API calls to handle rate limits (`429` / `503` errors).
*   **Accessibility**: All generated images have alt text derived from the scene description.

## License

Apache-2.0
