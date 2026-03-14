# State Management

The application relies on React's built-in hooks (`useState`, `useRef`, `useEffect`) for state management, avoiding external libraries like Redux or Zustand to maintain simplicity.

## Global State (`App.tsx`)

### `worldState`
Tracks the user's progress and status within the story.
```typescript
interface WorldState {
    inventory: string[];
    health: number;
    status: string;
    achievements: string[];
}
```
Updated incrementally based on the AI's response to user choices.

### `history`
An array representing the sequence of generated pages and panels.
```typescript
interface HistoryNode {
    id: string;
    parentId: string | null;
    narrative: PageData | null;
    worldState: WorldState;
    choiceMade: string | null;
}
```
This structure enables the "Multiverse Map" feature, allowing the application to reconstruct the state at any previous point in the story.

### `currentSheetIndex`
An integer pointing to the currently active node in the `history` array.

### `personas`
State variables (`hero`, `friend`, `villain`) storing the generated character data (name, backstory, base64 image).

## Local State
Individual components manage their own local state for UI interactions (e.g., `isTyping` in `CharacterChatDialog`, `isExporting` in `ExportDialog`).

## Persistence
The application uses `localStorage` to save the current game state, allowing users to resume their adventure later. The `saveGame` and `loadGame` functions in `App.tsx` handle serialization and deserialization.
