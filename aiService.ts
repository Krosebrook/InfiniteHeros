/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { ComicFace, Beat, Persona, LetterItem, MAX_STORY_PAGES, WorldState, Bubble, PanelLayout } from './types';

const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_IMAGE_EDIT_NAME = "gemini-2.5-flash-image"; 
const MODEL_TEXT_NAME = "gemini-3-pro-preview";         
const MODEL_TTS_NAME = "gemini-2.5-flash-preview-tts";
const MODEL_VEO = 'veo-3.1-fast-generate-preview';      
const MODEL_VISION_NAME = 'gemini-3-flash-preview';

export const callWithRetry = async <T,>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try { return await fn(); } catch (e: any) {
            lastError = e;
            const msg = JSON.stringify(e) + String(e);
            if ((msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE')) && i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw e;
        }
    }
    throw lastError;
};

const getAI = () => {
    const key = process.env.API_KEY;
    if (!key) {
        throw new Error("API_KEY_INVALID: Please select a valid API Key.");
    }
    return new GoogleGenAI({ apiKey: key });
};

export const generateTTS = async (text: string, voiceName: string): Promise<string | undefined> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_TTS_NAME,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateCharacterResponse = async (persona: Persona, role: string, userMessage: string, currentScene: string, genre: string, langName: string): Promise<string> => {
    const prompt = `You are ${persona.name}, ${role} of a ${genre} comic. Role: ${persona.backstory}. Scene: ${currentScene}. Message: ${userMessage}. Language: ${langName}. Short response.`;
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt });
    return res.text || "...";
};

export const generateLetters = async (history: ComicFace[], langName: string): Promise<LetterItem[]> => {
    const prompt = `Generate 3 fictional fan letters in ${langName} based on a comic. JSON: [{user, location, text, sentiment}]`;
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
    return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "[]");
};

export const generateCharacterBios = async (genre: string, tone: string, langName: string, hasFriend: boolean, hasVillain: boolean) => {
    const prompt = `Genre: ${genre}. Tone: ${tone}. Language: ${langName}. Detailed JSON dossiers for Hero${hasFriend?', Ally':''}${hasVillain?', Villain':''}. Format: {hero: {name, backstory}, ...}`;
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
    return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}");
};

export const generateItemIcon = async (itemName: string, genre: string): Promise<string> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: MODEL_IMAGE_GEN_NAME,
        contents: { parts: [{ text: `Pixel art icon for ${itemName} in a ${genre} world. White background.` }] },
        config: { imageConfig: { aspectRatio: '1:1' } }
    });
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : '';
};

export const generateBeat = async (
    pageNum: number, history: ComicFace[], hero: Persona, friend: Persona | null, villain: Persona | null, 
    genre: string, tone: string, langName: string, customPremise: string, richMode: boolean, isDecisionPage: boolean, worldState: WorldState,
    rollResult?: { value: number, isSuccess: boolean },
    preferredLayout?: PanelLayout
): Promise<Beat> => {
    const lastPage = history[history.length - 1];
    
    // Lookback Mechanism: Extract context from last 3 pages
    const lookbackWindow = history.slice(-3);
    const storySoFar = lookbackWindow.map(page => {
        const panels = page.panels?.map(p => `[${p.description}]`).join(' ') || '';
        const dialogue = page.bubbles?.map(b => `${b.character || 'Unknown'}: "${b.text}"`).join(' | ') || '';
        return `Page ${page.pageIndex}: ${panels} \nDialogue: ${dialogue}`;
    }).join('\n\n');

    const prompt = `
Advance ${genre} comic (Page ${pageNum}). Tone: ${tone}. Lang: ${langName}.
CHARS: Hero(${hero.name}), Ally(${friend?.name}), Villain(${villain?.name}).
WORLD: Health(${worldState.health}%), Inv(${worldState.inventory.map(i=>i.name).join(', ')}), NPCs(${worldState.npcs.map(n=>n.name).join(', ')}).
ROLL: ${rollResult ? `Roll ${rollResult.value} (${rollResult.isSuccess?'Success':'Fail'})` : 'None'}.
ACTION: ${lastPage?.resolvedChoice}.

PREVIOUS CONTEXT (Use for continuity):
${storySoFar}

INSTRUCTIONS:
1. Advance story organically from PREVIOUS CONTEXT.
2. Maintain consistent character voices based on previous dialogue.
3. Track World State. 
4. Update Health (delta -20 to +20).
5. Discover new NPCs if applicable.
${preferredLayout ? `6. PREFERRED LAYOUT: ${preferredLayout}` : ''}
7. Provide 3-4 diverse choices for the player, considering the story's current state and character motivations.

JSON:
{
  "layout": "single" | "2_vertical" | "2x2_grid",
  "panels": [{ "description": "Scene", "bubbles": [{ "text": "...", "character": "...", "type": "speech" }] }],
  "world_update": { 
     "health_delta": number, "add_items": [], "remove_items": [], 
     "new_npcs": [{"name": "...", "backstory": "..."}],
     "achievement_id": "risky_roller" | "first_choice" | "survivor" | null
  },
  "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"]
}
`;
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
    return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}") as Beat;
};

export const reviseBeat = async (currentBeat: Beat, instruction: string): Promise<Beat> => {
    const prompt = `Revise JSON script: ${instruction}. Original: ${JSON.stringify(currentBeat)}`;
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
    return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}") as Beat;
};

export const generatePersona = async (desc: string, artStyle: string, genre: string): Promise<Persona> => {
    const ai = getAI();
    const prompt = `Concept Art Character Sheet. Genre: ${genre}. Art Style: ${artStyle}. 
    Character Description: ${desc}. 
    Focus: Full body design, expressive pose, detailed clothing and accessories fitting the genre. 
    Background: Neutral, solid color. NO TEXT, NO LABELS, NO SPEECH BUBBLES.`;

    const res = await ai.models.generateContent({
        model: MODEL_IMAGE_GEN_NAME,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: '1:1' } }
    });
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("Persona failed");
    return { base64: part.inlineData.data, desc };
};

export const generateCharacterDetailsFromImage = async (base64: string, genre: string, langName: string, mimeType: string = 'image/jpeg'): Promise<{ name: string, backstory: string }> => {
    const ai = getAI();
    const prompt = `Analyze this character image for a ${genre} comic. 
    1. Give them a cool, fitting name in ${langName}.
    2. Write a 2-3 sentence backstory/description in ${langName} based on their appearance.
    Return JSON: { "name": "...", "backstory": "..." }`;
    
    const res = await ai.models.generateContent({
        model: MODEL_VISION_NAME,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt }
            ]
        },
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{"name": "Traveler", "backstory": "A mysterious character."}');
    } catch (e) {
        console.error("Failed to parse character details from image", e);
        return { name: "Traveler", backstory: res.text || "A mysterious character." };
    }
};

export const describeCharacter = async (base64: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const ai = getAI();
    const res = await ai.models.generateContent({
        model: MODEL_VISION_NAME,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: "Describe this character's physical appearance in detail for a comic book artist. Focus on clothing, face, and distinctive features." }
            ]
        }
    });
    return res.text || "A mysterious character.";
};

export const generateComicTitle = async (heroName: string, genre: string, langName: string): Promise<string> => {
    const ai = getAI();
    const prompt = `Generate a catchy, dramatic comic book title for a ${genre} comic starring a hero named '${heroName}'. Return ONLY the title in ${langName}, nothing else. No quotes.`;
    const res = await callWithRetry(() => ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt }));
    return res.text?.trim().replace(/^["']|["']$/g, '') || `${heroName}'s Adventure`;
};

export const generateCoverImage = async (title: string, comicName: string, artStyle: string, genre: string, hero: Persona | null, friend: Persona | null, villain: Persona | null, worldState: WorldState, aspectRatio: string = '3:4'): Promise<string> => {
    const parts = [];
    
    if (hero?.base64) {
        const label = hero.locked ? "Strict Reference Hero (Main Character):" : "Reference Hero:";
        parts.push({ text: label }, { inlineData: { mimeType: hero.mimeType || 'image/jpeg', data: hero.base64 } });
    }
    if (friend?.base64) {
        const label = friend.locked ? "Strict Reference Ally:" : "Reference Ally:";
        parts.push({ text: label }, { inlineData: { mimeType: friend.mimeType || 'image/jpeg', data: friend.base64 } });
    }
    if (villain?.base64) {
        const label = villain.locked ? "Strict Reference Villain:" : "Reference Villain:";
        parts.push({ text: label }, { inlineData: { mimeType: villain.mimeType || 'image/jpeg', data: villain.base64 } });
    }

    let prompt = `A comic book cover for '${comicName}'. Title: '${title}'. Style: ${artStyle}. Genre: ${genre}. Featuring the hero prominently. The text '${comicName}' and '${title}' should be clearly visible and stylized appropriately for the genre.`;
    
    if (hero?.locked || friend?.locked || villain?.locked) {
        prompt += " IMPORTANT: The provided reference images for locked characters must be followed STRICTLY for facial features, clothing, and style.";
    }

    parts.push({ text: prompt });
    
    const ai = getAI();
    const res = await callWithRetry(() => ai.models.generateContent({ model: MODEL_IMAGE_GEN_NAME, contents: { parts }, config: { imageConfig: { aspectRatio } } }));
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : '';
};

export const generateImage = async (panelDesc: string, artStyle: string, genre: string, hero: Persona | null, friend: Persona | null, villain: Persona | null, worldState: WorldState, aspectRatio: string = '1:1'): Promise<string> => {
    const parts = [];
    
    // Include all character references if they exist, prioritizing locked ones in text description
    if (hero?.base64) {
        const label = hero.locked ? "Strict Reference Hero (Main Character):" : "Reference Hero:";
        parts.push({ text: label }, { inlineData: { mimeType: hero.mimeType || 'image/jpeg', data: hero.base64 } });
    }
    if (friend?.base64) {
        const label = friend.locked ? "Strict Reference Ally:" : "Reference Ally:";
        parts.push({ text: label }, { inlineData: { mimeType: friend.mimeType || 'image/jpeg', data: friend.base64 } });
    }
    if (villain?.base64) {
        const label = villain.locked ? "Strict Reference Villain:" : "Reference Villain:";
        parts.push({ text: label }, { inlineData: { mimeType: villain.mimeType || 'image/jpeg', data: villain.base64 } });
    }

    let prompt = `Style: ${artStyle}. Genre: ${genre}. Scene: ${panelDesc}. NO TEXT.`;
    
    // Append instruction for locked characters
    if (hero?.locked || friend?.locked || villain?.locked) {
        prompt += " IMPORTANT: The provided reference images for locked characters must be followed STRICTLY for facial features, clothing, and style.";
    }

    parts.push({ text: prompt });
    
    const ai = getAI();
    const res = await ai.models.generateContent({ model: MODEL_IMAGE_GEN_NAME, contents: { parts }, config: { imageConfig: { aspectRatio } } });
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : '';
};

export const editImage = async (originalBase64: string, instruction: string): Promise<string> => {
    const ai = getAI();
    const parts = [{ inlineData: { mimeType: 'image/jpeg', data: originalBase64 } }, { text: `${instruction}. NO TEXT.` }];
    const res = await ai.models.generateContent({ model: MODEL_IMAGE_EDIT_NAME, contents: { parts } });
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : '';
};

export const generateVeoVideo = async (base64Data: string, sceneDescription: string, isCover: boolean): Promise<string> => {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
        model: MODEL_VEO,
        image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
        prompt: `Motion comic of ${sceneDescription}`,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });
    while (!operation.done) {
        await new Promise(r => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
    }
    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    const vidRes = await fetch(uri as string, {
        method: 'GET',
        headers: {
            'x-goog-api-key': process.env.API_KEY || '',
        },
    });
    const blob = await vidRes.blob();
    return URL.createObjectURL(blob);
};
