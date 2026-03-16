/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ApiKeyContextType {
  isValid: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  validateApiKey: () => Promise<boolean>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setIsValid(true);
        } else {
          setShowDialog(true);
        }
      } catch (e) {
        console.error("Error checking API key status", e);
      }
    };
    checkKey();
  }, []);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
      try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setIsValid(true);
          setShowDialog(false);
          return true;
        }
      } catch (e) {
        console.error("Error validating API key", e);
      }
      setShowDialog(true);
      return false;
  }, []);

  return React.createElement(
    ApiKeyContext.Provider,
    { value: { isValid, showDialog, setShowDialog, validateApiKey } },
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
