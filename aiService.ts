
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Service layer for interacting with Google GenAI.
 * Handles Text, Image, Video, and Audio generation.
 */

import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';
import { ComicFace, Beat, Persona, LetterItem, MAX_STORY_PAGES, WorldState, Bubble } from './types';

// --- Model Constants ---
const MODEL_IMAGE_GEN_NAME = "gemini-3-pro-image-preview";
const MODEL_IMAGE_EDIT_NAME = "gemini-2.5-flash-image"; 
const MODEL_TEXT_NAME = "gemini-3-pro-preview";         
const MODEL_TTS_NAME = "gemini-2.5-flash-preview-tts";
const MODEL_VEO = 'veo-3.1-fast-generate-preview';      

/**
 * Executes an async function with exponential backoff retry logic.
 */
export const callWithRetry = async <T,>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            lastError = e;
            const msg = JSON.stringify(e) + String(e);
            const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
            
            if (isOverloaded && i < retries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`Model overloaded. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw e;
        }
    }
    throw lastError;
};

export const getGenreKeywords = (genre: string): string => {
    switch (genre) {
        case "Classic Horror": return "Gothic, macabre, Victorian attire, eerie lighting, shadow-heavy.";
        case "Superhero Action": return "Iconic spandex costume, muscular, heroic stance, bright primary colors.";
        case "Dark Sci-Fi": return "Cybernetic enhancements, visor, tactical heavy armor, weathered metal.";
        case "High Fantasy": return "Mythical plate armor, enchanted glowing weapons, ornate leather.";
        case "Neon Noir Detective": return "Classic trench coat, glowing neon accents, rainy atmosphere.";
        case "Wasteland Apocalypse": return "Rugged scavenged gear, desert goggles, spiked armor, dusty textures.";
        default: return "Distinctive clothing, clear silhouette.";
    }
};

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates audio for a specific line of dialogue.
 */
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

/**
 * Generates a response from a specific character persona.
 */
export const generateCharacterResponse = async (
    persona: Persona,
    role: string,
    userMessage: string,
    currentScene: string,
    genre: string,
    langName: string
): Promise<string> => {
    const prompt = `
You are ${persona.name}, the ${role} of a ${genre} comic book.
Your Backstory: ${persona.backstory}

The current scene in the story is: "${currentScene}"
A reader is speaking to you directly or giving you a command.

Reader's message: "${userMessage}"

INSTRUCTIONS:
1. Respond purely in character. 
2. Use the tone appropriate for your genre and backstory.
3. Keep it relatively brief, like a comic book speech bubble (under 50 words).
4. Respond in ${langName}.

ONLY return the text of your response.
`;

    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: MODEL_TEXT_NAME,
        contents: prompt
    }));
    return res.text || "I have nothing to say to you, mortal.";
};

export const generateLetters = async (history: ComicFace[], langName: string): Promise<LetterItem[]> => {
    const summary = history.filter(h => h.narrative).map(h => `Page ${h.pageIndex}: ${h.narrative?.scene}`).join('\n');
    const prompt = `Story Summary: ${summary}. Write 3 fictional fan letters in ${langName} from passionate comic fans. JSON: [{user, location, text, sentiment}]`;
    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } 
    }));
    const rawText = res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "[]";
    return JSON.parse(rawText);
};

export const generateCharacterBios = async (genre: string, tone: string, langName: string, hasFriend: boolean, hasVillain: boolean) => {
    const prompt = `GENRE: ${genre}. TONE: ${tone}. Generate JSON dossiers for Hero${hasFriend ? ', Friend' : ''}${hasVillain ? ', Villain' : ''} in ${langName}. Focus on dramatic motivations and unique character quirks that fit the ${genre} setting.`;
    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } 
    }));
    return JSON.parse(res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}");
};

export const generateBeat = async (
    pageNum: number, 
    history: ComicFace[], 
    hero: Persona, 
    friend: Persona | null, 
    villain: Persona | null,
    genre: string,
    tone: string,
    langName: string,
    customPremise: string,
    richMode: boolean,
    isDecisionPage: boolean,
    worldState: WorldState
): Promise<Beat> => {
    
    const lastPage = history.filter(p => p.type === 'story').pop();
    const recentChoice = lastPage?.resolvedChoice;

    let inventoryStr = worldState.inventory.length ? `INVENTORY: ${worldState.inventory.join(', ')}.` : "INVENTORY: Empty.";
    let statusStr = worldState.status.length ? `STATUS: ${worldState.status.join(', ')}.` : "STATUS: Healthy.";
    
    let charInfo = `HERO: ${hero.name}`;
    if (hero.backstory) charInfo += ` (Persona: ${hero.backstory})`;
    
    if (friend) {
        charInfo += `\nALLY: ${friend.name}`;
        if (friend.backstory) charInfo += ` (Persona: ${friend.backstory})`;
    }
    if (villain) {
        charInfo += `\nVILLAIN: ${villain.name}`;
        if (villain.backstory) charInfo += ` (Persona: ${villain.backstory})`;
    }

    const recentPanels = history
        .filter(p => p.type === 'story' && p.bubbles && p.bubbles.length > 0)
        .slice(-3);
        
    let dialogueHistory = "";
    if (recentPanels.length > 0) {
        dialogueHistory = "\nRECENT CONVERSATION HISTORY:\n";
        recentPanels.forEach(p => {
             dialogueHistory += `[Page ${p.pageIndex}]\n`;
             p.bubbles?.forEach(b => {
                 if (b.type === 'speech' || b.type === 'thought') {
                     const speaker = b.character || "NARRATOR";
                     dialogueHistory += `  ${speaker}: "${b.text}"\n`;
                 }
             });
        });
    }

    const prompt = `
You are a master comic book scriptwriter. This is Page ${pageNum} of ${MAX_STORY_PAGES}.
GENRE: ${genre}. TONE: ${tone}.
LANGUAGE: ${langName}.

WORLD STATE:
${inventoryStr}
${statusStr}

CHARACTERS:
${charInfo}

${dialogueHistory}

PREVIOUS PLOT POINT: "${lastPage?.narrative?.scene || 'The story begins...'}"
USER DECISION: "${recentChoice || 'N/A'}"

INSTRUCTIONS:
1. Advance the plot logically based on the USER DECISION.
2. Maintain STRICT DIALOGUE CONTINUITY. New speech bubbles must feel like a direct response to the RECENT CONVERSATION HISTORY.
3. Update WORLD STATE if the hero finds an item or gets injured.
4. Ensure character voices are distinct and consistent with their personas.
5. SCENE DESCRIPTION must be a VISUAL-ONLY description for an artist. CLEAN ART, NO TEXT.

RETURN JSON:
{
  "scene": "Cinematic visual description. NO TEXT in image.",
  "focus_char": "hero"|"friend"|"villain"|"other",
  "bubbles": [
     { "id": "1", "text": "Dialogue...", "type": "speech"|"caption"|"thought"|"sfx", "character": "Name", "x": 50, "y": 10 }
  ],
  "world_update": {
      "add_items": ["Item Name"],
      "remove_items": ["Item Name"],
      "add_status": ["Status"],
      "remove_status": ["Status"]
  },
  "choices": ["Next Option A", "Next Option B"]
}
`;

    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
        model: MODEL_TEXT_NAME, 
        contents: prompt, 
        config: { responseMimeType: 'application/json' } 
    }));
    
    let rawText = res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    const parsed = JSON.parse(rawText);
    
    if (!parsed.bubbles) parsed.bubbles = [];
    if (!parsed.world_update) parsed.world_update = {};
    if (!parsed.choices) parsed.choices = [];
    if (isDecisionPage && parsed.choices.length < 2) parsed.choices = ["Push Forward", "Wait and See"];
    
    return parsed as Beat;
};

export const reviseBeat = async (
    currentBeat: Beat,
    instruction: string
): Promise<Beat> => {
    const prompt = `
You are a comic book editor revising a script.
Current Panel Data:
${JSON.stringify(currentBeat, null, 2)}

User Instruction: "${instruction}"

Task: Rewrite the 'scene', 'bubbles', and 'choices' (if applicable) based on the instruction while keeping the overall story arc consistent.
Keep the JSON structure exactly the same.
Ensure 'scene' is a visual description.
**CRITICAL: The scene must remain TEXT-FREE.**

RETURN JSON ONLY.
`;

    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: MODEL_TEXT_NAME,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    }));

    let rawText = res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    const parsed = JSON.parse(rawText);
    return parsed as Beat;
};

export const generatePersona = async (desc: string, artStyle: string, genre: string): Promise<Persona> => {
    const ai = getAI();
    const keywords = getGenreKeywords(genre);
    const promptText = `Full body concept art of ${desc} in a ${genre} setting. 
    Visual cues: ${keywords}. 
    Art Style: ${artStyle}. 
    Neutral background, no text, character design sheet quality.`;

    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: MODEL_IMAGE_GEN_NAME,
        contents: { parts: [{ text: promptText }] },
        config: { imageConfig: { aspectRatio: '1:1' } }
    }));
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return { base64: part.inlineData.data, desc };
    throw new Error("Persona failed");
};

export const generateImage = async (
    beat: Beat, 
    type: ComicFace['type'], 
    artStyle: string, 
    genre: string, 
    langName: string,
    hero: Persona | null,
    friend: Persona | null,
    villain: Persona | null,
    worldState: WorldState
): Promise<string> => {
    const parts = [];
    if (hero?.base64) parts.push({ text: "Visual Reference [HERO]:" }, { inlineData: { mimeType: 'image/jpeg', data: hero.base64 } });
    if (friend?.base64) parts.push({ text: "Visual Reference [ALLY]:" }, { inlineData: { mimeType: 'image/jpeg', data: friend.base64 } });
    if (villain?.base64) parts.push({ text: "Visual Reference [VILLAIN]:" }, { inlineData: { mimeType: 'image/jpeg', data: villain.base64 } });

    let contextPrompt = "";
    if (worldState.inventory.length > 0) contextPrompt += ` The hero is currently using: ${worldState.inventory.join(', ')}.`;
    if (worldState.status.length > 0) contextPrompt += ` Character visual state: ${worldState.status.join(', ')}.`;

    let promptText = `ART STYLE: ${artStyle}. GENRE: ${genre}. ${contextPrompt}`;
    
    if (type === 'cover') {
        promptText += ` HIGH-END COMIC COVER ART. Dynamic cinematic lighting, epic composition. CLEAN ART. NO TEXT, NO SPEECH BUBBLES.`;
    } else {
        promptText += ` SCENE: ${beat.scene}. **MANDATORY: CLEAN TEXT-FREE ART. NO DIALOGUE, NO BUBBLES.**`;
    }

    parts.push({ text: promptText });

    const ai = getAI();
    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_IMAGE_GEN_NAME,
      contents: { parts },
      config: { imageConfig: { aspectRatio: '3:4' } }
    }));
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    return '';
};

export const editImage = async (
    originalBase64: string,
    instruction: string
): Promise<string> => {
    const ai = getAI();
    const parts = [
        { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
        { text: `${instruction}. Preserve character consistency. NO TEXT.` }
    ];

    const res = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: MODEL_IMAGE_EDIT_NAME,
        contents: { parts }
    }));
    
    const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    throw new Error("Edit failed");
};

export const generateVeoVideo = async (base64Data: string, sceneDescription: string, isCover: boolean): Promise<string> => {
    const ai = getAI();
    let veoprompt = `Motion comic style, subtle parallax animation, 4k, ${sceneDescription}. NO TEXT.`;
    if (isCover) veoprompt = "Cinematic slow-motion comic cover, breathing life into the characters, epic mood lighting, 4k. NO TEXT.";

    let operation = await callWithRetry<any>(() => ai.models.generateVideos({
        model: MODEL_VEO,
        image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
        prompt: veoprompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    }));
    
    while (!operation.done) {
        await new Promise(r => setTimeout(r, 4000));
        operation = await callWithRetry<any>(() => ai.operations.getVideosOperation({ operation }));
    }
    
    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (uri) {
        const vidRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
        const blob = await vidRes.blob();
        return URL.createObjectURL(blob);
    }
    throw new Error("No video");
};
