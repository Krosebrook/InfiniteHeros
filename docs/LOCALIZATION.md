# Localization (i18n)

The application supports multiple languages to provide a localized experience for users worldwide.

## Implementation
Localization is handled by a simple dictionary-based approach in the `translations.ts` file.

### `translations.ts`
This file exports a `translations` object containing key-value pairs for each supported language code (e.g., `en-US`, `es-MX`, `ja-JP`).

```typescript
export const translations: Record<string, Record<string, string>> = {
  "en-US": {
    "START_ADVENTURE": "START ADVENTURE!",
    // ...
  },
  "es-MX": {
    "START_ADVENTURE": "¡COMENZAR AVENTURA!",
    // ...
  }
};
```

### The `t()` Function
A helper function `t(langCode, key)` is used throughout the application to retrieve the localized string. If a translation is missing for the selected language, it falls back to English (`en-US`), and if the key is not found in English, it returns the key itself.

```typescript
import { t } from './translations';

// Usage in a component
<button>{t(selectedLanguage, "START_ADVENTURE")}</button>
```

## Adding a New Language
1. Open `translations.ts`.
2. Add a new key to the `translations` object with the appropriate language code (e.g., `fr-FR`).
3. Copy the keys from the `en-US` object and provide the translated values.
4. Update the `LANGUAGES` array in `types.ts` to include the new language option in the Setup menu.
