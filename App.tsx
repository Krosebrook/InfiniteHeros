
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, LETTERS_PAGE, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, GENRES, ART_STYLES, TONES, LANGUAGES, ComicFace, Beat, Persona, LetterItem } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { CharacterBios } from './CharacterBios';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { soundManager } from './SoundManager';
import { saveGame, loadGame, clearSave } from './db';

// --- Constants ---
const MODEL_V3 = "gemini-3-pro-image-preview";
const MODEL_IMAGE_GEN_NAME = MODEL_V3;
const MODEL_TEXT_NAME = MODEL_V3;
const MODEL_VEO = 'veo-3.1-fast-generate-preview';

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [villain, setVillainState] = useState<Persona | null>(null);
  
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedArtStyle, setSelectedArtStyle] = useState(ART_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [hasSave, setHasSave] = useState(false);
  const [showBios, setShowBios] = useState(false);
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);
  const villainRef = useRef<Persona | null>(null);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  const setVillain = (p: Persona | null) => { setVillainState(p); villainRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Persistence ---
  useEffect(() => {
    loadGame().then(save => {
        if (save && save.isStarted && save.comicFaces.length > 0) {
            setHasSave(true);
        }
    });
  }, []);

  const handleResume = async () => {
      const save = await loadGame();
      if (!save) return;
      
      soundManager.play('success');
      setHero(save.hero);
      setFriend(save.friend);
      setVillain(save.villain);
      setComicFaces(save.comicFaces);
      historyRef.current = save.comicFaces;
      setCurrentSheetIndex(save.currentSheetIndex);
      setIsStarted(true);
      setShowSetup(false);
      setSelectedGenre(save.selectedGenre);
      setSelectedArtStyle(save.selectedArtStyle || ART_STYLES[0]);
      setSelectedLanguage(save.selectedLanguage);
      setStoryTone(save.storyTone);
  };

  const triggerAutoSave = () => {
      if (!isStarted) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
          saveGame({
              hero: heroRef.current,
              friend: friendRef.current,
              villain: villainRef.current,
              comicFaces: historyRef.current, // Use ref for most up to date
              currentSheetIndex,
              isStarted,
              selectedGenre,
              selectedArtStyle,
              selectedLanguage,
              storyTone,
              timestamp: Date.now()
          }).catch(e => console.error("Auto-save failed", e));
      }, 2000); // Debounce 2s
  };

  useEffect(() => {
      triggerAutoSave();
  }, [comicFaces, currentSheetIndex, isStarted]);


  // --- AI Helpers ---
  const getAI = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  };

  const handleAPIError = (e: any) => {
    const msg = String(e);
    console.error("API Error:", msg);
    if (
      msg.includes('Requested entity was not found') || 
      msg.includes('API_KEY_INVALID') || 
      msg.toLowerCase().includes('permission denied')
    ) {
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateLetters = async (history: ComicFace[]): Promise<LetterItem[]> => {
      const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
      const summary = history.filter(h => h.narrative).map(h => `Page ${h.pageIndex}: ${h.narrative?.caption} (Choice made: ${h.resolvedChoice})`).join('\n');
      
      const prompt = `
        Based on this comic story summary:
        ${summary}

        Write 3 short "Letters to the Editor" from fictional fans reacting to the story.
        1. One fan who LOVED the hero's choices.
        2. One fan who is angry/shocked by the choices.
        3. One fan who is confused or has a wild theory.
        
        LANGUAGE: ${langName}.
        Return JSON: [{ "user": "Name", "location": "City", "text": "Comment", "sentiment": "positive"|"negative"|"confused" }]
      `;
      try {
        const ai = getAI();
        const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
        const rawText = res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "[]";
        return JSON.parse(rawText);
      } catch (e) {
          return [{ user: "Editor", location: "Office", text: "Thanks for reading!", sentiment: "positive" }];
      }
  };

  const generateCharacterBios = async () => {
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
    const prompt = `
      GENRE: ${selectedGenre}. TONE: ${storyTone}.
      
      Generate brief character profiles (Name and 2-sentence backstory) for:
      1. HERO (The Protagonist)
      ${friendRef.current ? '2. CO-STAR ( The Ally)' : ''}
      ${villainRef.current ? '3. VILLAIN (The Antagonist)' : ''}

      OUTPUT LANGUAGE: ${langName}.
      Return strictly valid JSON with no markdown formatting:
      {
        "hero": { "name": "Name", "backstory": "Backstory..." },
        "friend": { "name": "Name", "backstory": "Backstory..." }, // only if requested
        "villain": { "name": "Name", "backstory": "Backstory..." } // only if requested
      }
    `;

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ 
            model: MODEL_TEXT_NAME, 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        
        const raw = res.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
        const data = JSON.parse(raw);

        if (heroRef.current && data.hero) setHero({ ...heroRef.current, ...data.hero });
        if (friendRef.current && data.friend) setFriend({ ...friendRef.current, ...data.friend });
        if (villainRef.current && data.villain) setVillain({ ...villainRef.current, ...data.villain });
        
    } catch(e) {
        console.error("Bio generation failed", e);
    }
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    // Improved context formatting for the AI to track history better
    const historyText = relevantHistory.map(p => 
      `PAGE ${p.pageIndex}:
       SCENE: ${p.narrative?.scene}
       FOCUS: ${p.narrative?.focus_char}
       CAPTION: "${p.narrative?.caption || ''}"
       DIALOGUE: "${p.narrative?.dialogue || ''}"
       ${p.resolvedChoice ? `>> PLAYER CHOSE: "${p.resolvedChoice}"` : ''}`
    ).join('\n---\n');

    // --- Dynamic Character Injection & Deep Relationship Context ---
    let charInstruction = `ROLE: HERO (Protagonist) - Name: ${heroRef.current.name || 'Unknown'}.`;
    if (friendRef.current) {
        charInstruction += `\nROLE: CO-STAR (Ally) - Name: ${friendRef.current.name || 'Unknown'}. RELATIONSHIP: Deep bond/Shared History. Dialogue should be familiar, maybe even using internal logic, banter, or nicknames. They are the emotional anchor.`;
    }
    if (villainRef.current) {
        charInstruction += `\nROLE: VILLAIN (Antagonist) - Name: ${villainRef.current.name || 'Unknown'}. RELATIONSHIP: The dark reflection. Interactions should be personal and psychological, not just physical conflict. They know how to hurt the Hero.`;
    }

    // --- Villain Logic ---
    if (villainRef.current) {
        if (pageNum >= 5 && pageNum <= 8) charInstruction += "\nSTATUS: VILLAIN is now interfering directly. Complications arise.";
        if (pageNum >= 9) charInstruction += "\nSTATUS: CLIMAX. Direct confrontation between Hero and Villain.";
    }

    // Determine Core Story Driver
    let coreDriver = `GENRE: ${selectedGenre}. TONE: ${storyTone}.`;
    if (selectedGenre === 'Custom') {
        coreDriver = `STORY PREMISE: ${customPremise || "A unique adventure"}.`;
    }
    
    // Guardrails
    const guardrails = `
    NEGATIVE CONSTRAINTS:
    1. Minimize technical jargon (unless Sci-Fi).
    2. Avoid generic "bad guy" monologues.
    3. NO "As you know, Bob" exposition. Dialogue must be natural and lived-in.
    4. Avoid "The artifact" unless established previously.
    `;

    // Flow Instruction
    let instruction = `Continue the story. ALL OUTPUT TEXT MUST BE IN ${langName.toUpperCase()}. ${coreDriver} ${guardrails}`;
    if (richMode) instruction += " RICH MODE: Use internal monologue captions to reveal hidden depths, fears, and doubts.";

    if (isFinalPage) {
        instruction += " FINAL PAGE. Wrap up the immediate conflict but leave the emotional arc open or changed. End with 'TO BE CONTINUED...'.";
    } else if (isDecisionPage) {
        instruction += " Create a high-stakes DILEMMA. The choice should test the Hero's values or relationship with the Co-Star/Villain.";
    } else {
         if (pageNum === 1) instruction += " INCITING INCIDENT. Start in media res if possible. Disrupt the status quo.";
         else if (pageNum <= 4) instruction += " RISING ACTION. Show the dynamic between Hero and Co-Star (if present).";
         else if (pageNum <= 8) instruction += " COMPLICATION. Raise the stakes. Things go wrong.";
         else instruction += " CLIMAX. High energy.";
    }

    const capLimit = richMode ? "max 40 words" : "max 20 words";
    const diaLimit = richMode ? "max 35 words" : "max 15 words";

    const prompt = `
You are an expert comic book writer (e.g. Neil Gaiman, Brian K. Vaughan) known for character-driven narratives.
PAGE ${pageNum} of ${MAX_STORY_PAGES}.
TARGET LANGUAGE: ${langName}.

${coreDriver}

CHARACTERS & DYNAMICS:
${charInstruction}

STORY SO FAR:
${historyText.length > 0 ? historyText : "This is Page 1. Start the adventure. Establish the world and characters immediately."}

RULES:
1. NO REPETITION of previous dialogue or captions.
2. SHOW, DON'T TELL: Use the 'scene' description to convey emotion and relationship dynamics (e.g. 'Hero looks concerned at Friend').
3. OUTPUT LANGUAGE: ${langName}.

INSTRUCTION: ${instruction}

OUTPUT STRICT JSON ONLY:
{
  "caption": "Narrator/Internal text in ${langName}. (${capLimit}).",
  "dialogue": "Speech in ${langName}. (${diaLimit}). Natural, character-specific.",
  "scene": "Visual description (ALWAYS IN ENGLISH). Detail character expressions, lighting, and action. Mention 'HERO', 'CO-STAR', or 'VILLAIN' if present.",
  "focus_char": "hero" OR "friend" OR "villain" OR "other",
  "choices": ["Option A", "Option B"] (Only if decision page)
}
`;
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
        let rawText = res.text || "{}";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(rawText);
        
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Option A", "Option B"];
        if (!['hero', 'friend', 'villain', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return { 
            caption: "...", 
            scene: `Generic scene page ${pageNum}.`, 
            focus_char: 'hero', 
            choices: [] 
        };
    }
  };

  const generatePersona = async (desc: string): Promise<Persona> => {
      // Use selectedArtStyle instead of just genre for the character sheet
      try {
          const ai = getAI();
          const res = await ai.models.generateContent({
              model: MODEL_IMAGE_GEN_NAME,
              contents: { text: `STYLE: Masterpiece ${selectedArtStyle} character sheet, detailed ink, neutral background. FULL BODY. Character: ${desc}` },
              config: { imageConfig: { aspectRatio: '1:1' } }
          });
          const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (part?.inlineData?.data) return { base64: part.inlineData.data, desc };
          throw new Error("Failed");
      } catch (e) { 
        handleAPIError(e);
        throw e; 
      }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const contents = [];
    if (heroRef.current?.base64) {
        contents.push({ text: "REFERENCE 1 [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
    }
    if (friendRef.current?.base64) {
        contents.push({ text: "REFERENCE 2 [CO-STAR]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: friendRef.current.base64 } });
    }
    if (villainRef.current?.base64) {
        contents.push({ text: "REFERENCE 3 [VILLAIN]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: villainRef.current.base64 } });
    }

    // Combine art style and genre for the prompt
    let promptText = `STYLE: ${selectedArtStyle} comic book art. GENRE: ${selectedGenre}. Detailed ink, vibrant colors. `;
    
    if (type === 'cover') {
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        promptText += `TYPE: Comic Book Cover. TITLE: "INFINITE HEROES" (OR LOCALIZED TRANSLATION IN ${langName.toUpperCase()}). Main visual: Dynamic action shot of [HERO] vs [VILLAIN] (if present).`;
    } else if (type === 'back_cover') {
        promptText += `TYPE: Comic Back Cover. FULL PAGE VERTICAL ART. Dramatic teaser.`;
    } else {
        promptText += `TYPE: Vertical comic panel. SCENE: ${beat.scene}. `;
        promptText += `INSTRUCTIONS: Maintain strict character likeness. 
        If scene mentions 'HERO', use REFERENCE 1. 
        If scene mentions 'CO-STAR', use REFERENCE 2.
        If scene mentions 'VILLAIN', use REFERENCE 3.`;
        
        if (beat.caption) promptText += ` INCLUDE CAPTION BOX: "${beat.caption}"`;
        if (beat.dialogue) promptText += ` INCLUDE SPEECH BUBBLE: "${beat.dialogue}"`;
    }

    contents.push({ text: promptText });

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: '2:3' } }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
             soundManager.play('success'); // Play sound on success
             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return '';
    } catch (e) { 
        handleAPIError(e);
        return ''; 
    }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  const handleRegeneratePanel = async (faceId: string) => {
      soundManager.play('click');
      const face = historyRef.current.find(f => f.id === faceId);
      if (!face || !face.narrative) return;
      
      updateFaceState(faceId, { isLoading: true });
      const url = await generateImage(face.narrative, face.type);
      updateFaceState(faceId, { imageUrl: url, isLoading: false });
  };

  const handleAnimatePanel = async (faceId: string) => {
      const face = historyRef.current.find(f => f.id === faceId);
      if (!face || !face.imageUrl) return;

      soundManager.play('click');
      updateFaceState(faceId, { isAnimating: true });
      
      try {
          const ai = getAI();
          const base64Data = face.imageUrl.split(',')[1];
          let operation = await ai.models.generateVideos({
              model: MODEL_VEO,
              image: { imageBytes: base64Data, mimeType: 'image/jpeg' },
              prompt: `Cinematic subtle motion, 4k, ${face.narrative?.scene || 'comic book scene'}`,
              config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
          });
          
          // Poll
          while (!operation.done) {
              await new Promise(r => setTimeout(r, 4000));
              operation = await ai.operations.getVideosOperation({ operation });
          }
          
          const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (uri) {
              // Fetch bytes
              const vidRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
              const blob = await vidRes.blob();
              const videoUrl = URL.createObjectURL(blob);
              updateFaceState(faceId, { videoUrl, isAnimating: false });
              soundManager.play('success');
          } else {
              throw new Error("No video returned");
          }

      } catch (e) {
          console.error("Veo Error", e);
          handleAPIError(e);
          updateFaceState(faceId, { isAnimating: false });
      }
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      const isDecision = DECISION_PAGES.includes(pageNum);
      let beat: Beat = { scene: "", choices: [], focus_char: 'other' };

      if (type === 'cover') {
          // Handled in generateImage
      } else if (type === 'letters') {
           const letters = await generateLetters(historyRef.current);
           updateFaceState(faceId, { lettersContent: letters, isLoading: false });
           return; // No image generation for letters page (it's text based)
      } else if (type === 'back_cover') {
           beat = { scene: "Thematic teaser image", choices: [], focus_char: 'other' };
      } else {
           beat = await generateBeat(historyRef.current, pageNum % 2 === 0, pageNum, isDecision);
      }

      updateFaceState(faceId, { narrative: beat, choices: beat.choices, isDecisionPage: isDecision });
      const url = await generateImage(beat, type);
      updateFaceState(faceId, { imageUrl: url, isLoading: false });
  };

  const generateBatch = async (startPage: number, count: number) => {
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      const newFaces: ComicFace[] = [];
      pagesToGen.forEach(pageNum => {
          let type: ComicFace['type'] = 'story';
          if (pageNum === 0) type = 'cover';
          else if (pageNum === LETTERS_PAGE) type = 'letters';
          else if (pageNum === BACK_COVER_PAGE) type = 'back_cover';

          newFaces.push({ id: `page-${pageNum}`, type, choices: [], isLoading: true, pageIndex: pageNum });
      });

      setComicFaces(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
      });
      newFaces.forEach(f => { if (!historyRef.current.find(h => h.id === f.id)) historyRef.current.push(f); });

      try {
          for (const pageNum of pagesToGen) {
               const type = pageNum === 0 ? 'cover' : (pageNum === LETTERS_PAGE ? 'letters' : (pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story'));
               await generateSinglePage(`page-${pageNum}`, pageNum, type);
               generatingPages.current.delete(pageNum);
          }
      } catch (e) {
          console.error("Batch generation error", e);
      } finally {
          pagesToGen.forEach(p => generatingPages.current.delete(p));
      }
  }

  const handleAutoGenerateVillain = async () => {
      try {
          soundManager.play('click');
          const desc = `A menacing villain for a ${selectedGenre} story.`;
          const v = await generatePersona(desc);
          setVillain(v);
          soundManager.play('success');
      } catch(e) { console.error(e); handleAPIError(e); }
  }

  const launchStory = async () => {
    // --- API KEY VALIDATION ---
    const hasKey = await validateApiKey();
    if (!hasKey) return; 
    
    if (!heroRef.current) return;
    soundManager.play('pop');
    setIsTransitioning(true);
    
    // Tone Logic
    let availableTones = TONES;
    if (selectedGenre.includes("Comedy") || selectedGenre.includes("Slice")) {
        availableTones = TONES.filter(t => t.includes("CASUAL") || t.includes("WHOLESOME") || t.includes("QUIPPY"));
    } else if (selectedGenre === "Classic Horror") {
        availableTones = TONES.filter(t => t.includes("INNER-MONOLOGUE") || t.includes("OPERATIC"));
    }
    setStoryTone(availableTones[Math.floor(Math.random() * availableTones.length)]);

    // Start parallel tasks
    const initBios = generateCharacterBios();

    // Initial Batch
    const coverFace: ComicFace = { id: 'page-0', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
    setComicFaces([coverFace]);
    historyRef.current = [coverFace];
    generatingPages.current.add(0);

    generateSinglePage('page-0', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        await initBios; // Ensure bios are ready before starting the story logic so names can be used
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        await generateBatch(1, INITIAL_PAGES);
        generateBatch(3, 3);
    }, 1100);
  };

  const handleChoice = async (pageIndex: number, choice: string) => {
      soundManager.play('click');
      updateFaceState(`page-${pageIndex}`, { resolvedChoice: choice });
      const maxPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
      if (maxPage + 1 <= TOTAL_PAGES) {
          generateBatch(maxPage + 1, BATCH_SIZE);
      }
  }

  const resetApp = () => {
      soundManager.play('click');
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setFriend(null);
      setVillain(null);
      clearSave();
      setHasSave(false);
  };

  const downloadPDF = () => {
    soundManager.play('click');
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces.filter(face => (face.imageUrl || face.type === 'letters') && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) {
            doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
        } else if (face.type === 'letters' && face.lettersContent) {
            // Render text for letters page PDF
            doc.setFillColor(255, 255, 240);
            doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
            doc.setFontSize(24);
            doc.text("LETTERS TO THE EDITOR", 20, 40);
            let y = 80;
            face.lettersContent.forEach(l => {
                doc.setFontSize(14); doc.setFont("helvetica", "bold");
                doc.text(`${l.user} from ${l.location} writes:`, 20, y);
                y+=20;
                doc.setFontSize(12); doc.setFont("helvetica", "normal");
                const split = doc.splitTextToSize(l.text, PAGE_WIDTH - 40);
                doc.text(split, 20, y);
                y += (split.length * 14) + 20;
            });
        }
    });
    doc.save('Infinite-Heroes-Issue.pdf');
  };

  const handleHeroUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setHero({ base64, desc: "The Main Hero" }); soundManager.play('pop'); } catch (e) { alert("Upload failed"); }
  };
  const handleFriendUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setFriend({ base64, desc: "The Sidekick" }); soundManager.play('pop'); } catch (e) { alert("Upload failed"); }
  };
  const handleVillainUpload = async (file: File) => {
       try { const base64 = await fileToBase64(file); setVillain({ base64, desc: "The Villain" }); soundManager.play('pop'); } catch (e) { alert("Upload failed"); }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) return;
      
      if (index < currentSheetIndex) {
          soundManager.play('flip');
          setCurrentSheetIndex(index);
      }
      else if (index === currentSheetIndex && comicFaces.find(f => f.pageIndex === index)?.imageUrl) {
          soundManager.play('flip');
          setCurrentSheetIndex(prev => prev + 1);
      }
  };

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          friend={friend}
          villain={villain}
          selectedGenre={selectedGenre}
          selectedArtStyle={selectedArtStyle}
          selectedLanguage={selectedLanguage}
          customPremise={customPremise}
          richMode={richMode}
          hasSave={hasSave}
          onResume={handleResume}
          onHeroUpload={handleHeroUpload}
          onFriendUpload={handleFriendUpload}
          onVillainUpload={handleVillainUpload}
          onAutoGenerateVillain={handleAutoGenerateVillain}
          onGenreChange={setSelectedGenre}
          onArtStyleChange={setSelectedArtStyle}
          onLanguageChange={setSelectedLanguage}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onLaunch={launchStory}
      />
      
      <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          hero={hero}
          friend={friend}
          villain={villain}
          onOpenBio={() => setShowBios(true)}
          onSheetClick={handleSheetClick}
          onChoice={handleChoice}
          onOpenBook={() => { soundManager.play('flip'); setCurrentSheetIndex(1); }}
          onDownload={downloadPDF}
          onReset={resetApp}
          onAnimate={handleAnimatePanel}
          onRegenerate={handleRegeneratePanel}
      />
      
      {showBios && <CharacterBios hero={hero} friend={friend} villain={villain} onClose={() => setShowBios(false)} />}
    </div>
  );
};

export default App;
