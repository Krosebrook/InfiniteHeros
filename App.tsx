/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { 
    MAX_STORY_PAGES, TOTAL_PAGES, LETTERS_PAGE, BACK_COVER_PAGE,
    GENRES, ART_STYLES, TONES, LANGUAGES, DECISION_PAGES, PANEL_LAYOUTS,
    ComicFace, Beat, Persona, WorldState, TTSSettings, Achievement, PanelLayout
} from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { CharacterBios } from './CharacterBios';
import { MultiverseMap } from './MultiverseMap';
import { useApiKey, ApiKeyProvider } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { ExportDialog } from './ExportDialog';
import { DiceRoller } from './DiceRoller';
import { Inventory } from './Inventory';
import { soundManager } from './SoundManager';
import { saveGame, loadGame } from './db';
import { TTSSettingsDialog } from './TTSSettingsDialog';
import { CharacterChatDialog } from './CharacterChatDialog';
import * as aiService from './aiService';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_choice', title: 'The First Step', description: 'Made your first choice in the multiverse.', unlocked: false },
    { id: 'risky_roller', title: 'High Roller', description: 'Attempted a risky action with a D20.', unlocked: false },
    { id: 'survivor', title: 'Survivor', description: 'Survive a scene with less than 20% health.', unlocked: false },
    { id: 'multiversalist', title: 'Multiversalist', description: 'Visited 5 different timeline branches.', unlocked: false },
];

const GENRE_CHARACTER_PROMPTS: Record<string, { hero: string, friend: string, villain: string }> = {
    "Classic Horror": {
        hero: "A terrified but determined survivor holding a lantern, Victorian or 1920s attire, weary expression",
        friend: "A skeptical professor with tweed jacket and glasses, carrying a tome",
        villain: "A looming shadow figure or eldritch abomination, obscured features, menacing aura"
    },
    "Superhero Action": {
        hero: "A superhero in a dynamic costume with a chest emblem and cape, glowing energy hands",
        friend: "A tech-support sidekick with goggles, utility belt, and a laptop",
        villain: "A supervillain in power armor with a menacing helmet and energy crackles"
    },
    "Dark Sci-Fi": {
        hero: "A cybernetic bounty hunter with a neon-lit trenchcoat and a robotic arm",
        friend: "A hacked service droid with exposed wiring and graffiti",
        villain: "A corporate overlord in a sleek suit with a digital face mask"
    },
    "High Fantasy": {
        hero: "A valiant knight in shining plate armor wielding a glowing sword",
        friend: "A mysterious hooded ranger with a bow and elven features",
        villain: "A dark sorcerer in spiked robes wielding a staff of green fire"
    },
    "Neon Noir Detective": {
        hero: "A gritty private eye in a fedora and trenchcoat, rain-soaked, smoking",
        friend: "A street-smart informant with cybernetic eyes and punk hair",
        villain: "A corrupt synth-lord in a high-collar suit, holding a glass of wine"
    },
    "Wasteland Apocalypse": {
        hero: "A road warrior in scavenged leather armor with goggles and a dust scarf",
        friend: "A mutant dog companion with mechanical prosthetics",
        villain: "A warlord in tire-tread armor with a skull mask and chains"
    },
    "Lighthearted Comedy": {
        hero: "A clumsy but lovable protagonist in casual hoodie and jeans, expressive face",
        friend: "An energetic best friend with messy hair and a bright backpack",
        villain: "A snobbish rival in an expensive suit looking disdainful"
    },
    "Teen Drama / Slice of Life": {
        hero: "A high school student with a unique hairstyle and school uniform, carrying books",
        friend: "A cool classmate with headphones around neck and a skateboard",
        villain: "A popular student with crossed arms and a judgmental smirk"
    },
    "Custom": {
        hero: "A unique main character for a comic book adventure",
        friend: "A loyal sidekick or companion character",
        villain: "A menacing antagonist or rival character"
    }
};

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const InfiniteHeroesGame: React.FC = () => {
    const { validateApiKey, showDialog, isValid } = useApiKey();

    const [hero, setHeroState] = useState<Persona | null>(null);
    const [friend, setFriendState] = useState<Persona | null>(null);
    const [villain, setVillainState] = useState<Persona | null>(null);

    const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
    const [selectedArtStyle, setSelectedArtStyle] = useState(ART_STYLES[0]);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
    const [customPremise, setCustomPremise] = useState("");
    const [storyTone, setStoryTone] = useState(TONES[0]);
    const [selectedLayout, setSelectedLayout] = useState<PanelLayout>(PANEL_LAYOUTS[0]);
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
    const [worldState, setWorldState] = useState<WorldState>({ 
        inventory: [], 
        status: [], 
        location_tags: [], 
        health: 100, 
        npcs: [],
        achievements: INITIAL_ACHIEVEMENTS
    });
    
    const [showBios, setShowBios] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showSetup, setShowSetup] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [rollingDiceFor, setRollingDiceFor] = useState<{pageIndex: number, choice: string} | null>(null);
    
    const [activeChat, setActiveChat] = useState<{persona: Persona, role: string} | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const pendingIcons = useRef<Set<string>>(new Set());

    // Effect to generate missing icons for inventory items
    useEffect(() => {
        if (!isStarted) return;
        
        worldState.inventory.forEach(item => {
            if (!item.iconUrl && !pendingIcons.current.has(item.name)) {
                pendingIcons.current.add(item.name);
                aiService.generateItemIcon(item.name, selectedGenre).then(icon => {
                    if (icon) {
                        setWorldState(prev => {
                            const updatedInv = prev.inventory.map(i => 
                                i.name === item.name ? { ...i, iconUrl: icon } : i
                            );
                            worldStateRef.current.inventory = updatedInv;
                            return { ...prev, inventory: updatedInv };
                        });
                    }
                    pendingIcons.current.delete(item.name);
                }).catch(() => {
                    pendingIcons.current.delete(item.name);
                });
            }
        });
    }, [worldState.inventory, isStarted, selectedGenre]);

    const heroRef = useRef<Persona | null>(null);
    const friendRef = useRef<Persona | null>(null);
    const villainRef = useRef<Persona | null>(null);
    const generatingPages = useRef(new Set<number>());
    const historyRef = useRef<ComicFace[]>([]);
    const storyTreeRef = useRef<Record<string, ComicFace>>({}); 
    const worldStateRef = useRef<WorldState>({ 
        inventory: [], 
        status: [], 
        location_tags: [], 
        health: 100, 
        npcs: [],
        achievements: INITIAL_ACHIEVEMENTS
    });
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

    const handleSaveProgress = useCallback(() => {
        if (!isStarted) return;
        soundManager.play('success');
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
            selectedLayout,
            timestamp: Date.now(),
            worldState: worldStateRef.current,
            ttsSettings: ttsSettings 
        }).catch(e => console.error("Save failed", e));
    }, [isStarted, currentSheetIndex, selectedGenre, selectedArtStyle, selectedLanguage, storyTone, selectedLayout, ttsSettings]);

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
                selectedLayout,
                timestamp: Date.now(),
                worldState: worldStateRef.current,
                ttsSettings: ttsSettings 
            }).catch(e => console.error("Auto-save failed", e));
        }, 2000);
    }, [isStarted, currentSheetIndex, selectedGenre, selectedArtStyle, selectedLanguage, storyTone, selectedLayout, ttsSettings]);

    useEffect(() => { triggerAutoSave(); }, [comicFaces, worldState, ttsSettings, triggerAutoSave]);

    const handleSaveSettings = (newSettings: TTSSettings) => {
        setTtsSettings(newSettings);
        localStorage.setItem('ttsSettings', JSON.stringify(newSettings));
    };

    const unlockAchievement = (id: string) => {
        setWorldState(prev => {
            const nextAch = prev.achievements.map(a => a.id === id ? { ...a, unlocked: true } : a);
            const found = nextAch.find(a => a.id === id);
            if (found && !prev.achievements.find(a => a.id === id)?.unlocked) {
                soundManager.play('success');
            }
            worldStateRef.current.achievements = nextAch;
            return { ...prev, achievements: nextAch };
        });
    };

    const handleResume = async () => {
        const save = await loadGame();
        if (!save) return;
        soundManager.play('success');
        setHero(save.hero); setFriend(save.friend); setVillain(save.villain);
        setComicFaces(save.comicFaces);
        historyRef.current = save.comicFaces;
        setWorldState(save.worldState || { inventory: [], status: [], location_tags: [], health: 100, npcs: [], achievements: INITIAL_ACHIEVEMENTS });
        worldStateRef.current = save.worldState || { inventory: [], status: [], location_tags: [], health: 100, npcs: [], achievements: INITIAL_ACHIEVEMENTS };
        setCurrentSheetIndex(save.currentSheetIndex);
        setIsStarted(true); setShowSetup(false);
        setSelectedGenre(save.selectedGenre);
        setSelectedArtStyle(save.selectedArtStyle || ART_STYLES[0]);
        setSelectedLanguage(save.selectedLanguage);
        setStoryTone(save.storyTone);
        if (save.selectedLayout) setSelectedLayout(save.selectedLayout);
        if (save.ttsSettings) setTtsSettings(save.ttsSettings);
        if (save.storyTree) storyTreeRef.current = save.storyTree;
    };

    const handleAPIError = (e: any) => {
        console.error("API Error caught:", e);
        const msg = String(e) || "";
        if (msg.includes('Requested entity was not found') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
            validateApiKey(); // Trigger dialog
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

    const updateWorldState = async (updates: Beat['world_update']) => {
        if (!updates) return;
        
        let newInventory = [...worldStateRef.current.inventory];
        if (updates.add_items) {
             for (const itemName of updates.add_items) {
                 if (!newInventory.find(i => i.name === itemName)) {
                     aiService.generateItemIcon(itemName, selectedGenre).then(icon => {
                         setWorldState(prev => {
                             const updatedInv = prev.inventory.map(i => i.name === itemName ? { ...i, iconUrl: icon } : i);
                             worldStateRef.current.inventory = updatedInv;
                             return { ...prev, inventory: updatedInv };
                         });
                     });
                     newInventory.push({ name: itemName }); 
                 }
             }
        }
        if (updates.remove_items) {
            newInventory = newInventory.filter(i => !updates.remove_items?.includes(i.name));
        }

        let newStatus = [...worldStateRef.current.status];
        if (updates.add_status) newStatus = [...new Set([...newStatus, ...updates.add_status])];
        if (updates.remove_status) newStatus = newStatus.filter(s => !updates.remove_status?.includes(s));

        let newHealth = Math.max(0, Math.min(100, worldStateRef.current.health + (updates.health_delta || 0)));
        if (newHealth < 20 && newHealth < worldStateRef.current.health) unlockAchievement('survivor');

        let newNpcs = [...worldStateRef.current.npcs];
        if (updates.new_npcs) {
            for (const npcData of updates.new_npcs) {
                const npcImg = await aiService.generatePersona(`Supporting character: ${npcData.name}. ${npcData.backstory}`, selectedArtStyle, selectedGenre);
                newNpcs.push({ ...npcImg, name: npcData.name, backstory: npcData.backstory });
            }
        }

        if (updates.achievement_id) unlockAchievement(updates.achievement_id);

        const nextState = { 
            ...worldStateRef.current, 
            inventory: newInventory, 
            status: newStatus, 
            health: newHealth,
            npcs: newNpcs
        };
        setWorldState(nextState);
        worldStateRef.current = nextState;
    };

    const handleReadAloud = async (text: string, voiceName?: string) => {
        if (!(await validateApiKey())) return;
        try {
            const v = voiceName || ttsSettings.defaultVoice;
            const audioData = await aiService.generateTTS(text, v);
            if (audioData) await soundManager.playTTS(audioData, ttsSettings.playbackSpeed);
        } catch (e) { handleAPIError(e); }
    };

    const handleExport = async (format: 'png' | 'jpg' | 'pdf', quality: number, scale: number) => {
        setIsExporting(true);
        soundManager.play('swoosh');
        try {
            const facesToExport = historyRef.current.filter(f => f.imageUrl || (f.panels && f.panels.some(p => p.imageUrl)));
            const zip = new JSZip();
            
            if (format === 'pdf') {
                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const width = doc.internal.pageSize.getWidth();
                const height = doc.internal.pageSize.getHeight();
                
                for (let i = 0; i < facesToExport.length; i++) {
                    const f = facesToExport[i];
                    if (i > 0) doc.addPage();
                    if (f.imageUrl) {
                        doc.addImage(f.imageUrl, 'JPEG', 0, 0, width, height);
                    } else if (f.panels && f.panels.length > 0) {
                        const hGap = 2; const vGap = 2;
                        const halfW = (width / 2) - hGap; 
                        const halfH = (height / 2) - vGap;
                        f.panels.forEach((p, pIdx) => {
                             if (!p.imageUrl) return;
                             let x=0, y=0, w=width, h=height;
                             if (f.layout === '2x2_grid') {
                                 x = (pIdx % 2) * (halfW + hGap);
                                 y = Math.floor(pIdx / 2) * (halfH + vGap);
                                 w = halfW; h = halfH;
                             } else if (f.layout === '2_vertical') {
                                 y = pIdx * (halfH + vGap);
                                 h = halfH;
                             }
                             doc.addImage(p.imageUrl, 'JPEG', x, y, w, h);
                        });
                    }
                }
                doc.save('infinite-heroes.pdf');
            } else {
                const folder = zip.folder(`infinite-heroes-${Date.now()}`);
                if (folder) {
                    for (const face of facesToExport) {
                         if (face.imageUrl) {
                             folder.file(`page-${face.pageIndex}.jpg`, face.imageUrl.split(',')[1], {base64: true});
                         } else if (face.panels) {
                             face.panels.forEach((p, pi) => {
                                 if (p.imageUrl) folder.file(`page-${face.pageIndex}-panel-${pi}.jpg`, p.imageUrl.split(',')[1], {base64: true});
                             });
                         }
                    }
                    const blob = await zip.generateAsync({type:"blob"});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `infinite-heroes.zip`;
                    a.click();
                }
            }
        } catch(e) { console.error("Export failed", e); }
        finally {
            setIsExporting(false);
            setShowExport(false);
            soundManager.play('success');
        }
    };

    const handleUndo = () => {
        if (historyRef.current.length <= 2) return; 
        soundManager.play('flip');
        const removedPage = historyRef.current.pop();
        if (!removedPage || !removedPage.parentId) return;
        const parentId = removedPage.parentId;
        const parentIdx = historyRef.current.findIndex(f => f.id === parentId);
        if (parentIdx !== -1) {
            const parent = historyRef.current[parentIdx];
            const updatedParent = { ...parent, resolvedChoice: undefined };
            historyRef.current[parentIdx] = updatedParent;
            storyTreeRef.current[parentId] = updatedParent;
            setComicFaces([...historyRef.current]);
            const newIndex = Math.floor((updatedParent.pageIndex || 1) / 2) + ((updatedParent.pageIndex || 0) % 2);
            setCurrentSheetIndex(newIndex > 0 ? newIndex : 1);
        }
    };

    const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type'], parentId?: string, choiceLabel?: string, rollResult?: {value:number, isSuccess:boolean}) => {
        if (generatingPages.current.has(pageNum)) return;
        generatingPages.current.add(pageNum);

        const isDecision = DECISION_PAGES.includes(pageNum);
        const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
        
        try {
            if (type === 'letters') {
                const letters = await aiService.generateLetters(historyRef.current, langName);
                updateFaceState(faceId, { lettersContent: letters, isLoading: false });
            } else if (type === 'back_cover') {
                const img = await aiService.generateImage("Epic back cover", selectedArtStyle, selectedGenre, hero, friend, villain, worldStateRef.current, '3:4');
                updateFaceState(faceId, { imageUrl: img, isLoading: false });
            } else {
                const beat = await aiService.generateBeat(pageNum, historyRef.current, hero!, friend, villain, selectedGenre, storyTone, langName, customPremise, richMode, isDecision, worldStateRef.current, rollResult, selectedLayout);
                await updateWorldState(beat.world_update);
                
                const panelPromises = beat.panels.map(async (p, i) => ({
                    id: `${faceId}-p${i}`,
                    description: p.description,
                    imageUrl: await aiService.generateImage(p.description, selectedArtStyle, selectedGenre, hero, friend, villain, worldStateRef.current, type === 'cover' ? '3:4' : '1:1')
                }));
                const generatedPanels = await Promise.all(panelPromises);
                
                const allBubbles: any[] = [];
                beat.panels.forEach((p, i) => {
                     // initialize with explicit center coordinates and tail target
                     const bubbles = p.bubbles.map(b => ({ 
                         ...b, 
                         id: uuidv4(), 
                         x: 50, y: 50, 
                         tailX: 50, tailY: 80 
                     })); 
                     allBubbles.push(...bubbles);
                });

                updateFaceState(faceId, { 
                    narrative: beat, 
                    layout: beat.layout,
                    panels: generatedPanels,
                    bubbles: allBubbles, 
                    choices: beat.choices, 
                    rollResult: rollResult,
                    isLoading: false,
                    imageUrl: generatedPanels[0]?.imageUrl
                });
                
                if (ttsSettings.autoPlay && allBubbles.length > 0) {
                    const text = allBubbles.map(b => b.text).join('. ');
                    handleReadAloud(text, beat.focus_char === 'hero' ? 'Fenrir' : beat.focus_char === 'friend' ? 'Puck' : beat.focus_char === 'villain' ? 'Charon' : ttsSettings.defaultVoice);
                }
            }
        } catch (e) {
            handleAPIError(e);
            updateFaceState(faceId, { isLoading: false });
        } finally { generatingPages.current.delete(pageNum); }
    };

    const handleGenerateCover = async () => {
        if (!hero || !(await validateApiKey())) return;
        soundManager.play('magic');
        
        const coverFace = comicFaces.find(f => f.type === 'cover');
        if (!coverFace) return;

        setCurrentSheetIndex(0);
        updateFaceState(coverFace.id, { isLoading: true });
        
        try {
            const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
            const beat = await aiService.generateBeat(0, historyRef.current, hero, friend, villain, "Superhero Action", storyTone, langName, customPremise, richMode, false, worldStateRef.current, undefined, 'single');
            
            const panelPromises = beat.panels.map(async (p, i) => ({
                id: `${coverFace.id}-p${i}`,
                description: p.description,
                imageUrl: await aiService.generateImage(p.description, "Painting (Alex Ross Style)", "Superhero Action", hero, friend, villain, worldStateRef.current, '3:4')
            }));
            const generatedPanels = await Promise.all(panelPromises);
            
            const allBubbles: any[] = [];
            beat.panels.forEach((p, i) => {
                 const bubbles = p.bubbles.map(b => ({ 
                     ...b, 
                     id: uuidv4(), 
                     x: 50, y: 50, 
                     tailX: 50, tailY: 80 
                 })); 
                 allBubbles.push(...bubbles);
            });

            updateFaceState(coverFace.id, { 
                narrative: beat, 
                panels: generatedPanels, 
                bubbles: allBubbles,
                isLoading: false 
            });
        } catch (e) {
            handleAPIError(e);
            updateFaceState(coverFace.id, { isLoading: false });
        }
    };

    const handleLaunch = async () => {
        if (!hero || !(await validateApiKey())) return;
        setIsTransitioning(true);
        soundManager.play('magic');
        
        const initialFaces: ComicFace[] = [
            { id: uuidv4(), type: 'cover', choices: [], isLoading: true, pageIndex: 0, layout: 'single', panels: [] },
            { id: uuidv4(), type: 'story', choices: [], isLoading: true, pageIndex: 1, layout: 'single', panels: [] }
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

    const proceedWithChoice = async (pageIndex: number, choice: string, rollResult?: {value:number, isSuccess:boolean}) => {
        const nextPageNum = pageIndex + 1;
        if (nextPageNum > MAX_STORY_PAGES) {
             if (!comicFaces.some(f => f.pageIndex === LETTERS_PAGE)) {
                const lettersId = uuidv4();
                const backId = uuidv4();
                const newFaces: ComicFace[] = [
                    { id: lettersId, type: 'letters', choices: [], isLoading: true, pageIndex: LETTERS_PAGE, layout: 'single', panels: [] },
                    { id: backId, type: 'back_cover', choices: [], isLoading: true, pageIndex: BACK_COVER_PAGE, layout: 'single', panels: [] }
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
        if (pageIndex === 1) unlockAchievement('first_choice');

        const nextId = uuidv4();
        const nextFace: ComicFace = { 
            id: nextId, type: 'story', choices: [], isLoading: true, pageIndex: nextPageNum, 
            parentId: currentFace?.id, choiceLabel: choice, 
            isDecisionPage: DECISION_PAGES.includes(nextPageNum),
            layout: 'single', panels: [] 
        };
        
        setComicFaces(prev => [...prev, nextFace]);
        historyRef.current.push(nextFace);
        storyTreeRef.current[nextId] = nextFace;

        await generateSinglePage(nextId, nextPageNum, 'story', currentFace?.id, choice, rollResult);
        setCurrentSheetIndex(Math.floor((nextPageNum + 1) / 2));
    };

    const handleChoice = (pageIndex: number, choice: string) => {
        const riskyWords = ["attack", "jump", "steal", "fight", "dodge", "risk", "try", "climb", "leap"];
        const isRisky = riskyWords.some(w => choice.toLowerCase().includes(w));
        
        if (isRisky) {
            setRollingDiceFor({ pageIndex, choice });
            unlockAchievement('risky_roller');
        } else {
            proceedWithChoice(pageIndex, choice);
        }
    };
    
    // Updated file handling logic
    const handleFileUpload = async (file: File) => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 overflow-hidden relative font-sans text-white">
            {showDialog && <ApiKeyDialog />}
            {rollingDiceFor && <DiceRoller onComplete={(val) => {
                setRollingDiceFor(null);
                proceedWithChoice(rollingDiceFor.pageIndex, rollingDiceFor.choice, { value: val, isSuccess: val >= 10 });
            }} />}
            
            {isStarted && worldState.health < 40 && (
                <div className="fixed inset-0 pointer-events-none z-[200] transition-opacity duration-1000"
                     style={{ 
                         background: `radial-gradient(circle, transparent 40%, rgba(220, 38, 38, ${0.4 * (1 - worldState.health/40)}) 100%)`,
                         opacity: isStarted ? 1 : 0
                     }} 
                />
            )}

            <Inventory items={worldState.inventory} status={worldState.status} />

            <Setup 
                show={showSetup} isTransitioning={isTransitioning} 
                hero={hero} friend={friend} villain={villain}
                selectedGenre={selectedGenre} selectedArtStyle={selectedArtStyle}
                selectedLanguage={selectedLanguage} selectedTone={storyTone}
                selectedLayout={selectedLayout}
                customPremise={customPremise} richMode={richMode}
                hasSave={hasSave} onResume={handleResume}
                onHeroUpload={async f => {
                    const dataUrl = await handleFileUpload(f);
                    const base64 = dataUrl.split(',')[1];
                    const desc = await aiService.describeCharacter(base64);
                    setHero({ base64, desc, name: "Traveler", backstory: desc });
                }}
                onFriendUpload={async f => {
                    const dataUrl = await handleFileUpload(f);
                    const base64 = dataUrl.split(',')[1];
                    const desc = await aiService.describeCharacter(base64);
                    setFriend({ base64, desc, name: "Ally", backstory: desc });
                }}
                onVillainUpload={async f => {
                    const dataUrl = await handleFileUpload(f);
                    const base64 = dataUrl.split(',')[1];
                    const desc = await aiService.describeCharacter(base64);
                    setVillain({ base64, desc, name: "Nemesis", backstory: desc });
                }}
                onAutoGenerateHero={async () => {
                    let desc = GENRE_CHARACTER_PROMPTS[selectedGenre]?.hero;
                    if (selectedGenre === 'Custom' && customPremise) {
                        desc = `A protagonist for a story about: ${customPremise}`;
                    } else if (!desc) {
                        desc = GENRE_CHARACTER_PROMPTS['Custom'].hero;
                    }
                    setHero(await aiService.generatePersona(desc, selectedArtStyle, selectedGenre));
                }}
                onAutoGenerateFriend={async () => {
                    let desc = GENRE_CHARACTER_PROMPTS[selectedGenre]?.friend;
                    if (!desc) desc = GENRE_CHARACTER_PROMPTS['Custom'].friend;
                    setFriend(await aiService.generatePersona(desc, selectedArtStyle, selectedGenre));
                }}
                onAutoGenerateVillain={async () => {
                    let desc = GENRE_CHARACTER_PROMPTS[selectedGenre]?.villain;
                    if (!desc) desc = GENRE_CHARACTER_PROMPTS['Custom'].villain;
                    setVillain(await aiService.generatePersona(desc, selectedArtStyle, selectedGenre));
                }}
                onGenerateBios={async () => {
                    const bios = await aiService.generateCharacterBios(selectedGenre, storyTone, LANGUAGES.find(l=>l.code===selectedLanguage)!.name, !!friend, !!villain);
                    if (hero) setHero({...hero, name: bios.hero.name, backstory: bios.hero.backstory});
                    if (friend) setFriend({...friend, name: bios.friend.name, backstory: bios.friend.backstory});
                    if (villain) setVillain({...villain, name: bios.villain.name, backstory: bios.villain.backstory});
                }}
                onGenreChange={setSelectedGenre} onArtStyleChange={setSelectedArtStyle}
                onLanguageChange={setSelectedLanguage} onToneChange={setStoryTone}
                onLayoutChange={setSelectedLayout}
                onPremiseChange={setCustomPremise} onRichModeChange={setRichMode}
                onLaunch={handleLaunch}
                onToggleHeroLock={() => { if(hero) setHero({...hero, locked: !hero.locked}); }}
                onToggleFriendLock={() => { if(friend) setFriend({...friend, locked: !friend.locked}); }}
                onToggleVillainLock={() => { if(villain) setVillain({...villain, locked: !villain.locked}); }}
            />

            <Book 
                comicFaces={comicFaces} currentSheetIndex={currentSheetIndex}
                isStarted={isStarted} isSetupVisible={showSetup}
                hero={hero} friend={friend} villain={villain}
                worldState={worldState}
                onOpenBio={() => setShowBios(true)}
                onOpenInventory={() => setShowInventory(!showInventory)}
                onSheetClick={idx => setCurrentSheetIndex(idx)}
                onChoice={handleChoice}
                onOpenBook={() => setCurrentSheetIndex(1)}
                onDownload={() => setShowExport(true)} 
                onReset={() => { localStorage.clear(); window.location.reload(); }}
                onAnimate={async id => {
                    const f = storyTreeRef.current[id];
                    const img = f.panels?.[0]?.imageUrl || f.imageUrl;
                    if (!img) return;
                    updateFaceState(id, { isAnimating: true });
                    try {
                        const vid = await aiService.generateVeoVideo(img.split(',')[1], f.panels?.[0]?.description || f.narrative?.scene || "", f.type === 'cover');
                        updateFaceState(id, { videoUrl: vid });
                    } catch (e) { handleAPIError(e); }
                    finally { updateFaceState(id, { isAnimating: false }); }
                }}
                onRegenerate={async (id, aspectRatio) => {
                    const f = storyTreeRef.current[id];
                    if (!f) return;
                    updateFaceState(id, { isLoading: true });
                    if (f.panels && f.panels.length > 0) {
                         const newPanels = await Promise.all(f.panels.map(async p => ({
                             ...p,
                             imageUrl: await aiService.generateImage(p.description, selectedArtStyle, selectedGenre, hero, friend, villain, worldStateRef.current, aspectRatio || (f.type === 'cover' ? '3:4' : '1:1'))
                         })));
                         updateFaceState(id, { panels: newPanels, isLoading: false, imageUrl: newPanels[0].imageUrl });
                    }
                }}
                onRemix={async (id, prompt) => {
                    const f = storyTreeRef.current[id];
                    const img = f.panels?.[0]?.imageUrl || f.imageUrl;
                    if (!img) return;
                    updateFaceState(id, { isAnimating: true });
                    try {
                        const newImg = await aiService.editImage(img.split(',')[1], prompt);
                        if (f.panels && f.panels.length > 0) {
                            const newPanels = [...f.panels];
                            newPanels[0] = { ...newPanels[0], imageUrl: newImg };
                            updateFaceState(id, { panels: newPanels, imageUrl: newImg });
                        } else { updateFaceState(id, { imageUrl: newImg }); }
                    } catch (e) { handleAPIError(e); }
                    finally { updateFaceState(id, { isAnimating: false }); }
                }}
                onReviseScript={async (id, prompt) => {
                    const f = storyTreeRef.current[id];
                    if (!f?.narrative) return;
                    updateFaceState(id, { isLoading: true });
                    const beat = await aiService.reviseBeat(f.narrative, prompt);
                     const allBubbles: any[] = [];
                     beat.panels.forEach((p, i) => {
                         const bubbles = p.bubbles.map(b => ({ ...b, id: uuidv4() })); 
                         allBubbles.push(...bubbles);
                     });
                    updateFaceState(id, { narrative: beat, bubbles: allBubbles, isLoading: false });
                }}
                onReadAloud={handleReadAloud}
                onExportImages={() => setShowExport(true)}
                onBubbleUpdate={(id, b) => updateFaceState(id, { bubbles: b })}
                onOpenMap={() => {
                    setShowMap(true);
                    const branchCount = Object.keys(storyTreeRef.current).length;
                    if (branchCount > 10) unlockAchievement('multiversalist');
                }}
                onOpenSettings={() => setShowSettings(true)}
                onSaveProgress={handleSaveProgress}
                onGenerateCover={handleGenerateCover}
            />

            {isStarted && !showSetup && showInventory && (
                <Inventory items={worldState.inventory} status={worldState.status} />
            )}

            {historyRef.current.length > 2 && currentSheetIndex > 1 && !showSetup && (
                <button 
                    onClick={handleUndo} 
                    className="fixed bottom-6 left-6 z-[150] bg-orange-500 text-white font-comic text-xl px-4 py-2 border-4 border-black shadow-[4px_4px_0px_black] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                    aria-label="Undo Turn"
                >
                    <span aria-hidden="true">↩️</span> UNDO TURN
                </button>
            )}

            {showBios && <CharacterBios hero={hero} friend={friend} villain={villain} npcs={worldState.npcs} onClose={() => setShowBios(false)} onTalkToCharacter={(p, r) => setActiveChat({persona: p, role: r})} />}
            {showMap && <MultiverseMap storyTree={storyTreeRef.current} currentPath={comicFaces} onClose={() => setShowMap(false)} onNodeClick={id => {
                const node = storyTreeRef.current[id];
                if (node) {
                    const path: ComicFace[] = [];
                    let curr: ComicFace | undefined = node;
                    while (curr) { path.unshift(curr); curr = curr.parentId ? storyTreeRef.current[curr.parentId] : undefined; }
                    setComicFaces(path);
                    historyRef.current = path;
                    setCurrentSheetIndex(Math.floor((node.pageIndex! + 1) / 2));
                }
                setShowMap(false);
            }} />}
            {showSettings && <TTSSettingsDialog settings={ttsSettings} achievements={worldState.achievements} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} lang={selectedLanguage} />}
            {showExport && <ExportDialog onClose={() => setShowExport(false)} onExport={handleExport} isExporting={isExporting} lang={selectedLanguage} />}
            {activeChat && <CharacterChatDialog persona={activeChat.persona} role={activeChat.role} onClose={() => setActiveChat(null)} onSendMessage={msg => aiService.generateCharacterResponse(activeChat.persona, activeChat.role, msg, historyRef.current[historyRef.current.length-1]?.narrative?.panels[0]?.description || "", selectedGenre, LANGUAGES.find(l=>l.code===selectedLanguage)!.name)} onReadAloud={handleReadAloud} lang={selectedLanguage} />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ApiKeyProvider>
            <InfiniteHeroesGame />
        </ApiKeyProvider>
    );
};

export default App;