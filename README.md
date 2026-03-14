# Infinite Heroes (Flash Comics)

An interactive, AI-powered comic book generation application built with React, Vite, and the Google Gemini API. Create dynamic stories, upload custom characters, and watch your adventure unfold in real-time comic panels.

## Features
- **Dynamic Storytelling:** AI-driven narrative that adapts to your choices.
- **Real-time Art:** Comic panels generated on the fly matching your chosen art style.
- **Character Customization:** Upload your own images or let the AI generate Heroes and Villains.
- **Multiverse Map:** Time travel to previous decisions and explore branching storylines.
- **Interactive Chat:** Converse directly with the characters in your story.
- **Export:** Save your creations as PDF or ZIP files.
- **Localization:** Available in 12+ languages.

## Tech Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS
- `@google/genai` (Gemini 3.1 Pro & Flash Image)
- Framer Motion

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (with billing enabled for image generation).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flash-comics.git
   cd flash-comics
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000` (or the port specified by Vite).
5. Enter your Gemini API key when prompted in the app.

## Documentation
Comprehensive documentation can be found in the `docs/` directory:
- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Contributing](docs/CONTRIBUTING.md)

## License
This project is licensed under the Apache 2.0 License.
