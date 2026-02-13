
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage } from '../types.ts';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const apiKey = process.env?.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 5) {
      alert("System Error: API Key is inactive. Please use the 'Connect API' button.");
      return;
    }

    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are Aura, an elite AI assistant. You provide precise, expert-level insights. Format your responses with markdown for clarity when appropriate.',
        },
      });

      const responseStream = await chat.sendMessageStream({ message: currentInput });
      
      let aiMessageId = (Date.now() + 1).toString();
      let fullAiResponse = '';

      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        fullAiResponse += c.text || '';
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, text: fullAiResponse } : msg
        ));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorText = 'Aura encountered a connection interrupt. Please verify your API status.';
      
      if (error?.message?.includes('401') || error?.message?.includes('403') || error?.message?.includes('404')) {
        errorText = 'Your API session has expired. Please re-authenticate using the header button.';
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: errorText,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/5 shadow-inner">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Initiate Conversation</h2>
              <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">Aura is powered by Gemini 3, ready for complex reasoning, coding, and creative analysis.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] lg:max-w-[75%] rounded-3xl px-6 py-4 shadow-xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-indigo-600/10' 
                : 'bg-white/5 text-gray-200 border border-white/5 backdrop-blur-xl'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
              <div className={`text-[9px] font-bold uppercase tracking-widest mt-3 flex items-center gap-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-600'}`}>
                <span>{msg.role === 'user' ? 'Direct Input' : 'Aura Insight'}</span>
                <span>•</span>
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && !messages[messages.length - 1]?.text && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/5">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 lg:p-8 pt-2">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[1.75rem] blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500"></div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query Aura Intelligence..."
            className="relative w-full bg-gray-900 border border-white/10 rounded-[1.5rem] px-8 py-5 pr-20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm placeholder-gray-600 shadow-2xl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-[0.2em] font-bold">Encrypted End-to-End Chat</p>
      </div>
    </div>
  );
};
async function sendToGemini(text: string) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: text })
  });

  const data = await res.json();
  console.log(data);
}
export default ChatView;
