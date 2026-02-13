
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

  const checkKeyStatus = () => {
    // Robustly check for the API key in a way that doesn't throw if process is partially defined
    const key = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
    const isValid = key && key !== 'undefined' && key.length > 5;
    setApiKeyStatus(isValid ? 'ok' : 'missing');
  };

  useEffect(() => {
    checkKeyStatus();
    // Poll for key changes (important for bridging between the app and key selection dialogs)
    const interval = setInterval(checkKeyStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleActivateKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        checkKeyStatus();
      } catch (e) {
        console.error("Failed to open key selection:", e);
      }
    } else {
      alert("API Key Selection is only available within the Aura environment. If you are deployed on Vercel, please set the API_KEY environment variable in your project settings.");
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
      {/* Visual background accents */}
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[40%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <Sidebar currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 flex flex-col p-6 lg:p-8 overflow-hidden z-10 relative">
        <header className="flex justify-between items-center mb-8 px-2">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {currentView === AppView.CHAT && 'Creative Intelligence'}
              {currentView === AppView.IMAGE && 'Visual Studio'}
              {currentView === AppView.VIDEO && 'Motion Production'}
              {currentView === AppView.LIVE && 'Live Interaction'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Aura v1.2</span>
              <span className="text-gray-800">•</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                  apiKeyStatus === 'ok' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {apiKeyStatus === 'ok' ? 'System Online' : 'Pending Activation'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {apiKeyStatus !== 'ok' && (
              <button 
                onClick={handleActivateKey}
                className="px-5 py-2.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-600/20 transition-all flex items-center gap-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Connect API
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
              <img src="https://api.dicebear.com/7.x/shapes/svg?seed=Aura" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {apiKeyStatus === 'missing' && currentView !== AppView.VIDEO ? (
            <div className="absolute inset-0 z-40 bg-gray-950/40 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-8 border border-white/5">
               <div className="relative">
                 <div className="w-24 h-24 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center rotate-3 border border-indigo-500/20">
                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                 <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full border-4 border-gray-950 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">!</span>
                 </div>
               </div>
               <div className="space-y-3">
                <h3 className="text-3xl font-bold text-white tracking-tight">Activate Aura Studio</h3>
                <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">Your creative workspace is ready. Connect your Gemini API key to unlock world-class generation and reasoning.</p>
               </div>
               <button 
                onClick={handleActivateKey}
                className="px-10 py-4 bg-white text-gray-950 hover:bg-indigo-50 font-bold rounded-2xl shadow-xl shadow-white/5 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
               >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure Connection
               </button>
               <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Encrypted End-to-End Session</p>
            </div>
          ) : renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
