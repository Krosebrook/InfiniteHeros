# Testing Strategy

Infinite Heroes relies primarily on manual testing and static analysis to ensure quality, given its heavy reliance on non-deterministic AI generation.

## Static Analysis
- **TypeScript:** The codebase uses strict TypeScript to catch type errors during development.
- **Linting:** Run `npm run lint` (`tsc --noEmit`) to verify that there are no compilation errors before committing changes.

## Manual Testing Flows
When contributing new features or fixing bugs, please manually verify the following core flows:

1. **Onboarding:**
   - Verify the API Key dialog appears on first load.
   - Enter an invalid key and verify the error handling.
   - Enter a valid key and proceed to Setup.

2. **Character Setup:**
   - Upload an image for the Hero and verify the auto-generated bio.
   - Click "Auto-Generate" for the Villain and verify the result.
   - Change the Language and verify the UI updates immediately.

3. **Story Generation:**
   - Start an adventure and verify the first panel generates correctly (text and image).
   - Make a choice and verify the next panel generates contextually.
   - Test a choice that requires a dice roll.

4. **Interactive Features:**
   - Open the Character Chat and send a message. Verify the response.
   - Open the Multiverse Map, select a previous node, and verify the story state resets correctly.
   - Toggle the TTS auto-read setting and verify audio playback.

5. **Export:**
   - Generate a 3-page comic.
   - Export as PDF (Medium size) and verify the downloaded file opens correctly.
   - Export as ZIP and verify the contents (images and text files).
