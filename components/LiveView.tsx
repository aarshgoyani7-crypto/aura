
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audioUtils.ts';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model', text: string}[]>([]);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef<{user: string, model: string}>({user: '', model: ''});

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContext) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.model += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              const user = transcriptionRef.current.user;
              const model = transcriptionRef.current.model;
              if (user || model) {
                setTranscriptions(prev => [...prev, {role: 'user', text: user}, {role: 'model', text: model}]);
              }
              transcriptionRef.current = {user: '', model: ''};
            }
          },
          onerror: (e) => console.error('Live error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error('Failed to start live session:', error);
      setIsConnecting(false);
      alert('Could not access microphone or connect to Gemini Live.');
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-4 max-w-xl">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Gemini Live Experience
        </h2>
        <p className="text-gray-400">
          Natural, zero-latency voice conversations. Ask questions, brainstorm out loud, or just chat with Gemini in real-time.
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-indigo-500/20 rounded-full animate-ping opacity-75"></div>
            <div className="w-48 h-48 bg-purple-500/10 rounded-full animate-pulse delay-75"></div>
          </div>
        )}

        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'
          }`}
        >
          <div className="mb-2">
            {isConnecting ? (
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isActive ? (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            {isConnecting ? 'Opening...' : isActive ? 'End' : 'Start Live'}
          </span>
        </button>
      </div>

      {isActive && (
        <div className="w-full max-w-2xl glass rounded-3xl p-6 h-48 overflow-y-auto">
          <p className="text-xs text-indigo-400 font-bold mb-4 uppercase tracking-widest">Real-time Transcription</p>
          <div className="space-y-4">
            {transcriptions.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`text-sm px-4 py-2 rounded-xl ${t.role === 'user' ? 'bg-indigo-600/20 text-indigo-200' : 'bg-white/5 text-gray-400'}`}>
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveView;
