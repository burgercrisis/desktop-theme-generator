import { HSL, ColorStop, VariantStrategy, ColorSpace, OutputSpace } from '../../types';
import { createColorStop, normalizeHue, interpolateValues } from './core';

export const generateVariants = (
  baseHsl: HSL, 
  count: number, 
  contrast: number, 
  strategy: VariantStrategy,
  space: ColorSpace,
  output: OutputSpace,
  brightness: number = 50,
  prevHsl?: HSL,
  nextHsl?: HSL
): ColorStop[] => {
  const variants: ColorStop[] = [];
  const { h, s, l } = baseHsl;
  const range = contrast / 100;
  const lOffset = (brightness - 50);
  const steps = count;
  
  const isExtendedSpace = (space === 'CAM02' || space.startsWith('LCh') || space.startsWith('Ok') || space === 'IPT');
  const maxSat = isExtendedSpace ? 150 : 100;

  // --- LEFT SIDE ---
  for (let i = steps; i > 0; i--) {
    let stop: HSL = { h, s, l };
    const t = i / (steps + 1);

    if (strategy === VariantStrategy.TINTS_SHADES) {
      stop.l = l - (l * range * t * 1.5);
    } else if (strategy === VariantStrategy.TONES) {
      stop.s = s - (s * range * t); 
      stop.l = l - (10 * t * range);
    } else if (strategy === VariantStrategy.VIBRANT) {
      stop.l = l - (l * range * t);
      stop.s = s + (20 * t * range);
    } else if (strategy === VariantStrategy.BLEND && prevHsl) {
      stop = interpolateValues(baseHsl, prevHsl, t * range);
    } else if (strategy === VariantStrategy.SHADED_BLEND && prevHsl) {
      const blended = interpolateValues(baseHsl, prevHsl, t * range);
      stop.h = blended.h;
      stop.s = blended.s;
      stop.l = l - (l * range * t * 1.5);
    } else if (strategy === VariantStrategy.ATMOSPHERIC) {
      const targetH = 240;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.6 * range));
      stop.l = l - (l * range * t * 1.2);
      stop.s = s * (1 - (0.05 * t * range));
    } else if (strategy === VariantStrategy.PASTEL) {
      stop.l = Math.max(60, l - (20 * range * t));
      stop.s = Math.max(10, s - (30 * range * t));
    } else if (strategy === VariantStrategy.DEEP) {
      stop.l = Math.max(5, l - (l * range * t * 1.8));
      stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.ACID) {
      stop.h = normalizeHue(h - (t * 50 * range));
      stop.l = l - (l * range * t);
      stop.s = s + (20 * range);
    } else if (strategy === VariantStrategy.NEON) {
      stop.l = Math.max(5, l - (l * t * 2 * range));
      stop.s = maxSat;
    } else if (strategy === VariantStrategy.METALLIC) {
      stop.l = l - (l * Math.sin(t * Math.PI / 2) * range);
      stop.s = Math.max(0, s - (30 * t * range));
    } else if (strategy === VariantStrategy.IRIDESCENT) {
      stop.h = normalizeHue(h - (t * 90 * range));
      stop.s = s + (10 * range);
      stop.l = Math.max(10, l - (30 * t * range));
    } else if (strategy === VariantStrategy.CLAY) {
      const targetH = 30;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.4 * range));
      stop.s = Math.max(0, s - (40 * t * range));
      stop.l = Math.max(10, l - (l * range * t));
    } else if (strategy === VariantStrategy.GLOSSY) {
      const easedT = t * t * (3 - 2 * t);
      stop.l = Math.max(0, l - (l * range * easedT * 1.8));
      stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.X_RAY) {
      stop.l = Math.max(0, Math.min(100, (100 - l) + (t * 20 * range)));
    } else if (strategy === VariantStrategy.CRYSTALLINE) {
      const wave = Math.abs((t * 2) % 2 - 1);
      stop.l = Math.max(0, Math.min(100, l - (30 * wave * range)));
      stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.RADIOACTIVE) {
      stop.l = Math.max(0, Math.min(100, l - (40 * t * range)));
      stop.s = maxSat;
      stop.h = normalizeHue(h + (t * 10 * range));
    } else if (strategy === VariantStrategy.HYPER) {
      stop.l = Math.max(0, l - (l * range * t * 2));
      stop.s = s * (1 + (0.5 * range));
    } else if (strategy === VariantStrategy.LUMINOUS) {
      stop.l = Math.max(40, l - (20 * t * range));
      stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.VELVET) {
      stop.l = Math.max(5, l - (l * t * 1.5 * range));
      stop.s = Math.max(30, s - (10 * t * range));
    } else if (strategy === VariantStrategy.TOXIC) {
      stop.h = normalizeHue(h + (t * 45 * range)); 
      stop.s = maxSat;
      stop.l = Math.max(20, l - (30 * t * range));
    } else if (strategy === VariantStrategy.VINTAGE) {
      const targetH = 40; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3 * range));
      stop.s = Math.max(10, s - (30 * t * range));
      stop.l = Math.max(20, l - (30 * t * range));
    } else if (strategy === VariantStrategy.GLACIAL) {
      const targetH = 200; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3 * range));
      stop.l = Math.min(95, l + (10 * t * range));
    } else if (strategy === VariantStrategy.HEATWAVE) {
       const targetH = 10; 
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.2 * range));
       stop.s = s + (20 * t * range);
    } else if (strategy === VariantStrategy.CINEMATIC) {
      const targetH = 190;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.8 * range));
      stop.l = Math.max(10, l - (l * t * 1.5 * range));
    } else if (strategy === VariantStrategy.MEMPHIS) {
      stop.l = l > 50 ? Math.max(10, l - 50*t*range) : Math.min(90, l + 50*t*range);
    } else if (strategy === VariantStrategy.GLITCH) {
      const segment = Math.floor(t * 3);
      stop.h = normalizeHue(h + ((segment % 2 === 0 ? 30 : -30) * range));
      stop.l = Math.max(0, l - (l * range * t));
      stop.s = Math.min(100, s + (segment % 2 === 0 ? 20 * range : 0));
    } else if (strategy === VariantStrategy.SOLARIZED) {
      const isDark = l < 50;
      stop.l = isDark ? Math.max(10, l - (10 * t * range)) : Math.min(90, l + (10 * t * range));
      stop.s = Math.max(10, s - (10 * t * range));
    } else if (strategy === VariantStrategy.NORDIC) {
      const targetH = 210;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(5, s - (20 * t * range));
      stop.l = Math.max(20, l - (10 * t * range));
    } else if (strategy === VariantStrategy.DRACULA) {
      const targetH = 250;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(20, s + (10 * t * range));
      stop.l = Math.max(10, l - (20 * t * range));
    } else if (strategy === VariantStrategy.MONOKAI) {
      const targetH = 330;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(40, s + (15 * t * range));
      stop.l = Math.max(15, l - (15 * t * range));
    } else if (strategy === VariantStrategy.GRUVBOX) {
      const targetH = 35;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(20, s - (5 * t * range));
      stop.l = Math.max(10, l - (10 * t * range));
    } else if (strategy === VariantStrategy.WARM) {
      const targetH = 30;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = s + (10 * t * range);
      stop.l = l - (10 * t * range);
    } else if (strategy === VariantStrategy.COOL) {
      const targetH = 210;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = s - (5 * t * range);
      stop.l = l - (5 * t * range);
    } else {
        stop.l = l - (l * range * t);
    }

    variants.push(createColorStop(stop.h, stop.s, Math.max(0, Math.min(100, stop.l + lOffset)), false, space, output));
  }

  // Base
  variants.push(createColorStop(h, s, Math.max(0, Math.min(100, l + lOffset)), true, space, output));

  // --- RIGHT SIDE ---
  for (let i = 1; i <= steps; i++) {
    let stop: HSL = { h, s, l };
    const t = i / (steps + 1);

    if (strategy === VariantStrategy.TINTS_SHADES) {
      stop.l = l + ((100 - l) * range * t);
    } else if (strategy === VariantStrategy.TONES) {
      stop.s = s - (s * range * t);
      stop.l = l + ((100 - l) * range * t * 0.5);
    } else if (strategy === VariantStrategy.VIBRANT) {
      stop.l = l + ((100 - l) * range * t);
      stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.BLEND && nextHsl) {
      stop = interpolateValues(baseHsl, nextHsl, t * range);
    } else if (strategy === VariantStrategy.SHADED_BLEND && nextHsl) {
      const blended = interpolateValues(baseHsl, nextHsl, t * range);
      stop.h = blended.h;
      stop.s = blended.s;
      stop.l = l + ((100 - l) * range * t);
    } else if (strategy === VariantStrategy.ATMOSPHERIC) {
      const targetH = 60;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.6 * range));
      stop.l = l + ((100 - l) * range * t);
      stop.s = s * (1 + (0.05 * t * range));
    } else if (strategy === VariantStrategy.PASTEL) {
       stop.l = Math.min(98, l + ((100 - l) * t * range));
       stop.s = Math.max(5, s - (50 * range * t));
    } else if (strategy === VariantStrategy.DEEP) {
       stop.l = Math.min(60, l + (20 * t * range));
       stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.ACID) {
        stop.h = normalizeHue(h + (t * 50 * range));
        stop.l = l + ((100 - l) * range * t);
        stop.s = s + (20 * range);
    } else if (strategy === VariantStrategy.NEON) {
        stop.l = Math.min(95, l + ((100 - l) * t * range));
        stop.s = maxSat;
    } else if (strategy === VariantStrategy.METALLIC) {
        stop.l = Math.min(100, l + ((100 - l) * Math.sin(t * Math.PI / 2) * range * 1.2));
        stop.s = Math.max(0, s - (30 * t * range));
    } else if (strategy === VariantStrategy.IRIDESCENT) {
        stop.h = normalizeHue(h + (t * 90 * range));
        stop.s = s + (10 * range);
        stop.l = Math.min(95, l + (30 * t * range));
    } else if (strategy === VariantStrategy.CLAY) {
        const targetH = 30;
        let dH = targetH - h;
        if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
        stop.h = normalizeHue(h + dH * (t * 0.4 * range));
        stop.s = Math.max(0, s - (40 * t * range));
        stop.l = Math.min(90, l + ((100 - l) * range * t));
    } else if (strategy === VariantStrategy.GLOSSY) {
        const easedT = t * t * (3 - 2 * t);
        stop.l = Math.min(100, l + ((100 - l) * range * easedT * 1.2));
        stop.s = s + (10 * t * range);
    } else if (strategy === VariantStrategy.X_RAY) {
      stop.l = Math.max(0, Math.min(100, (100 - l) - (t * 20 * range)));
    } else if (strategy === VariantStrategy.CRYSTALLINE) {
        const wave = Math.abs((t * 2) % 2 - 1);
        stop.l = Math.min(100, l + (30 * wave * range));
        stop.s = Math.max(0, s - (10 * t * range));
    } else if (strategy === VariantStrategy.RADIOACTIVE) {
        stop.l = Math.min(100, l + (40 * t * range));
        stop.s = maxSat;
        stop.h = normalizeHue(h - (t * 10 * range));
    } else if (strategy === VariantStrategy.HYPER) {
        stop.l = Math.min(100, l + ((100 - l) * range * t * 2));
        stop.s = s * (1 + (0.5 * range));
    } else if (strategy === VariantStrategy.LUMINOUS) {
      stop.l = Math.min(98, l + ((100 - l) * t * range));
      stop.s = s + (5 * t * range);
    } else if (strategy === VariantStrategy.VELVET) {
      stop.l = Math.min(50, l + (20 * t * range));
      stop.s = Math.max(30, s - (10 * t * range));
    } else if (strategy === VariantStrategy.TOXIC) {
      stop.h = normalizeHue(h - (t * 45 * range)); 
      stop.s = maxSat;
      stop.l = Math.min(80, l + (30 * t * range));
    } else if (strategy === VariantStrategy.VINTAGE) {
      const targetH = 40; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3 * range));
      stop.l = Math.min(80, l + (20 * t * range));
    } else if (strategy === VariantStrategy.GLACIAL) {
      const targetH = 200; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3 * range));
      stop.l = Math.min(100, l + ((100 - l) * t * range));
    } else if (strategy === VariantStrategy.HEATWAVE) {
       const targetH = 10;
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.2 * range));
       stop.s = s + (20 * t * range);
    } else if (strategy === VariantStrategy.CINEMATIC) {
       const targetH = 30;
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.8 * range));
       stop.l = Math.min(95, l + ((100 - l) * t * 1.5 * range));
    } else if (strategy === VariantStrategy.MEMPHIS) {
       stop.l = l > 50 ? Math.min(90, l + 50*t*range) : Math.max(10, l - 50*t*range);
    } else if (strategy === VariantStrategy.GLITCH) {
      const segment = Math.floor(t * 3);
      stop.h = normalizeHue(h + ((segment % 2 !== 0 ? 30 : -30) * range));
      stop.l = Math.min(100, l + ((100 - l) * range * t));
      stop.s = Math.min(100, s + (segment % 2 !== 0 ? 20 * range : 0));
    } else if (strategy === VariantStrategy.SOLARIZED) {
      const isDark = l < 50;
      stop.l = isDark ? Math.min(90, l + (10 * t * range)) : Math.max(10, l - (10 * t * range));
      stop.s = Math.max(10, s - (10 * t * range));
    } else if (strategy === VariantStrategy.NORDIC) {
      const targetH = 210;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(5, s - (20 * t * range));
      stop.l = Math.min(90, l + (10 * t * range));
    } else if (strategy === VariantStrategy.DRACULA) {
      const targetH = 250;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(20, s + (10 * t * range));
      stop.l = Math.min(95, l + (15 * t * range));
    } else if (strategy === VariantStrategy.MONOKAI) {
      const targetH = 330;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(40, s + (15 * t * range));
      stop.l = Math.min(95, l + (15 * t * range));
    } else if (strategy === VariantStrategy.GRUVBOX) {
      const targetH = 35;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = Math.max(20, s - (5 * t * range));
      stop.l = Math.min(90, l + (10 * t * range));
      } else if (strategy === VariantStrategy.WARM) {
      const targetH = 30;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = s + (10 * t * range);
      stop.l = l + (10 * t * range);
    } else if (strategy === VariantStrategy.COOL) {
      const targetH = 210;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.2 * range));
      stop.s = s - (5 * t * range);
      stop.l = l + (5 * t * range);
    } else {
        stop.l = l + ((100 - l) * range * t);
    }

    variants.push(createColorStop(stop.h, stop.s, Math.max(0, Math.min(100, stop.l + lOffset)), false, space, output));
  }

  return variants;
};
