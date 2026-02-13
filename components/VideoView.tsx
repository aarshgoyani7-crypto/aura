
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { VideoResult } from '../types';

const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    const selected = await window.aistudio.hasSelectedApiKey();
    setHasKey(selected);
  };

  const handleOpenKeyDialog = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true); // Assume success as per instructions
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatusMessage('Initializing Veo engine...');
    
    try {
      // Fix: Always use process.env.API_KEY directly for initialization as per @google/genai guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      const loadingMessages = [
        'Crafting cinematic frames...',
        'Simulating physics and motion...',
        'Rendering temporal consistency...',
        'Finalizing textures and lighting...',
        'Packaging high-quality MP4...'
      ];
      let msgIdx = 0;

      while (!operation.done) {
        setStatusMessage(loadingMessages[msgIdx % loadingMessages.length]);
        msgIdx++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setResults(prev => [{
          url: fetchUrl,
          prompt,
          timestamp: new Date(),
          status: 'completed'
        }, ...prev]);
      } else {
        throw new Error('No video URI returned');
      }

    } catch (error: any) {
      console.error('Video error:', error);
      if (error?.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        alert('API Key expired or invalid. Please select again.');
      } else {
        alert('Error generating video: ' + (error?.message || 'Unknown error'));
      }
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md glass rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Veo Requires a Paid API Key</h2>
            <p className="text-gray-400 text-sm">To use cinematic video generation, you must select an API key from a project with billing enabled.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 text-xs hover:underline mt-2 inline-block">Learn about billing</a>
          </div>
          <button
            onClick={handleOpenKeyDialog}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="glass rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 space-y-4 w-full">
          <label className="block text-sm font-semibold text-gray-300">What cinematic vision do you have?</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A drone shot sweeping over a neon-lit cyberpunk city in the rain..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap disabled:opacity-50"
        >
          {isGenerating ? 'Processing...' : 'Generate 7s Video'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {isGenerating && (
          <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-1">Generating Video</h3>
              <p className="text-indigo-400 font-medium animate-pulse">{statusMessage}</p>
              <p className="text-gray-500 text-xs mt-4">This usually takes 1-3 minutes. Sit tight!</p>
            </div>
          </div>
        )}

        {results.map((res, idx) => (
          <div key={idx} className="glass rounded-3xl overflow-hidden">
            <div className="aspect-video bg-black relative group">
              <video 
                src={res.url} 
                controls 
                className="w-full h-full"
                poster="https://picsum.photos/1280/720?grayscale"
              />
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white">
                Veo 3.1 • 1080p • 16:9
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-200 mb-2 italic">"{res.prompt}"</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Created on {res.timestamp.toLocaleString()}</span>
                <a href={res.url} download className="text-indigo-400 hover:text-indigo-300 font-semibold">Download Video</a>
              </div>
            </div>
          </div>
        ))}

        {!isGenerating && results.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-500 opacity-50">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Ready to bring your ideas to life.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoView;
