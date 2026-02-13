
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

  useEffect(() => {
    // Re-check key status after a short delay to allow environment injection
    const checkKey = () => {
      const key = process.env.API_KEY;
      setApiKeyStatus(key && key !== 'undefined' ? 'ok' : 'missing');
    };
    
    checkKey();
    const timer = setTimeout(checkKey, 500);
    return () => clearTimeout(timer);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatView />;
      case AppView.IMAGE:
        return <ImageView />;
      case AppView.VIDEO:
        return <VideoView />;
      case AppView.LIVE:
        return <LiveView />;
      default:
        return <ChatView />;
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
              {currentView === AppView.IMAGE && 'Visual Generation'}
              {currentView === AppView.VIDEO && 'Veo Video Production'}
              {currentView === AppView.LIVE && 'Live Interaction'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">Aura Suite v1.0</span>
              <span className="text-gray-600">•</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                apiKeyStatus === 'ok' ? 'text-emerald-400' : 
                apiKeyStatus === 'missing' ? 'text-amber-500' : 'text-gray-500'
              }`}>
                {apiKeyStatus === 'ok' ? 'API Active' : 
                 apiKeyStatus === 'missing' ? 'API Key Pending' : 'Checking...'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">Connection</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <span className="text-sm font-semibold text-gray-300">
                  {apiKeyStatus === 'ok' ? 'Ready' : 'Standby'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=Aura`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
