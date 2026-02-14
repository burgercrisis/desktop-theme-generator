import { HSL } from '../types';

export interface ContrastControlState {
  enabled: boolean;
  intensity: number; // 0-100, where 100 = maximum dynamic range
  mode: 'unified' | 'separate'; // unified controls both, separate controls each independently
  lightContrast: number; // 0-100, calculated base contrast
  darkContrast: number; // 0-100, calculated base contrast
}

export interface ContrastControlSettings {
  minContrast: number;
  maxContrast: number;
  contrastMultiplier: number;
  invertOnExtreme: boolean;
}

/**
 * Maximum Dynamic Contrast Control System
 * 
 * At 100% intensity: Full dynamic range from black to white
 * - Light mode: Black (0) to White (100) 
 * - Dark mode: White (100) to Black (0)
 * 
 * At 0% intensity: Single color (no contrast)
 * 
 * Intermediate values provide proportional contrast range
 */
export class ContrastControl {
  private settings: ContrastControlSettings = {
    minContrast: 0,
    maxContrast: 100,
    contrastMultiplier: 1.0,
    invertOnExtreme: true
  };

  /**
   * Calculate dynamic contrast values based on intensity
   * This provides the maximum control you described
   */
  public calculateContrast(
    intensity: number,
    baseLightness: number,
    isDarkMode: boolean
  ): { lightContrast: number; darkContrast: number } {
    const clampedIntensity = Math.max(0, Math.min(100, intensity));
    
    if (clampedIntensity === 0) {
      // No contrast - single color at base lightness
      const singleColor = isDarkMode ? 20 : 80; // Dark mode: dark gray, Light mode: light gray
      return {
        lightContrast: singleColor,
        darkContrast: singleColor
      };
    }

    if (clampedIntensity === 100) {
      // Maximum dynamic range - full black to white
      if (isDarkMode) {
        // Dark mode: White (100) to Black (0)
        return {
          lightContrast: 100,
          darkContrast: 0
        };
      } else {
        // Light mode: Black (0) to White (100)
        return {
          lightContrast: 0,
          darkContrast: 100
        };
      }
    }

    // Intermediate values - proportional contrast
    const range = this.settings.maxContrast - this.settings.minContrast;
    const adjustedRange = range * (clampedIntensity / 100) * this.settings.contrastMultiplier;
    
    const centerPoint = (this.settings.maxContrast + this.settings.minContrast) / 2;
    
    let lightContrast, darkContrast;
    
    if (isDarkMode) {
      // Dark mode: Higher values = darker colors
      lightContrast = centerPoint - (adjustedRange / 2);
      darkContrast = centerPoint + (adjustedRange / 2);
      
      // Apply inversion at extreme if enabled
      if (this.settings.invertOnExtreme && clampedIntensity > 90) {
        // Near maximum, invert for dramatic effect
        [lightContrast, darkContrast] = [darkContrast, lightContrast];
      }
    } else {
      // Light mode: Higher values = lighter colors  
      lightContrast = centerPoint + (adjustedRange / 2);
      darkContrast = centerPoint - (adjustedRange / 2);
      
      // Apply inversion at extreme if enabled
      if (this.settings.invertOnExtreme && clampedIntensity > 90) {
        // Near maximum, invert for dramatic effect
        [lightContrast, darkContrast] = [darkContrast, lightContrast];
      }
    }

    // Ensure values stay within bounds
    lightContrast = Math.max(this.settings.minContrast, Math.min(this.settings.maxContrast, lightContrast));
    darkContrast = Math.max(this.settings.minContrast, Math.min(this.settings.maxContrast, darkContrast));

    return { lightContrast, darkContrast };
  }

  /**
   * Calculate individual variant lightness based on contrast control
   * This replaces the simple linear scaling with dynamic control
   */
  public calculateVariantLightness(
    baseLightness: number,
    variantIndex: number,
    totalVariants: number,
    contrast: number,
    intensity: number,
    isDarkMode: boolean
  ): number {
    if (intensity === 0) {
      return baseLightness; // No contrast variation
    }

    const { lightContrast, darkContrast } = this.calculateContrast(intensity, baseLightness, isDarkMode);
    const currentContrast = isDarkMode ? darkContrast : lightContrast;
    
    // Map variant index to position in contrast range
    // 0 = darkest/lightest, totalVariants-1 = lightest/darkest
    const position = variantIndex / (totalVariants - 1);
    
    // Calculate the dynamic range
    const range = Math.abs(lightContrast - darkContrast);
    const center = isDarkMode ? 
      Math.min(lightContrast, darkContrast) : 
      Math.max(lightContrast, darkContrast);
    
    // Apply position-based scaling
    let targetLightness: number;
    
    if (isDarkMode) {
      // Dark mode: Higher position = lighter
      targetLightness = center + (range * position);
    } else {
      // Light mode: Higher position = darker  
      targetLightness = center - (range * position);
    }
    
    // Apply contrast multiplier
    const adjustedLightness = baseLightness + (targetLightness - 50) * (currentContrast / 50);
    
    // Ensure within valid bounds
    return Math.max(0, Math.min(100, adjustedLightness));
  }

  /**
   * Get description of current contrast state
   */
  public getContrastDescription(intensity: number, isDarkMode: boolean): string {
    if (intensity === 0) return 'No Contrast (Single Color)';
    if (intensity === 100) return 'Maximum Dynamic Range';
    if (intensity > 80) return 'Extreme Dynamic Contrast';
    if (intensity > 60) return 'High Dynamic Contrast';
    if (intensity > 40) return 'Medium Dynamic Contrast';
    if (intensity > 20) return 'Low Dynamic Contrast';
    return 'Minimal Dynamic Contrast';
  }

  /**
   * Configure contrast control settings
   */
  public configure(settings: Partial<ContrastControlSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  public getSettings(): ContrastControlSettings {
    return { ...this.settings };
  }
}

// Singleton instance
export const contrastControl = new ContrastControl();
