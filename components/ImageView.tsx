
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageResult } from '../types.ts';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [errorType, setErrorType] = useState<'none' | 'rate-limit' | 'other'>('none');

  const checkKey = async () => {
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      const envKey = process.env.API_KEY;
      if (envKey && envKey !== 'undefined' && envKey.length > 10) setHasKey(true);
    }
  };

  useEffect(() => {
    checkKey();
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setErrorType('none');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorType('none');
    
    try {
      // Create fresh instance to ensure we use the latest injected key
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
        alert("Visual generation returned no data. Try a more descriptive prompt.");
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      const is429 = error?.message?.includes('429') || error?.status === 429;
      
      if (is429) {
        setErrorType('rate-limit');
        setHasKey(false); // Force re-selection to bypass shared quota
      } else if (error?.message?.includes('404') || error?.message?.includes('entity was not found')) {
        setHasKey(false);
        alert('API session issue. Please re-select your key.');
      } else {
        setErrorType('other');
        alert("Generation Error: " + (error?.message || "Check connection."));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md glass rounded-[2.5rem] p-10 text-center space-y-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {errorType === 'rate-limit' && (
            <div className="absolute top-0 left-0 right-0 bg-amber-500/20 py-2 text-[10px] font-black uppercase tracking-widest text-amber-400 border-b border-amber-500/20">
              Shared Quota Exceeded (429)
            </div>
          )}
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 rotate-3">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {errorType === 'rate-limit' ? 'Personal Key Required' : 'Flash Image Studio'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {errorType === 'rate-limit' 
                ? 'The shared free quota is currently full. To continue generating, please connect your own API key.'
                : 'To enable image generation in this environment, you must connect a personal Gemini API key.'}
            </p>
          </div>
          <button
            onClick={handleOpenKeyDialog}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 transform hover:scale-[1.02] active:scale-95"
          >
            Connect Personal Key
          </button>
          <p className="text-[10px] text-gray-500">Each user gets a dedicated free quota with their own key.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
      <div className="lg:col-span-1 glass rounded-[2.5rem] p-8 space-y-8 flex flex-col h-full overflow-y-auto border border-white/5">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Visual Engine</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Gemini 2.5 Flash</p>
          </div>
          <button onClick={() => setHasKey(false)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors" title="Switch Key">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic cyberpunk street at night with glowing pink neon lights..."
            className="w-full h-48 bg-gray-950/50 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
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
              Rendering...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Vision
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-[2.5rem] border-dashed border-2 border-white/10">
            <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Creative Canvas</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">Your visual outputs will appear here as soon as they are processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {results.map((res, idx) => (
              <div key={idx} className="glass rounded-[2rem] overflow-hidden group border border-white/5 hover:border-indigo-500/30 transition-all">
                <div className="relative aspect-square">
                  <img src={res.url} alt={res.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                    <p className="text-[10px] text-white leading-relaxed line-clamp-4 mb-4 font-medium italic">"{res.prompt}"</p>
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = res.url;
                        link.download = `aura-gen-${Date.now()}.png`;
                        link.click();
                      }}
                      className="px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
                    >
                      Save Art
                    </button>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-950/80 backdrop-blur-xl">
                  <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Aura v2.5 Output</span>
                  <span className="text-[9px] text-gray-600 font-medium">{res.timestamp.toLocaleTimeString()}</span>
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
