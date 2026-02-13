
export enum AppView {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ImageResult {
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface VideoResult {
  url: string;
  prompt: string;
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
}

declare global {
  // Move AIStudio to the global namespace to allow merging with environment-provided types and avoid module-scoping conflicts.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // webkitAudioContext is retained for compatibility.
    // The explicit aistudio property is removed here to avoid "identical modifiers" and "subsequent property declaration" errors, 
    // as it is already declared in the environment's global scope.
    webkitAudioContext: typeof AudioContext;
  }
}
