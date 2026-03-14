# Troubleshooting Guide

This guide addresses common issues users or developers might encounter while using or building Infinite Heroes.

## 1. API Key Issues
**Problem:** The app says "Invalid API Key" or fails to generate content immediately.
**Solution:**
- Ensure you have generated a valid API key from Google AI Studio.
- Check that the key has not expired or been revoked.
- Verify that your Google Cloud Project has billing enabled, as some models (like `gemini-3.1-flash-image-preview`) require a paid tier.

## 2. Image Generation Failures
**Problem:** The comic panel shows a placeholder image or an error message instead of the generated artwork.
**Solution:**
- **Safety Filters:** The Gemini API has strict safety filters. If the generated prompt contains violence, explicit content, or copyrighted characters, the image generation will be blocked. Try choosing a different, less sensitive choice in the story.
- **Rate Limits:** You may have exceeded the API rate limit. Wait a few moments and try again.

## 3. Text-to-Speech (TTS) Not Working
**Problem:** Clicking the speaker icon does not play any audio.
**Solution:**
- Ensure your browser supports the Web Speech API (`window.speechSynthesis`).
- Check your device's volume settings.
- Some browsers require user interaction (like a click) before allowing audio playback. Ensure you have interacted with the page.

## 4. Export Fails (PDF/ZIP)
**Problem:** Clicking "Export" hangs or fails to download the file.
**Solution:**
- Exporting a large comic with many high-resolution images can consume significant memory. Try exporting using the "Web Friendly (50%)" size option.
- Ensure you have enough free disk space on your device.

## 5. Development: "module not found"
**Problem:** Running `npm run dev` throws errors about missing modules.
**Solution:**
- Run `npm install` to ensure all dependencies are installed correctly.
