
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import ChatView from './components/ChatView.tsx';
import ImageView from './components/ImageView.tsx';
import VideoView from './components/VideoView.tsx';
import LiveView from './components/LiveView.tsx';
import { AppView } from './types.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'ok' | 'missing'>('checking');

  const checkKey = () => {
    try {
      // Check if process and env are defined and if API_KEY is a valid non-empty string
      const key = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
      const isValid = key && key !== 'undefined' && key.length > 5;
      setApiKeyStatus(isValid ? 'ok' : 'missing');
    } catch (e) {
      setApiKeyStatus('missing');
    }
  };

  useEffect(() => {
    checkKey();
    // Re-check periodically to handle dynamic injection
    const interval = setInterval(checkKey, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleFixConnection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      checkKey();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT: return <ChatView />;
      case AppView.IMAGE: return <ImageView />;
      case AppView.VIDEO: return <VideoView />;
      case AppView.LIVE: return <LiveView />;
      default: return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden z-10 relative">
        <header className="flex justify-between items-center mb-8 px-2">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {currentView === AppView.CHAT && 'Creative Chat'}
              {currentView === AppView.IMAGE && 'Visual Studio'}
              {currentView === AppView.VIDEO && 'Video Production'}
              {currentView === AppView.LIVE && 'Live Interaction'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 font-medium">Aura Suite</span>
              <span className="text-gray-700">•</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  apiKeyStatus === 'ok' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {apiKeyStatus === 'ok' ? 'API Active' : 'API Inactive'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {apiKeyStatus !== 'ok' && (
              <button 
                onClick={handleFixConnection}
                className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Activate Key
              </button>
            )}
            
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Aura" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {apiKeyStatus === 'missing' && currentView !== AppView.VIDEO ? (
            <div className="absolute inset-0 z-50 glass rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-6">
               <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
               </div>
               <div>
                <h3 className="text-2xl font-bold text-white mb-2">API Connection Required</h3>
                <p className="text-gray-400 max-w-md mx-auto">To start using Aura Creative Studio, you need to activate an API key. Click the button below to secure your connection.</p>
               </div>
               <button 
                onClick={handleFixConnection}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-3"
               >
                Activate API Key Now
               </button>
            </div>
          ) : renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
