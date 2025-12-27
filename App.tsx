
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Visuals3D } from './components/Visuals3D';
import { Overlay } from './components/Overlay';
import { VisionManager, EMA, distance3D, clamp } from './utils';
import { AppMode, AppSettings, PictureItem } from './types';
import { DrawingUtils, NormalizedLandmark, HandLandmarker } from "@mediapipe/tasks-vision";

// Initial slot count
const INITIAL_SLOTS = 20;

export default function App() {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.AGGREGATE);
  const [settings, setSettings] = useState<AppSettings>({ 
    slotCount: INITIAL_SLOTS, 
    frameScale: 1.8, 
    nebulaDensity: 1.0, // Sphere Radius Multiplier
    driftSpeed: 0.2,    // Sphere Rotation Speed
    browseSpacing: 0.22, // Angle step - Note: This is now overridden by calculated circular spacing in logic
    focusZoom: 1.3       // Magnification in Focus mode
  });
  const [items, setItems] = useState<PictureItem[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const requestRef = useRef<number | null>(null);
  const lastHandTime = useRef<number>(0);
  
  // Smoothing vars
  const handX_EMA = useRef(new EMA(0.1)); 
  const pinchSmoother = useRef(new EMA(0.2));
  const openPalmSmoother = useRef(new EMA(0.2));

  // --- Initialization ---
  
  // Initialize Slots
  useEffect(() => {
    const newItems: PictureItem[] = [];
    for (let i = 0; i < settings.slotCount; i++) {
        if (items[i]) {
            newItems.push(items[i]);
        } else {
            newItems.push({
                id: `slot-${Date.now()}-${i}`,
                type: 'EMPTY',
                aspectRatio: 1.0 
            });
        }
    }
    if (newItems.length > settings.slotCount) {
        newItems.length = settings.slotCount;
    }
    setItems(newItems);
  }, [settings.slotCount]);

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener("loadeddata", predictWebcam);
    } catch (e) {
      console.error("Camera denied:", e);
      setPermissionError(true);
    }
  };

  // Setup Vision
  useEffect(() => {
    const initVision = async () => {
      try {
        const vm = VisionManager.getInstance();
        await vm.initialize();
        await startCamera();
        setIsLoading(false);
      } catch (e) {
        console.error("Vision init failed:", e);
        setPermissionError(true);
        setIsLoading(false);
      }
    };
    initVision();
  }, []);

  // --- Gesture Loop ---

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const vm = VisionManager.getInstance();

    if (!video || !canvas || !vm.handLandmarker) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startTimeMs = performance.now();
    let results;
    try {
        if (video.currentTime > 0) {
            results = vm.handLandmarker.detectForVideo(video, startTimeMs);
        }
    } catch (e) { console.warn(e) }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]; 
        lastHandTime.current = Date.now();
        
        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#ff2244", lineWidth: 2 });
        drawingUtils.drawLandmarks(landmarks, { color: "#ffffff", radius: 1, lineWidth: 0 });
        
        processGestures(landmarks);

    } else {
        // No hand detected for a while -> Go to Idle/Sphere Mode (AGGREGATE)
        if (Date.now() - lastHandTime.current > 500) { 
            setMode(prev => prev !== AppMode.AGGREGATE ? AppMode.AGGREGATE : prev);
            handX_EMA.current.reset();
        }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, []);

  const processGestures = (landmarks: NormalizedLandmark[]) => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleMCP = landmarks[9];
    
    // 1. Pinch Detection (Precision)
    const pinchDist = distance3D(thumbTip, indexTip);
    const isPinchingRaw = pinchDist < 0.06 ? 1 : 0; 
    const pinchVal = pinchSmoother.current.update(isPinchingRaw);
    const isPinchActive = pinchVal > 0.6; 

    // 2. Open Palm Detection
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    let extendedCount = 0;
    for(let i=0; i<tips.length; i++) {
        const dTip = distance3D(wrist, landmarks[tips[i]]);
        const dPip = distance3D(wrist, landmarks[pips[i]]);
        if (dTip > dPip * 1.1) extendedCount++;
    }
    
    const isOpenRaw = extendedCount >= 3 ? 1 : 0;
    const openVal = openPalmSmoother.current.update(isOpenRaw);
    const isOpenActive = openVal > 0.6;

    setMode((currentMode) => {
        // Priority 1: Pinch -> Focus
        if (isPinchActive) {
            return AppMode.FOCUS;
        }
        
        // Priority 2: Release Pinch Logic
        if (currentMode === AppMode.FOCUS) {
             if (pinchVal < 0.4) {
                 // If we release pinch, check if hand is open to browse, otherwise aggregate
                 return isOpenActive ? AppMode.BROWSE : AppMode.AGGREGATE;
             }
             return AppMode.FOCUS; 
        }
        
        // Priority 3: Open Palm -> Browse
        if (isOpenActive) {
            return AppMode.BROWSE;
        }

        // Default / Relaxed / No specific gesture -> Aggregate (Sphere)
        return AppMode.AGGREGATE;
    });

    // Scroll Logic (Only active in Browse/Focus)
    const smoothedX = handX_EMA.current.update(middleMCP.x);
    
    setMode(currentMode => {
        if (currentMode === AppMode.BROWSE) {
            const delta = smoothedX - 0.5;
            setScrollOffset(prev => prev + delta * 0.15); 
        }
        return currentMode;
    });
  };

  // --- Focus Target Logic ---
  useEffect(() => {
    if (items.length === 0) return;
    
    // Calculate angle step exactly as in Visuals3D to match positions
    const angleStep = (Math.PI * 2) / items.length;
    
    // Reverse engineer index from scrollOffset
    // Visuals3D: theta = index * angleStep + scrollOffset
    // We want theta ≈ 0 (front center)
    // index * angleStep + scrollOffset ≈ 0  =>  index ≈ -scrollOffset / angleStep
    
    const rawIndex = Math.round(-scrollOffset / angleStep);
    const len = items.length;
    
    // Correct modulo for negative numbers: ((n % m) + m) % m
    const wrappedIndex = ((rawIndex % len) + len) % len;
    
    if (items[wrappedIndex]) {
        setFocusedId(items[wrappedIndex].id);
    }
  }, [scrollOffset, items]);


  // --- Media Handlers ---

  const handleMediaUpload = (files: FileList) => {
    setNeedsInteraction(false);
    const newFiles = Array.from(files);
    
    setItems(prevItems => {
        const nextItems = [...prevItems];
        let fileIdx = 0;
        
        for (let i = 0; i < nextItems.length && fileIdx < newFiles.length; i++) {
            if (nextItems[i].type === 'EMPTY') {
                const file = newFiles[fileIdx];
                const url = URL.createObjectURL(file);
                const isVideo = file.type.startsWith('video');
                const type: 'IMAGE' | 'VIDEO' = isVideo ? 'VIDEO' : 'IMAGE';
                
                nextItems[i] = {
                    ...nextItems[i],
                    type: type,
                    url: url,
                    aspectRatio: 1 
                };

                if (type === 'IMAGE') {
                    const img = new Image();
                    img.src = url;
                    const id = nextItems[i].id;
                    img.onload = () => {
                        const texture = new THREE.Texture(img);
                        texture.needsUpdate = true;
                        texture.colorSpace = THREE.SRGBColorSpace;
                        setItems(current => current.map(item => {
                            if (item.id === id) {
                                return { ...item, texture, aspectRatio: img.width / img.height };
                            }
                            return item;
                        }));
                    };
                } else {
                    const videoEl = document.createElement('video');
                    videoEl.src = url;
                    videoEl.muted = true;
                    videoEl.loop = true;
                    videoEl.playsInline = true;
                    videoEl.crossOrigin = "anonymous";
                    const id = nextItems[i].id;
                    
                    videoEl.onloadedmetadata = () => {
                        const texture = new THREE.VideoTexture(videoEl);
                        texture.colorSpace = THREE.SRGBColorSpace;
                        setItems(current => current.map(item => {
                            if (item.id === id) {
                                return { 
                                    ...item, 
                                    texture, 
                                    videoElement: videoEl,
                                    aspectRatio: videoEl.videoWidth / videoEl.videoHeight 
                                };
                            }
                            return item;
                        }));
                    }
                }

                fileIdx++;
            }
        }
        return nextItems;
    });
  };

  const handleClearMedia = () => {
      setItems(prev => prev.map(item => ({
          ...item,
          type: 'EMPTY',
          url: undefined,
          texture: undefined,
          videoElement: undefined,
          aspectRatio: 1.0
      })));
  };

  const handleMusicUpload = (file: File) => {
    setNeedsInteraction(false);
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    audioRef.current.loop = true;
    audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
  };

  const toggleMusic = () => {
    setNeedsInteraction(false);
    if (audioRef.current.paused) {
        audioRef.current.play().then(() => setMusicPlaying(true));
    } else {
        audioRef.current.pause();
        setMusicPlaying(false);
    }
  };

  const handleGlobalClick = () => {
    setNeedsInteraction(false);
    if (musicPlaying && audioRef.current.paused) {
        audioRef.current.play();
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950" onClick={handleGlobalClick}>
      <Visuals3D 
        items={items}
        mode={mode}
        scrollOffset={scrollOffset}
        focusedId={focusedId}
        frameScale={settings.frameScale}
        nebulaDensity={settings.nebulaDensity}
        driftSpeed={settings.driftSpeed}
        browseSpacing={settings.browseSpacing}
        focusZoom={settings.focusZoom}
        onFrameClick={handleGlobalClick}
      />
      <Overlay 
        webcamVideoRef={videoRef}
        canvasRef={canvasRef}
        mode={mode}
        settings={settings}
        setSettings={setSettings}
        onUploadMedia={handleMediaUpload}
        onClearMedia={handleClearMedia}
        onUploadMusic={handleMusicUpload}
        musicPlaying={musicPlaying}
        toggleMusic={toggleMusic}
        permissionError={permissionError}
        needsInteraction={needsInteraction}
        isLoading={isLoading}
      />
    </div>
  );
}
