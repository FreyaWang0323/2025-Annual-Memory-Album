import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

// --- Math Helpers ---

export const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// Exponential Moving Average for smoothing
export class EMA {
  private alpha: number;
  private value: number | null = null;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  update(newValue: number): number {
    if (this.value === null) {
      this.value = newValue;
    } else {
      this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  reset() {
    this.value = null;
  }
}

// --- MediaPipe Helper ---

export class VisionManager {
  private static instance: VisionManager;
  public handLandmarker: HandLandmarker | null = null;

  private constructor() {}

  public static getInstance(): VisionManager {
    if (!VisionManager.instance) {
      VisionManager.instance = new VisionManager();
    }
    return VisionManager.instance;
  }

  public async initialize() {
    if (this.handLandmarker) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  }
}

// Distance between two 3D points
export const distance3D = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }) => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
  );
};
