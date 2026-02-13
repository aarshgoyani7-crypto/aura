
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
  /* Fix: Use the AIStudio type for the aistudio property to match the environment's 
     Window interface declaration and fix modifier/type mismatch errors. */
  interface Window {
    aistudio: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
