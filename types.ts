import * as THREE from 'three';

export enum AppMode {
  BROWSE = 'BROWSE',
  FOCUS = 'FOCUS',
  AGGREGATE = 'AGGREGATE',
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'EMPTY';

export interface PictureItem {
  id: string;
  type: MediaType;
  url?: string;
  aspectRatio: number; // width / height
  // Fix: Ensure THREE namespace is available for these types
  texture?: THREE.Texture | THREE.VideoTexture;
  videoElement?: HTMLVideoElement;
}

export interface HandGestureState {
  isHandPresent: boolean;
  isPinching: boolean;
  isOpenPalm: boolean;
  handX: number; // Normalized 0-1
  handY: number; // Normalized 0-1
}

export interface AppSettings {
  slotCount: number;
  frameScale: number;
  nebulaDensity: number; // Controls Sphere Radius in Aggregate mode
  driftSpeed: number;    // Controls Rotation Speed in Aggregate mode
  browseSpacing: number; // Controls distance between frames in Browse mode
  focusZoom: number;     // Controls the scale multiplier when an item is focused
}