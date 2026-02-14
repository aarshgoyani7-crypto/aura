
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageResult } from '../types.ts';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for local dev if process.env.API_KEY is present
        const envKey = process.env.API_KEY;
        if (envKey && envKey !== 'undefined' && envKey.length > 5) setHasKey(true);
      }
    };
    checkKey();
    
    // Set up a listener for key changes (polling as recommended for robustness)
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Optimistic proceed to avoid race conditions
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      // Re-initialize to ensure we use the latest key from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
          },
        },
      });

      let foundImage = false;
      const candidate = response.candidates?.[0];
      
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            setResults(prev => [{ url: imageUrl, prompt, timestamp: new Date() }, ...prev]);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        alert("The model did not return an image. This can happen with very short or restricted prompts.");
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      if (error?.message?.includes('Requested entity was not found') || error?.message?.includes('404')) {
        setHasKey(false);
        alert('API session issue detected. Please re-select your API key.');
      } else {
        alert("Generation Error: " + (error?.message || "Check your connection and API key status."));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md glass rounded-[2.5rem] p-10 text-center space-y-8 border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 rotate-3">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Flash Image Studio</h2>
            <p className="text-gray-400 text-sm leading-relaxed">To enable image generation on Vercel, you must connect your Gemini API key.</p>
          </div>
          <button
            onClick={handleOpenKeyDialog}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 transform hover:scale-[1.02] active:scale-95"
          >
            Connect API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
      <div className="lg:col-span-1 glass rounded-[2.5rem] p-8 space-y-8 flex flex-col h-full overflow-y-auto border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Visual Engine</h2>
          <p className="text-sm text-gray-500">Gemini 2.5 Flash • Rapid Visuals</p>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Creative Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A surreal floating island with waterfalls flowing into the clouds, digital art style..."
            className="w-full h-48 bg-gray-950/50 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none shadow-inner"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  aspectRatio === ratio
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="mt-auto w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Image
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-[2.5rem] border-dashed border-2 border-white/10">
            <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Gallery</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Your generated visual creations will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((res, idx) => (
              <div key={idx} className="glass rounded-[2rem] overflow-hidden group border border-white/5 hover:border-indigo-500/30 transition-colors shadow-2xl">
                <div className="relative aspect-square">
                  <img src={res.url} alt={res.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                    <p className="text-xs text-white leading-relaxed line-clamp-6 mb-6 font-medium">"{res.prompt}"</p>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = res.url;
                        link.download = `aura-gen-${Date.now()}.png`;
                        link.click();
                      }}
                      className="px-6 py-2.5 bg-white text-black rounded-full text-xs font-bold hover:bg-indigo-50 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <div className="p-5 flex justify-between items-center bg-gray-950/80 backdrop-blur-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Aura Engine</span>
                    <span className="text-[9px] text-gray-600 mt-0.5">{res.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;
