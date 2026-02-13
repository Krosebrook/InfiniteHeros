/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyContextType {
  apiKey: string | null;
  isValid: boolean;
  saveApiKey: (key: string) => Promise<boolean>;
  clearApiKey: () => void;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  validateApiKey: () => Promise<boolean>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('gemini_api_key'));
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Initial load check
    const stored = localStorage.getItem('gemini_api_key');
    const envKey = process.env.API_KEY;

    if (stored) {
        setApiKey(stored);
        setIsValid(true); // Optimistic valid
    } else if (envKey) {
        setApiKey(envKey);
        setIsValid(true);
    } else {
        setShowDialog(true);
    }
  }, []);

  const saveApiKey = useCallback(async (key: string): Promise<boolean> => {
    try {
        // Validation Call
        const ai = new GoogleGenAI({ apiKey: key });
        // Lightweight check
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { parts: [{ text: 'Ping' }] }
        });
        
        localStorage.setItem('gemini_api_key', key);
        setApiKey(key);
        setIsValid(true);
        setShowDialog(false);
        return true;
    } catch (e) {
        console.error("API Key Validation Failed", e);
        return false;
    }
  }, []);

  const clearApiKey = useCallback(() => {
      localStorage.removeItem('gemini_api_key');
      setApiKey(null);
      setIsValid(false);
      setShowDialog(true);
  }, []);

  // Helper for components to check validity and trigger dialog if needed
  const validateApiKey = useCallback(async (): Promise<boolean> => {
      if (isValid && apiKey) return true;
      setShowDialog(true);
      return false;
  }, [isValid, apiKey]);

  return React.createElement(
    ApiKeyContext.Provider,
    { value: { apiKey, isValid, saveApiKey, clearApiKey, showDialog, setShowDialog, validateApiKey } },
    children
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
