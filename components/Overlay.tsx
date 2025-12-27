
import React, { useState } from 'react';
import { AppMode, AppSettings } from '../types';

interface OverlayProps {
  webcamVideoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mode: AppMode;
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  onUploadMedia: (files: FileList) => void;
  onClearMedia: () => void;
  onUploadMusic: (file: File) => void;
  musicPlaying: boolean;
  toggleMusic: () => void;
  permissionError: boolean;
  needsInteraction: boolean;
  isLoading: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({
  webcamVideoRef,
  canvasRef,
  mode,
  settings,
  setSettings,
  onUploadMedia,
  onClearMedia,
  onUploadMusic,
  musicPlaying,
  toggleMusic,
  permissionError,
  needsInteraction,
  isLoading
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [webcamCollapsed, setWebcamCollapsed] = useState(false);

  // Helper for mode display name
  const getModeLabel = () => {
      switch(mode) {
          case AppMode.BROWSE: return "BROWSE";
          case AppMode.FOCUS: return "FOCUS";
          case AppMode.AGGREGATE: return "SPHERE";
          default: return "";
      }
  };

  const getStatusColor = () => {
      switch(mode) {
          case AppMode.FOCUS: return 'bg-green-400 shadow-[0_0_8px_#4ade80]';
          case AppMode.BROWSE: return 'bg-blue-400 shadow-[0_0_8px_#60a5fa]';
          case AppMode.AGGREGATE: return 'bg-purple-400 shadow-[0_0_8px_#d8b4fe]';
          default: return 'bg-white/50';
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 overflow-hidden">
      
      {/* --- TOP BAR --- */}
      <div className="w-full p-8 flex justify-between items-start pointer-events-auto">
        
        {/* Artistic Title */}
        <div className="relative select-none">
          <h1 className="text-5xl font-serif italic font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-100 via-white to-orange-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            2025 Memory Album
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 mt-2 rounded-full opacity-80" />
        </div>

        {/* Unified Action Buttons (Top Right) */}
        <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-all hover:bg-white/10">
                {/* Upload */}
                <label className="cursor-pointer p-2 hover:bg-white/10 rounded transition-colors text-white text-xs font-semibold tracking-wide uppercase flex items-center justify-center w-8 h-8" title="Upload Media">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => e.target.files && onUploadMedia(e.target.files)}
                    />
                </label>

                <div className="w-[1px] bg-white/20 my-1"></div>

                {/* Clear */}
                <button 
                    onClick={onClearMedia}
                    className="p-2 hover:bg-red-500/20 hover:text-red-200 text-white/80 rounded transition-colors text-xs font-semibold tracking-wide uppercase flex items-center justify-center w-8 h-8"
                    title="Clear All"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>

            <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-lg transition-all hover:bg-white/10">
                {/* Music Upload */}
                <label className="cursor-pointer p-2 hover:bg-white/10 rounded transition-colors text-blue-200 text-xs font-semibold tracking-wide uppercase flex items-center justify-center w-8 h-8" title="Upload BGM">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                    <input 
                        type="file" 
                        accept="audio/*" 
                        className="hidden" 
                        onChange={(e) => e.target.files && onUploadMusic(e.target.files[0])}
                    />
                </label>

                <div className="w-[1px] bg-white/20 my-1"></div>

                {/* Play/Pause */}
                <button 
                    onClick={toggleMusic}
                    className={`p-2 rounded transition-colors text-xs font-semibold tracking-wide uppercase flex items-center justify-center w-8 h-8 ${musicPlaying ? 'text-green-300 bg-green-900/30' : 'text-white/60 hover:text-white'}`}
                    title={musicPlaying ? "Pause" : "Play"}
                >
                     {musicPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                     ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                     )}
                </button>
            </div>
        </div>
      </div>


      {/* --- MIDDLE: Interaction Prompt / Loading Screen --- */}
      {needsInteraction && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-none">
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-xl border border-white/10 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {isLoading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="text-2xl text-white font-serif italic tracking-widest mb-2">2025 Annual Memories Loading...</div>
                    <div className="text-xs text-white/50 font-mono">INITIALIZING VISION</div>
                </div>
            ) : (
                <div className="flex flex-col items-center animate-pulse">
                     <h2 className="text-3xl text-white font-serif italic mb-3 tracking-widest drop-shadow-lg">2025 Annual Memories</h2>
                     <div className="text-xs text-white/60 font-mono tracking-[0.2em] uppercase">Click Anywhere to Enter</div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Backdrop */}
      {showSettings && (
          <div 
            className="absolute inset-0 bg-transparent z-40 pointer-events-auto"
            onClick={() => setShowSettings(false)}
          />
      )}

      {/* --- BOTTOM BAR --- */}
      <div className="w-full p-8 flex justify-between items-end pointer-events-auto bg-gradient-to-t from-black/90 to-transparent z-50">
        
        {/* Bottom Left: Settings -> Tips -> Status */}
        <div className="flex flex-col items-start gap-4">
            
            {/* 1. Settings */}
            <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-full border border-white/20 transition-all shadow-lg backdrop-blur-md flex items-center justify-center w-10 h-10 ${showSettings ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title="Settings"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                
                {/* Settings Popup */}
                {showSettings && (
                    <div className="absolute bottom-full left-0 mb-3 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-lg text-white text-xs w-64 shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <div className="font-bold text-white/90 uppercase tracking-widest border-b border-white/10 pb-1 mb-3">Preferences</div>
                        
                        {/* Frame Count */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Frames Count</span> <span>{settings.slotCount}</span>
                            </label>
                            <input 
                                type="range" 
                                min="5" 
                                max="50" 
                                value={settings.slotCount} 
                                onChange={(e) => setSettings({...settings, slotCount: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Frame Size */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Frame Size</span> <span>{settings.frameScale.toFixed(1)}x</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="3.0" 
                                step="0.1"
                                value={settings.frameScale} 
                                onChange={(e) => setSettings({...settings, frameScale: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Sphere Radius (was Nebula Density) */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Sphere Radius</span> <span>{settings.nebulaDensity.toFixed(1)}</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="3.0" 
                                step="0.1"
                                value={settings.nebulaDensity} 
                                onChange={(e) => setSettings({...settings, nebulaDensity: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Sphere Speed (was Drift Speed) */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Sphere Speed</span> <span>{settings.driftSpeed.toFixed(1)}</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.0" 
                                max="2.0" 
                                step="0.1"
                                value={settings.driftSpeed} 
                                onChange={(e) => setSettings({...settings, driftSpeed: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                         {/* Browse Spacing */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Browse Spacing</span> <span>{settings.browseSpacing.toFixed(2)}</span>
                            </label>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="0.5" 
                                step="0.01"
                                value={settings.browseSpacing} 
                                onChange={(e) => setSettings({...settings, browseSpacing: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        
                        {/* Focus Zoom */}
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2 flex justify-between">
                                <span>Focus Zoom</span> <span>{settings.focusZoom.toFixed(1)}x</span>
                            </label>
                            <input 
                                type="range" 
                                min="1.0" 
                                max="2.5" 
                                step="0.1"
                                value={settings.focusZoom} 
                                onChange={(e) => setSettings({...settings, focusZoom: Number(e.target.value)})}
                                className="w-full accent-white h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Mist Density REMOVED */}

                    </div>
                )}
            </div>

            {/* 2. Tips Toggle & Mode Indicator Row */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/20 transition-all text-white text-xs font-mono tracking-widest shadow-lg"
                    title="Show Gesture Guide"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-white text-xs font-mono tracking-widest shadow-lg h-10">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
                    {getModeLabel()}
                </div>
            </div>

            {/* 3. Collapsible Tips Content */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl origin-top-left
                ${showTips ? 'max-h-64 opacity-100 p-4' : 'max-h-0 opacity-0 p-0 border-0'}
            `}>
                <div className="w-64 text-xs text-white/70 space-y-3">
                    <div className="font-bold text-white/90 uppercase tracking-widest border-b border-white/10 pb-1 mb-2">Gesture Guide</div>
                    <div className="flex justify-between items-center">
                        <span>No Hand detected</span> <span className="text-purple-300">Sphere Mode</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Relaxed Hand</span> <span className="text-purple-300">Sphere Mode</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Open Palm</span> <span className="text-blue-300">Browse Mode</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Pinch (Thumb+Index)</span> <span className="text-green-300">Focus & Play</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Bottom Right: Collapsible Webcam Preview */}
        <div className={`relative border border-white/20 rounded-lg overflow-hidden bg-black/80 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 ease-in-out ${webcamCollapsed ? 'w-32 h-8' : 'w-48 h-36'}`}>
           
           {/* Collapse Toggle */}
           <button 
             onClick={() => setWebcamCollapsed(!webcamCollapsed)}
             className="absolute top-0 right-0 z-20 p-1 text-white/50 hover:text-white bg-black/50 rounded-bl-lg"
           >
             <svg className={`w-3 h-3 transform transition-transform ${webcamCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
           </button>

           <div className={`w-full h-full transition-opacity duration-300 ${webcamCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <video 
                    ref={webcamVideoRef} 
                    className="w-full h-full object-cover transform -scale-x-100 opacity-60" 
                    autoPlay 
                    playsInline 
                    muted
                />
                <canvas 
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full transform -scale-x-100 opacity-80"
                />
           </div>
           
           {/* Minimized Label */}
           <div className={`absolute inset-0 flex items-center justify-center text-[10px] text-white/50 font-mono tracking-tighter ${webcamCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
               {permissionError ? "CAM ERROR" : "CAMERA"}
           </div>

           {/* Expanded Label */}
           <div className={`absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-1 text-[10px] text-center text-white/50 font-mono tracking-tighter transition-opacity ${webcamCollapsed ? 'opacity-0' : 'opacity-100'}`}>
             {permissionError ? "CAM ERROR" : "VISION ON"}
           </div>
        </div>

      </div>

      <style>{`
        .glow { text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(100,200,255,0.4); font-weight: bold; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out forwards;
        }
        .typing-effect {
            overflow: hidden; 
            white-space: nowrap; 
            border-right: 2px solid rgba(255,255,255,0.5);
            animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing {
            from { width: 0 }
            to { width: 100% }
        }
        @keyframes blink-caret {
            from, to { border-color: transparent }
            50% { border-color: rgba(255,255,255,0.5); }
        }
      `}</style>
    </div>
  );
};
