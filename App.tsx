
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    MAX_STORY_PAGES, TOTAL_PAGES, LETTERS_PAGE, BACK_COVER_PAGE,
    GENRES, ART_STYLES, TONES, LANGUAGES, DECISION_PAGES,
    ComicFace, Beat, Persona, WorldState, Bubble, TTSSettings
} from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { CharacterBios } from './CharacterBios';
import { MultiverseMap } from './MultiverseMap';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { soundManager } from './SoundManager';
import { saveGame, loadGame } from './db';
import { TTSSettingsDialog } from './TTSSettingsDialog';
import { CharacterChatDialog } from './CharacterChatDialog';
import * as aiService from './aiService';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const App: React.FC = () => {
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

    const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
        autoPlay: false,
        defaultVoice: 'Kore',
        playbackSpeed: 1.0
    });

    const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [hasSave, setHasSave] = useState(false);
    const [worldState, setWorldState] = useState<WorldState>({ inventory: [], status: [], location_tags: [] });
    
    const [showBios, setShowBios] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showSetup, setShowSetup] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [activeChat, setActiveChat] = useState<{persona: Persona, role: string} | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const heroRef = useRef<Persona | null>(null);
    const friendRef = useRef<Persona | null>(null);
    const villainRef = useRef<Persona | null>(null);
    const generatingPages = useRef(new Set<number>());
    const historyRef = useRef<ComicFace[]>([]);
    const storyTreeRef = useRef<Record<string, ComicFace>>({}); 
    const worldStateRef = useRef<WorldState>({ inventory: [], status: [], location_tags: [] });
    const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
    const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
    const setVillain = (p: Persona | null) => { setVillainState(p); villainRef.current = p; };

    useEffect(() => {
        const savedSettings = localStorage.getItem('ttsSettings');
        if (savedSettings) {
            try { setTtsSettings(JSON.parse(savedSettings)); } catch(e) {}
        }
        loadGame().then(save => {
            if (save && save.isStarted && save.comicFaces.length > 0) {
                setHasSave(true);
                if (save.storyTree) storyTreeRef.current = save.storyTree;
            }
        });
    }, []);

    const triggerAutoSave = useCallback(() => {
        if (!isStarted) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
            saveGame({
                hero: heroRef.current,
                friend: friendRef.current,
                villain: villainRef.current,
                comicFaces: historyRef.current,
                storyTree: storyTreeRef.current,
                currentSheetIndex,
                isStarted,
                selectedGenre,
                selectedArtStyle,
                selectedLanguage,
                storyTone,
                timestamp: Date.now(),
                worldState: worldStateRef.current,
                ttsSettings: ttsSettings 
            }).catch(e => console.error("Auto-save failed", e));
        }, 2000);
    }, [isStarted, currentSheetIndex, selectedGenre, selectedArtStyle, selectedLanguage, storyTone, ttsSettings]);

    useEffect(() => { triggerAutoSave(); }, [comicFaces, worldState, ttsSettings, triggerAutoSave]);

    const handleSaveSettings = (newSettings: TTSSettings) => {
        setTtsSettings(newSettings);
        localStorage.setItem('ttsSettings', JSON.stringify(newSettings));
    };

    const handleResume = async () => {
        const save = await loadGame();
        if (!save) return;
        soundManager.play('success');
        setHero(save.hero); setFriend(save.friend); setVillain(save.villain);
        setComicFaces(save.comicFaces);
        historyRef.current = save.comicFaces;
        setWorldState(save.worldState || { inventory: [], status: [], location_tags: [] });
        worldStateRef.current = save.worldState || { inventory: [], status: [], location_tags: [] };
        setCurrentSheetIndex(save.currentSheetIndex);
        setIsStarted(true); setShowSetup(false);
        setSelectedGenre(save.selectedGenre);
        setSelectedArtStyle(save.selectedArtStyle || ART_STYLES[0]);
        setSelectedLanguage(save.selectedLanguage);
        setStoryTone(save.storyTone);
        if (save.ttsSettings) setTtsSettings(save.ttsSettings);
        if (save.storyTree) storyTreeRef.current = save.storyTree;
    };

    const handleAPIError = (e: any) => {
        console.error("API Error caught:", e);
        const msg = String(e) || "";
        if (msg.includes('Requested entity was not found') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
            setShowApiKeyDialog(true);
        }
    };

    const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
        setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
        const idx = historyRef.current.findIndex(f => f.id === id);
        if (idx !== -1) {
             const updated = { ...historyRef.current[idx], ...updates };
             historyRef.current[idx] = updated;
             storyTreeRef.current[id] = updated;
        }
    };

    const updateWorldState = (updates: Beat['world_update']) => {
        if (!updates) return;
        setWorldState(prev => {
            const next = { ...prev };
            if (updates.add_items) next.inventory = [...new Set([...next.inventory, ...updates.add_items])];
            if (updates.remove_items) next.inventory = next.inventory.filter(i => !updates.remove_items?.includes(i));
            if (updates.add_status) next.status = [...new Set([...next.status, ...updates.add_status])];
            if (updates.remove_status) next.status = next.status.filter(s => !updates.remove_status?.includes(s));
            worldStateRef.current = next;
            return next;
        });
    };

    const handleReadAloud = async (text: string, voiceName?: string) => {
        if (!(await validateApiKey())) return;
        try {
            const v = voiceName || ttsSettings.defaultVoice;
            const audioData = await aiService.generateTTS(text, v);
            if (audioData) await soundManager.playTTS(audioData, ttsSettings.playbackSpeed);
        } catch (e) { handleAPIError(e); }
    };

    const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type'], parentId?: string, choiceLabel?: string) => {
        if (generatingPages.current.has(pageNum)) return;
        generatingPages.current.add(pageNum);

        const isDecision = DECISION_PAGES.includes(pageNum);
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        
        try {
            if (type === 'letters') {
                const letters = await aiService.generateLetters(historyRef.current, langName);
                updateFaceState(faceId, { lettersContent: letters, isLoading: false });
            } else if (type === 'back_cover') {
                const img = await aiService.generateImage({ scene: "Epic back cover art featuring the hero's journey", choices: [], focus_char: 'hero', bubbles: [] }, 'back_cover', selectedArtStyle, selectedGenre, langName, hero, friend, villain, worldStateRef.current);
                updateFaceState(faceId, { imageUrl: img, isLoading: false });
            } else {
                const beat = await aiService.generateBeat(pageNum, historyRef.current, hero!, friend, villain, selectedGenre, storyTone, langName, customPremise, richMode, isDecision, worldStateRef.current);
                updateWorldState(beat.world_update);
                const img = await aiService.generateImage(beat, type, selectedArtStyle, selectedGenre, langName, hero, friend, villain, worldStateRef.current);
                updateFaceState(faceId, { narrative: beat, imageUrl: img, bubbles: beat.bubbles, choices: beat.choices, isLoading: false });
                
                if (ttsSettings.autoPlay && beat.bubbles?.length > 0) {
                    const text = beat.bubbles.map(b => b.text).join('. ');
                    handleReadAloud(text, beat.focus_char === 'hero' ? 'Fenrir' : beat.focus_char === 'friend' ? 'Puck' : beat.focus_char === 'villain' ? 'Charon' : ttsSettings.defaultVoice);
                }
            }
        } catch (e) {
            handleAPIError(e);
            updateFaceState(faceId, { isLoading: false });
        } finally {
            generatingPages.current.delete(pageNum);
        }
    };

    const handleLaunch = async () => {
        if (!hero || !(await validateApiKey())) return;
        setIsTransitioning(true);
        soundManager.play('magic');
        
        const initialFaces: ComicFace[] = [
            { id: uuidv4(), type: 'cover', choices: [], isLoading: true, pageIndex: 0 },
            { id: uuidv4(), type: 'story', choices: [], isLoading: true, pageIndex: 1 }
        ];

        setComicFaces(initialFaces);
        historyRef.current = initialFaces;
        initialFaces.forEach(f => storyTreeRef.current[f.id] = f);

        setTimeout(() => {
            setIsStarted(true);
            setShowSetup(false);
            setIsTransitioning(false);
            generateSinglePage(initialFaces[0].id, 0, 'cover');
            generateSinglePage(initialFaces[1].id, 1, 'story');
        }, 1500);
    };

    const handleChoice = async (pageIndex: number, choice: string) => {
        const nextPageNum = pageIndex + 1;
        if (nextPageNum > MAX_STORY_PAGES) {
            if (!comicFaces.some(f => f.pageIndex === LETTERS_PAGE)) {
                const lettersId = uuidv4();
                const backId = uuidv4();
                const newFaces: ComicFace[] = [
                    { id: lettersId, type: 'letters', choices: [], isLoading: true, pageIndex: LETTERS_PAGE },
                    { id: backId, type: 'back_cover', choices: [], isLoading: true, pageIndex: BACK_COVER_PAGE }
                ];
                setComicFaces(prev => [...prev, ...newFaces]);
                historyRef.current = [...historyRef.current, ...newFaces];
                generateSinglePage(lettersId, LETTERS_PAGE, 'letters');
                generateSinglePage(backId, BACK_COVER_PAGE, 'back_cover');
            }
            return;
        }

        const currentFace = comicFaces.find(f => f.pageIndex === pageIndex);
        if (currentFace) updateFaceState(currentFace.id, { resolvedChoice: choice });

        const nextId = uuidv4();
        const nextFace: ComicFace = { id: nextId, type: 'story', choices: [], isLoading: true, pageIndex: nextPageNum, parentId: currentFace?.id, choiceLabel: choice, isDecisionPage: DECISION_PAGES.includes(nextPageNum) };
        
        setComicFaces(prev => [...prev, nextFace]);
        historyRef.current.push(nextFace);
        storyTreeRef.current[nextId] = nextFace;

        await generateSinglePage(nextId, nextPageNum, 'story');
        setCurrentSheetIndex(Math.floor((nextPageNum + 1) / 2));
    };

    return (
        <div className="min-h-screen bg-gray-900 overflow-hidden relative font-sans text-white">
            {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
            
            <Setup 
                show={showSetup} isTransitioning={isTransitioning} 
                hero={hero} friend={friend} villain={villain}
                selectedGenre={selectedGenre} selectedArtStyle={selectedArtStyle}
                selectedLanguage={selectedLanguage} selectedTone={storyTone}
                customPremise={customPremise} richMode={richMode}
                hasSave={hasSave} onResume={handleResume}
                onHeroUpload={async f => setHero(await aiService.generatePersona(`The main hero character based on: ${f.name}`, selectedArtStyle, selectedGenre))}
                onFriendUpload={async f => setFriend(await aiService.generatePersona(`A loyal ally character based on: ${f.name}`, selectedArtStyle, selectedGenre))}
                onVillainUpload={async f => setVillain(await aiService.generatePersona(`A terrifying villain character based on: ${f.name}`, selectedArtStyle, selectedGenre))}
                onAutoGenerateHero={async () => setHero(await aiService.generatePersona("A classic comic book hero", selectedArtStyle, selectedGenre))}
                onAutoGenerateFriend={async () => setFriend(await aiService.generatePersona("A supportive comic book sidekick", selectedArtStyle, selectedGenre))}
                onAutoGenerateVillain={async () => setVillain(await aiService.generatePersona("A menace from the shadows", selectedArtStyle, selectedGenre))}
                onGenerateBios={async () => {
                    const bios = await aiService.generateCharacterBios(selectedGenre, storyTone, LANGUAGES.find(l=>l.code===selectedLanguage)!.name, !!friend, !!villain);
                    if (hero) setHero({...hero, name: bios.hero.name, backstory: bios.hero.backstory});
                    if (friend) setFriend({...friend, name: bios.friend.name, backstory: bios.friend.backstory});
                    if (villain) setVillain({...villain, name: bios.villain.name, backstory: bios.villain.backstory});
                }}
                onGenreChange={setSelectedGenre} onArtStyleChange={setSelectedArtStyle}
                onLanguageChange={setSelectedLanguage} onToneChange={setStoryTone}
                onPremiseChange={setCustomPremise} onRichModeChange={setRichMode}
                onLaunch={handleLaunch}
            />

            <Book 
                comicFaces={comicFaces} currentSheetIndex={currentSheetIndex}
                isStarted={isStarted} isSetupVisible={showSetup}
                hero={hero} friend={friend} villain={villain}
                onOpenBio={() => setShowBios(true)}
                onSheetClick={idx => setCurrentSheetIndex(idx)}
                onChoice={handleChoice}
                onOpenBook={() => setCurrentSheetIndex(1)}
                onDownload={() => {}}
                onReset={() => { localStorage.clear(); window.location.reload(); }}
                onAnimate={async id => {
                    const f = storyTreeRef.current[id];
                    if (!f?.imageUrl) return;
                    updateFaceState(id, { isAnimating: true });
                    try {
                        const vid = await aiService.generateVeoVideo(f.imageUrl.split(',')[1], f.narrative?.scene || "", f.type === 'cover');
                        updateFaceState(id, { videoUrl: vid });
                    } catch (e) { handleAPIError(e); }
                    finally { updateFaceState(id, { isAnimating: false }); }
                }}
                onRegenerate={async id => {
                    const f = storyTreeRef.current[id];
                    if (!f) return;
                    updateFaceState(id, { isLoading: true });
                    const img = await aiService.generateImage(f.narrative!, f.type, selectedArtStyle, selectedGenre, selectedLanguage, hero, friend, villain, worldStateRef.current);
                    updateFaceState(id, { imageUrl: img, isLoading: false });
                }}
                onRemix={async (id, prompt) => {
                    const f = storyTreeRef.current[id];
                    if (!f?.imageUrl) return;
                    updateFaceState(id, { isAnimating: true });
                    try {
                        const img = await aiService.editImage(f.imageUrl.split(',')[1], prompt);
                        updateFaceState(id, { imageUrl: img });
                    } catch (e) { handleAPIError(e); }
                    finally { updateFaceState(id, { isAnimating: false }); }
                }}
                onReviseScript={async (id, prompt) => {
                    const f = storyTreeRef.current[id];
                    if (!f?.narrative) return;
                    updateFaceState(id, { isLoading: true });
                    const beat = await aiService.reviseBeat(f.narrative, prompt);
                    updateFaceState(id, { narrative: beat, bubbles: beat.bubbles, isLoading: false });
                }}
                onReadAloud={handleReadAloud}
                onExportImages={() => {}}
                onBubbleUpdate={(id, b) => updateFaceState(id, { bubbles: b })}
                onOpenMap={() => setShowMap(true)}
                onOpenSettings={() => setShowSettings(true)}
            />

            {showBios && <CharacterBios hero={hero} friend={friend} villain={villain} onClose={() => setShowBios(false)} onTalkToCharacter={(p, r) => setActiveChat({persona: p, role: r})} />}
            {showMap && <MultiverseMap storyTree={storyTreeRef.current} currentPath={comicFaces} onClose={() => setShowMap(false)} onNodeClick={id => {
                const node = storyTreeRef.current[id];
                if (node) {
                    const path: ComicFace[] = [];
                    let curr: ComicFace | undefined = node;
                    while (curr) {
                        path.unshift(curr);
                        curr = curr.parentId ? storyTreeRef.current[curr.parentId] : undefined;
                    }
                    setComicFaces(path);
                    historyRef.current = path;
                    setCurrentSheetIndex(Math.floor((node.pageIndex! + 1) / 2));
                }
                setShowMap(false);
            }} />}
            {showSettings && <TTSSettingsDialog settings={ttsSettings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
            {activeChat && <CharacterChatDialog persona={activeChat.persona} role={activeChat.role} onClose={() => setActiveChat(null)} onSendMessage={msg => aiService.generateCharacterResponse(activeChat.persona, activeChat.role, msg, historyRef.current[historyRef.current.length-1]?.narrative?.scene || "", selectedGenre, LANGUAGES.find(l=>l.code===selectedLanguage)!.name)} onReadAloud={handleReadAloud} />}
        </div>
    );
};

export default App;
