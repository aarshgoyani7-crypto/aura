
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
  const [hasPrivateSecret, setHasPrivateSecret] = useState(false);

  const checkKeyStatus = async () => {
    // Check if the user has a selected key (private quota)
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasPrivateSecret(selected);
    }

    const key = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
    const isValid = key && key !== 'undefined' && key.length > 5;
    setApiKeyStatus(isValid ? 'ok' : 'missing');
  };

  useEffect(() => {
    checkKeyStatus();
    const interval = setInterval(checkKeyStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleActivateKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setApiKeyStatus('ok');
        setHasPrivateSecret(true);
      } catch (e) {
        console.error("Failed to open key selection:", e);
      }
    } else {
      alert("API Key Selection is only available within the Aura environment. Please verify your environment.");
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

  // Image and Video views handle their own missing key UI for better user guidance
  const isSelfManagedView = currentView === AppView.IMAGE || currentView === AppView.VIDEO;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[60%] bg-purple-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden z-10 relative">
        <header className="flex justify-between items-center mb-8 px-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {currentView === AppView.CHAT && 'Direct Intelligence'}
              {currentView === AppView.IMAGE && 'Visual Studio'}
              {currentView === AppView.VIDEO && 'Veo Motion'}
              {currentView === AppView.LIVE && 'Live Connect'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">Aura v1.4</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                <div className={`w-1.5 h-1.5 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  apiKeyStatus === 'ok' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {apiKeyStatus === 'ok' ? (hasPrivateSecret ? 'Personal Quota' : 'Shared Quota') : 'Activation Pending'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={handleActivateKey}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
                hasPrivateSecret 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {hasPrivateSecret ? 'Key Connected' : 'Connect Personal Key'}
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner p-1">
              <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Aura&backgroundColor=030712" alt="Avatar" className="w-full h-full object-contain" />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {apiKeyStatus === 'missing' && !isSelfManagedView ? (
            <div className="absolute inset-0 z-40 bg-gray-950/60 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-8 border border-white/5">
               <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center rotate-6 border border-indigo-500/20 shadow-2xl">
                  <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
               </div>
               <div className="space-y-3">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Activate Aura Intelligence</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">Connect your API key to bypass shared rate limits and access expert-level multimodal AI generation.</p>
               </div>
               <button 
                onClick={handleActivateKey}
                className="px-10 py-4 bg-white text-gray-950 hover:bg-indigo-50 font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95"
               >
                Secure Connection
               </button>
               <a href="https://ai.google.dev/" target="_blank" className="text-[10px] text-gray-600 font-bold hover:text-indigo-400 transition-colors uppercase tracking-[0.2em]">Get free key at ai.google.dev</a>
            </div>
          ) : renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
