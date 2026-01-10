
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GameState } from './types';

const DB_NAME = 'InfiniteHeroesDB';
const STORE_NAME = 'savegame';
const DB_VERSION = 1;

export const saveGame = async (state: GameState): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            // We only store one save slot for simplicity in this version
            const putRequest = store.put(state, 'autosave');

            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };

        request.onerror = () => reject(request.error);
    });
};

export const loadGame = async (): Promise<GameState | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const getRequest = store.get('autosave');

            getRequest.onsuccess = () => resolve(getRequest.result as GameState || null);
            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onerror = () => {
             // If DB doesn't exist yet, that's fine
             resolve(null);
        };
    });
};

export const clearSave = async (): Promise<void> => {
     return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete('autosave');
            resolve();
        };
    });
}
