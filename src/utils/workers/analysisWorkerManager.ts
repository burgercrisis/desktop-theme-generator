import { HarmonyRule, VariantStrategy, ColorSpace, OutputSpace, SeedColor } from '../../types';

export interface AnalysisProgress {
  current: number;
  total: number;
  phase: 'coarse' | 'fine';
  percentage: number;
}

export interface AnalysisResult {
  bestHarmony: HarmonyRule;
  bestSpread: number;
  bestStrategy: VariantStrategy;
}

class AnalysisWorkerManager {
  private worker: Worker | null = null;
  private currentTaskId: number = 0;
  private pendingTasks = new Map<number, {
    resolve: (result: AnalysisResult) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: AnalysisProgress) => void;
  }>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      // Create worker from the TypeScript file
      const workerUrl = new URL('../workers/analysisWorker.ts', import.meta.url);
      this.worker = new Worker(workerUrl, { type: 'module' });
      
      this.worker.onmessage = (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            this.handleProgress(payload);
            break;
          case 'RESULT':
            this.handleResult(payload);
            break;
        }
      };

      this.worker.onerror = (error) => {
        console.error('Analysis worker error:', error);
        this.rejectAllTasks(new Error('Worker error occurred'));
      };
    } catch (error) {
      console.error('Failed to initialize analysis worker:', error);
      // Fallback to non-worker mode if worker creation fails
      this.worker = null;
    }
  }

  private handleProgress(payload: any) {
    // Find the active task (there should only be one at a time)
    const activeTask = Array.from(this.pendingTasks.values())[0];
    if (activeTask?.onProgress) {
      const percentage = Math.round((payload.current / payload.total) * 100);
      activeTask.onProgress({
        ...payload,
        percentage
      });
    }
  }

  private handleResult(payload: any) {
    const activeTask = Array.from(this.pendingTasks.values())[0];
    if (activeTask) {
      const result: AnalysisResult = {
        bestHarmony: payload.bestHarmony as HarmonyRule,
        bestSpread: payload.bestSpread,
        bestStrategy: payload.bestStrategy as VariantStrategy
      };
      activeTask.resolve(result);
      this.cleanup();
    }
  }

  private rejectAllTasks(error: Error) {
    for (const [taskId, task] of this.pendingTasks) {
      task.reject(error);
    }
    this.pendingTasks.clear();
  }

  private cleanup() {
    this.pendingTasks.clear();
  }

  public async analyzeSeeds(
    currentSeeds: SeedColor[],
    baseHue: number,
    avgS: number,
    avgL: number,
    activeMode: 'light' | 'dark',
    lightContrast: number,
    darkContrast: number,
    colorSpace: ColorSpace,
    outputSpace: OutputSpace,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<AnalysisResult> {
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    const taskId = ++this.currentTaskId;
    
    return new Promise((resolve, reject) => {
      // Cancel any existing task
      if (this.pendingTasks.size > 0) {
        this.rejectAllTasks(new Error('Analysis cancelled by new request'));
      }

      this.pendingTasks.set(taskId, { resolve, reject, onProgress });

      const harmonyRules = Object.values(HarmonyRule);
      const strategies = Object.values(VariantStrategy);

      this.worker!.postMessage({
        type: 'ANALYZE',
        payload: {
          currentSeeds,
          baseHue,
          avgS,
          avgL,
          activeMode,
          lightContrast,
          darkContrast,
          colorSpace,
          outputSpace,
          harmonyRules,
          strategies
        }
      });
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.cleanup();
  }

  public isAvailable(): boolean {
    return this.worker !== null;
  }
}

// Singleton instance
export const analysisWorkerManager = new AnalysisWorkerManager();
