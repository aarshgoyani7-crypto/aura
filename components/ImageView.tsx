
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ImageResult } from '../types.ts';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
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
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setResults(prev => [{ url: imageUrl, prompt, timestamp: new Date() }, ...prev]);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        alert("The model didn't return an image. Please try a different prompt.");
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert("Error generating image. This may be due to an API error or content safety filters.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-hidden">
      <div className="lg:col-span-1 glass rounded-3xl p-6 space-y-8 flex flex-col h-full overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold mb-2">Image Studio</h2>
          <p className="text-sm text-gray-400">Transform your words into stunning visual art.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A surreal landscape with floating islands and neon waterfalls..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {['1:1', '4:3', '16:9', '9:16', '3:4'].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                  aspectRatio === ratio
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
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
          className="mt-auto w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Create Masterpiece
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-3xl border-dashed border-2 border-white/10">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No Images Yet</h3>
            <p className="text-gray-400 max-w-sm">Enter a prompt on the left to start generating unique AI artwork.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((res, idx) => (
              <div key={idx} className="glass rounded-3xl overflow-hidden group border border-white/5">
                <div className="relative aspect-square">
                  <img src={res.url} alt={res.prompt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                    <p className="text-xs text-white line-clamp-4">{res.prompt}</p>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center bg-gray-900/40">
                  <span className="text-[10px] text-gray-500">{res.timestamp.toLocaleDateString()}</span>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = res.url;
                      link.download = `aura-gen-${idx}.png`;
                      link.click();
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
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
