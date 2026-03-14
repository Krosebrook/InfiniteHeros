# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-13
### Added
- **Localization:** Full support for 12 languages (en-US, es-MX, ja-JP, fr-FR, de-DE, pt-BR, zh-CN, it-IT, ru-RU, ko-KR, hi-IN, ar-EG).
- **Translation Keys:** Added comprehensive translation keys for ExportDialog, TTSSettingsDialog, and CharacterChatDialog.
- **Linting:** Added `npm run lint` script to `package.json` for TypeScript verification.

### Changed
- Updated `App.tsx` to pass the `lang` prop to all dialog components dynamically.
- Refactored `CharacterChatDialog` to use the `t()` function for all UI text.

## [1.0.0] - Initial Release
### Added
- Core comic generation engine using Gemini 3.1 Pro and Flash Image models.
- Setup screen with Character Upload and Auto-generation.
- Interactive reading interface with branching choices and dice rolls.
- Multiverse Map for navigating story history.
- Inventory and Status tracking.
- Text-to-Speech (TTS) integration.
- PDF and ZIP export functionality.
- Client-side API key management.
