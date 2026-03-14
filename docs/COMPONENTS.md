# Component Library

This document outlines the primary React components used in the application.

## Core Components

### `App.tsx`
The root component. Manages global state (`worldState`, `history`, `activeChat`, `ttsSettings`) and orchestrates the flow between different views (Setup, Book, Map).

### `Setup.tsx`
The initial configuration screen.
- **Props:** `selectedGenre`, `selectedArtStyle`, `selectedLanguage`, `hero`, `friend`, `villain`, etc.
- **Functionality:** Handles character uploads, auto-generation requests, and story parameter selection.

### `Book.tsx`
The main reading interface.
- **Props:** `pages` (array of `PageData`), `onChoice` (callback for user decisions).
- **Functionality:** Renders the sequence of comic panels and handles user interaction with choices.

### `Panel.tsx`
Represents a single comic panel.
- **Props:** `panel` (PanelData), `onChoice`, `isLatest`, `onChat`, `onRoll`.
- **Functionality:** Displays the generated image, narrative text, and available choices. Handles dice rolls and initiates character chats.

## Dialogs & Overlays

### `CharacterChatDialog.tsx`
An interactive chat interface.
- **Props:** `persona`, `role`, `onSendMessage`, `onReadAloud`, `lang`.
- **Functionality:** Allows the user to converse with a specific character.

### `MultiverseMap.tsx`
Visualizes the story tree.
- **Props:** `history`, `currentIndex`, `onSelectNode`, `lang`.
- **Functionality:** Renders a node-based map of the narrative and allows navigation to previous states.

### `Inventory.tsx`
Displays user stats and items.
- **Props:** `worldState`, `lang`.
- **Functionality:** Shows health, status effects, and collected items.

### `ExportDialog.tsx`
Handles comic export.
- **Props:** `onExport`, `isExporting`, `lang`.
- **Functionality:** Provides options for exporting to PDF or ZIP.

### `TTSSettingsDialog.tsx`
Configures Text-to-Speech.
- **Props:** `settings`, `onSave`, `lang`.
- **Functionality:** Allows the user to adjust voice speed and auto-read preferences.
