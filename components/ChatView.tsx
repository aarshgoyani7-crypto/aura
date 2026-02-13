
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
    if (!input.trim() || isLoading) return;

    const apiKey = typeof process !== 'undefined' ? process.env?.API_KEY : '';
    if (!apiKey || apiKey === 'undefined') {
      alert("API Key is not active. Please use the 'Activate Key' button in the header.");
      return;
    }

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
          systemInstruction: 'You are Aura, a helpful AI assistant. You provide concise, intelligent, and accurate information.',
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
      let errorText = 'I encountered an unexpected error. Please check your API key.';
      
      if (error?.message?.includes('404') || error?.message?.includes('not found') || error?.message?.includes('401')) {
        errorText = 'Your API key appears to be invalid or expired. Please click "Activate Key" in the header to re-connect.';
        if (window.aistudio) {
           window.aistudio.openSelectKey();
        }
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
    <div className="flex flex-col h-full bg-gray-900/50 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">How can I assist you?</h2>
            <p className="text-gray-400 max-w-sm">Aura is ready to help you with research, coding, or creative writing.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                : 'bg-white/10 text-gray-200 border border-white/5 backdrop-blur-md'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              <span className="text-[10px] opacity-30 mt-2 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && !messages[messages.length - 1]?.text && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/5">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-2">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
