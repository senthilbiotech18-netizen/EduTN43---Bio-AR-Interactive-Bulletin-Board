import { Project, MarkerMatchResult } from '../types';

export interface ImageFeatureVector {
  dHash: string;
  colorGrid: number[]; // 8x8x3 = 192 values
  edgeHist: number[];  // 16 bins
  aspectRatio: number;
}

// Compute difference hash (dHash) - resilient to lighting and slight perspective shifts
export function computeDHash(ctx: CanvasRenderingContext2D, width: number = 9, height: number = 8): string {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  let hash = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idxLeft = (y * width + x) * 4;
      const idxRight = (y * width + (x + 1)) * 4;
      
      const grayLeft = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];
      const grayRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
      
      hash += grayLeft > grayRight ? '1' : '0';
    }
  }
  return hash;
}

// Compute 8x8 spatial color grid
export function computeColorGrid(ctx: CanvasRenderingContext2D, size: number = 8): number[] {
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const grid: number[] = [];
  
  for (let i = 0; i < data.length; i += 4) {
    grid.push(data[i] / 255);     // R
    grid.push(data[i + 1] / 255); // G
    grid.push(data[i + 2] / 255); // B
  }
  return grid;
}

// Compute simple edge gradient histogram
export function computeEdgeHist(ctx: CanvasRenderingContext2D, size: number = 32): number[] {
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const bins = new Array(16).fill(0);
  
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      const idxRight = (y * size + (x + 1)) * 4;
      const idxDown = ((y + 1) * size + x) * 4;
      
      const gx = data[idxRight] - data[idx];
      const gy = data[idxDown] - data[idx];
      const mag = Math.sqrt(gx * gx + gy * gy);
      const angle = Math.atan2(gy, gx) + Math.PI; // 0 to 2*PI
      const binIdx = Math.floor((angle / (2 * Math.PI)) * 16) % 16;
      bins[binIdx] += mag;
    }
  }
  
  // Normalize
  const total = bins.reduce((a, b) => a + b, 0) || 1;
  return bins.map(v => v / total);
}

// Hamming distance between two binary hash strings
export function hammingDistance(hash1: string, hash2: string): number {
  let dist = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

// Cosine similarity between two float vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Extract full feature descriptor from an Image or Canvas
export async function extractFeaturesFromImage(imageSource: HTMLImageElement | HTMLCanvasElement): Promise<ImageFeatureVector> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not create canvas context');

  const width = imageSource.width || 300;
  const height = imageSource.height || 300;
  const aspectRatio = width / (height || 1);

  // 1. dHash (9x8)
  canvas.width = 9;
  canvas.height = 8;
  ctx.drawImage(imageSource, 0, 0, 9, 8);
  const dHash = computeDHash(ctx, 9, 8);

  // 2. Color Grid (8x8)
  canvas.width = 8;
  canvas.height = 8;
  ctx.drawImage(imageSource, 0, 0, 8, 8);
  const colorGrid = computeColorGrid(ctx, 8);

  // 3. Edge Histogram (32x32)
  canvas.width = 32;
  canvas.height = 32;
  ctx.drawImage(imageSource, 0, 0, 32, 32);
  const edgeHist = computeEdgeHist(ctx, 32);

  return {
    dHash,
    colorGrid,
    edgeHist,
    aspectRatio,
  };
}

// Compare two feature vectors and return match confidence (0.0 - 1.0)
export function compareFeatures(featA: ImageFeatureVector, featB: ImageFeatureVector): number {
  const hashDist = hammingDistance(featA.dHash, featB.dHash);
  const hashSim = Math.max(0, 1 - (hashDist / 64)); // 64 bits

  const colorSim = Math.max(0, cosineSimilarity(featA.colorGrid, featB.colorGrid));
  const edgeSim = Math.max(0, cosineSimilarity(featA.edgeHist, featB.edgeHist));

  // Weighted fusion: Color signature (35%), Spatial edges (35%), Perceptual dHash (30%)
  const confidence = (colorSim * 0.38) + (edgeSim * 0.32) + (hashSim * 0.30);
  return Math.min(1, Math.max(0, confidence));
}

// Pre-load and cache project marker feature vectors
const projectFeatureCache = new Map<string, ImageFeatureVector>();

export async function preloadProjectFeatures(projects: Project[]): Promise<void> {
  for (const project of projects) {
    if (projectFeatureCache.has(project.id)) continue;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load marker for ${project.title}`));
        img.src = project.markerImage;
      });
      const feat = await extractFeaturesFromImage(img);
      projectFeatureCache.set(project.id, feat);
    } catch (e) {
      console.warn(`Feature extraction warning for project ${project.id}:`, e);
    }
  }
}

export function cacheProjectFeature(projectId: string, feature: ImageFeatureVector) {
  projectFeatureCache.set(projectId, feature);
}

// Scan a video element frame and match against registered projects
export async function matchFrameAgainstProjects(
  video: HTMLVideoElement,
  projects: Project[],
  processingCanvas: HTMLCanvasElement,
  minConfidence: number = 0.68
): Promise<MarkerMatchResult | null> {
  if (!video.videoWidth || !video.videoHeight) return null;

  const ctx = processingCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // We sample 3 regions from the frame to handle different distances and centering:
  // 1. Center crop (most common when user aims phone at poster)
  // 2. Full frame
  // 3. Wide center crop
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const crops = [
    // Center 60% crop
    { sx: vw * 0.2, sy: vh * 0.2, sw: vw * 0.6, sh: vh * 0.6, weight: 1.05, box: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 } },
    // Center 80% crop
    { sx: vw * 0.1, sy: vh * 0.1, sw: vw * 0.8, sh: vh * 0.8, weight: 1.0, box: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } },
    // Full frame
    { sx: 0, sy: 0, sw: vw, sh: vh, weight: 0.95, box: { x: 0, y: 0, width: 1.0, height: 1.0 } },
  ];

  let bestResult: MarkerMatchResult | null = null;
  let highestScore = 0;

  for (const crop of crops) {
    // 1. dHash canvas
    processingCanvas.width = 9;
    processingCanvas.height = 8;
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 9, 8);
    const dHash = computeDHash(ctx, 9, 8);

    // 2. Color grid canvas
    processingCanvas.width = 8;
    processingCanvas.height = 8;
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 8, 8);
    const colorGrid = computeColorGrid(ctx, 8);

    // 3. Edge hist
    processingCanvas.width = 32;
    processingCanvas.height = 32;
    ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 32, 32);
    const edgeHist = computeEdgeHist(ctx, 32);

    const frameFeat: ImageFeatureVector = {
      dHash,
      colorGrid,
      edgeHist,
      aspectRatio: crop.sw / crop.sh,
    };

    for (const project of projects) {
      let targetFeat = projectFeatureCache.get(project.id);
      if (!targetFeat) {
        // Fallback: extract on the fly
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = project.markerImage;
          if (img.complete && img.naturalWidth > 0) {
            targetFeat = await extractFeaturesFromImage(img);
            projectFeatureCache.set(project.id, targetFeat);
          }
        } catch {
          // ignore
        }
      }

      if (!targetFeat) continue;

      const rawScore = compareFeatures(frameFeat, targetFeat);
      const score = rawScore * crop.weight;

      if (score > highestScore && score >= minConfidence) {
        highestScore = score;
        bestResult = {
          projectId: project.id,
          project,
          confidence: Math.min(0.99, score),
          boundingBox: crop.box,
          center: {
            x: crop.box.x + crop.box.width / 2,
            y: crop.box.y + crop.box.height / 2,
          },
        };
      }
    }
  }

  return bestResult;
}
