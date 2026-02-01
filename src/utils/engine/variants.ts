import { HSL, ColorStop, VariantStrategy, ColorSpace, OutputSpace } from '../../types';
import { createColorStop, normalizeHue, interpolateValues } from './core';

export const generateVariants = (
  baseHsl: HSL, 
  count: number, 
  contrast: number, 
  strategy: VariantStrategy,
  space: ColorSpace,
  output: OutputSpace,
  prevHsl?: HSL,
  nextHsl?: HSL
): ColorStop[] => {
  const variants: ColorStop[] = [];
  const { h, s, l } = baseHsl;
  const range = contrast / 100;
  const steps = count;
  
  const isExtendedSpace = (space === 'CAM02' || space.startsWith('LCh') || space.startsWith('Ok') || space === 'IPT');
  const maxSat = isExtendedSpace ? 150 : 100;

  // --- LEFT SIDE ---
  for (let i = steps; i > 0; i--) {
    let stop: HSL = { h, s, l };
    const t = i / (steps + 1);

    if (strategy === 'Tints & Shades') {
      stop.l = l - (l * range * t * 1.5);
    } else if (strategy === 'Tones') {
      stop.s = s - (s * range * t); 
      stop.l = l - (10 * t);
    } else if (strategy === 'Vibrant') {
      stop.l = l - (l * range * t);
      stop.s = s + (20 * t);
    } else if (strategy === 'Harmonic Blend' && prevHsl) {
      stop = interpolateValues(baseHsl, prevHsl, t * range);
    } else if (strategy === 'Shaded Blend' && prevHsl) {
      const blended = interpolateValues(baseHsl, prevHsl, t * range);
      stop.h = blended.h;
      stop.s = blended.s;
      stop.l = l - (l * range * t * 1.5);
    } else if (strategy === 'Atmospheric') {
      const targetH = 240;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.6));
      stop.l = l - (l * range * t * 1.2);
      stop.s = s * 0.95;
    } else if (strategy === 'Pastel') {
      stop.l = Math.max(60, l - (20 * range * t));
      stop.s = Math.max(10, s - (30 * range * t));
    } else if (strategy === 'Deep & Rich') {
      stop.l = Math.max(5, l - (l * range * t * 1.8));
      stop.s = s + (10 * t);
    } else if (strategy === 'Acid Shift') {
      stop.h = normalizeHue(h - (t * 50));
      stop.l = l - (l * range * t);
      stop.s = s + 20;
    } else if (strategy === 'Neon Glow') {
      stop.l = Math.max(5, l - (l * t * 2));
      stop.s = maxSat;
    } else if (strategy === 'Metallic') {
      stop.l = l - (l * Math.sin(t * Math.PI / 2) * range);
      stop.s = Math.max(0, s - (30 * t));
    } else if (strategy === 'Iridescent') {
      stop.h = normalizeHue(h - (t * 90 * range));
      stop.s = s + 10;
      stop.l = Math.max(10, l - (30 * t));
    } else if (strategy === 'Clay') {
      const targetH = 30;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.4 * range));
      stop.s = Math.max(0, s - (40 * t));
      stop.l = Math.max(10, l - (l * range * t));
    } else if (strategy === 'Glossy') {
      const easedT = t * t * (3 - 2 * t);
      stop.l = Math.max(0, l - (l * range * easedT * 1.8));
      stop.s = s + (10 * t);
    } else if (strategy === 'X-Ray') {
      stop.l = Math.max(0, Math.min(100, (100 - l) + (t * 20 * range)));
    } else if (strategy === 'Crystalline') {
      const wave = Math.abs((t * 2) % 2 - 1);
      stop.l = Math.max(0, Math.min(100, l - (30 * wave * range)));
      stop.s = s + (10 * t);
    } else if (strategy === 'Radioactive') {
      stop.l = Math.max(0, Math.min(100, l - (40 * t * range)));
      stop.s = maxSat;
      stop.h = normalizeHue(h + (t * 10));
    } else if (strategy === 'Hyper') {
      stop.l = Math.max(0, l - (l * range * t * 2));
      stop.s = s * 1.5;
    } else if (strategy === 'Luminous') {
      stop.l = Math.max(40, l - (20 * t * range));
      stop.s = s + (10 * t);
    } else if (strategy === 'Velvet') {
      stop.l = Math.max(5, l - (l * t * 1.5 * range));
      stop.s = Math.max(30, s - (10 * t));
    } else if (strategy === 'Toxic') {
      stop.h = normalizeHue(h + (t * 45)); 
      stop.s = maxSat;
      stop.l = Math.max(20, l - (30 * t));
    } else if (strategy === 'Vintage') {
      const targetH = 40; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3));
      stop.s = Math.max(10, s - (30 * t));
      stop.l = Math.max(20, l - (30 * t));
    } else if (strategy === 'Glacial') {
      const targetH = 200; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3));
      stop.l = Math.min(95, l + (10 * t));
    } else if (strategy === 'Heatwave') {
       const targetH = 10; 
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.2));
       stop.s = s + (20 * t);
    } else if (strategy === 'Cinematic') {
       const targetH = 190;
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.8));
       stop.l = Math.max(10, l - (l * t * 1.5 * range));
    } else if (strategy === 'Memphis') {
       stop.l = l > 50 ? Math.max(10, l - 50*t) : Math.min(90, l + 50*t);
    } else if (strategy === 'Glitch') {
       const segment = Math.floor(t * 3);
       stop.h = normalizeHue(h + ((segment % 2 === 0 ? 30 : -30) * range));
       stop.l = Math.max(0, l - (l * range * t));
       stop.s = Math.min(100, s + (segment % 2 === 0 ? 20 : 0));
    } else {
        stop.l = l - (l * range * t);
    }
    variants.push(createColorStop(stop.h, stop.s, stop.l, false, space, output));
  }

  // Base
  variants.push(createColorStop(h, s, l, true, space, output));

  // --- RIGHT SIDE ---
  for (let i = 1; i <= steps; i++) {
    let stop: HSL = { h, s, l };
    const t = i / (steps + 1);

    if (strategy === 'Tints & Shades') {
      stop.l = l + ((100 - l) * range * t);
    } else if (strategy === 'Tones') {
      stop.s = s - (s * range * t);
      stop.l = l + ((100 - l) * range * t * 0.5);
    } else if (strategy === 'Vibrant') {
      stop.l = l + ((100 - l) * range * t);
      stop.s = s + (10 * t);
    } else if (strategy === 'Harmonic Blend' && nextHsl) {
      stop = interpolateValues(baseHsl, nextHsl, t * range);
    } else if (strategy === 'Shaded Blend' && nextHsl) {
      const blended = interpolateValues(baseHsl, nextHsl, t * range);
      stop.h = blended.h;
      stop.s = blended.s;
      stop.l = l + ((100 - l) * range * t);
    } else if (strategy === 'Atmospheric') {
      const targetH = 60;
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.6));
      stop.l = l + ((100 - l) * range * t);
      stop.s = s * 1.05;
    } else if (strategy === 'Pastel') {
       stop.l = Math.min(98, l + ((100 - l) * t));
       stop.s = Math.max(5, s - (50 * range * t));
    } else if (strategy === 'Deep & Rich') {
       stop.l = Math.min(60, l + (20 * t));
       stop.s = s + (10 * t);
    } else if (strategy === 'Acid Shift') {
        stop.h = normalizeHue(h + (t * 50));
        stop.l = l + ((100 - l) * range * t);
        stop.s = s + 20;
    } else if (strategy === 'Neon Glow') {
        stop.l = Math.min(95, l + ((100 - l) * t));
        stop.s = maxSat;
    } else if (strategy === 'Metallic') {
        stop.l = Math.min(100, l + ((100 - l) * Math.sin(t * Math.PI / 2) * range * 1.2));
        stop.s = Math.max(0, s - (30 * t));
    } else if (strategy === 'Iridescent') {
        stop.h = normalizeHue(h + (t * 90 * range));
        stop.s = s + 10;
        stop.l = Math.min(95, l + (30 * t));
    } else if (strategy === 'Clay') {
        const targetH = 30;
        let dH = targetH - h;
        if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
        stop.h = normalizeHue(h + dH * (t * 0.4 * range));
        stop.s = Math.max(0, s - (40 * t));
        stop.l = Math.min(90, l + ((100 - l) * range * t));
    } else if (strategy === 'Glossy') {
        const easedT = t * t * (3 - 2 * t);
        stop.l = Math.min(100, l + ((100 - l) * range * easedT * 1.2));
        stop.s = s + (10 * t);
    } else if (strategy === 'X-Ray') {
      stop.l = Math.max(0, Math.min(100, (100 - l) - (t * 20 * range)));
    } else if (strategy === 'Crystalline') {
        const wave = Math.abs((t * 2) % 2 - 1);
        stop.l = Math.min(100, l + (30 * wave * range));
        stop.s = Math.max(0, s - (10 * t));
    } else if (strategy === 'Radioactive') {
        stop.l = Math.min(100, l + (40 * t * range));
        stop.s = maxSat;
        stop.h = normalizeHue(h - (t * 10));
    } else if (strategy === 'Hyper') {
        stop.l = Math.min(100, l + ((100 - l) * range * t * 2));
        stop.s = s * 1.5;
    } else if (strategy === 'Luminous') {
      stop.l = Math.min(98, l + ((100 - l) * t * range));
      stop.s = s + (5 * t);
    } else if (strategy === 'Velvet') {
      stop.l = Math.min(50, l + (20 * t * range));
      stop.s = Math.max(30, s - (10 * t));
    } else if (strategy === 'Toxic') {
      stop.h = normalizeHue(h - (t * 45)); 
      stop.s = maxSat;
      stop.l = Math.min(80, l + (30 * t));
    } else if (strategy === 'Vintage') {
      const targetH = 40; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3));
      stop.l = Math.min(80, l + (20 * t));
    } else if (strategy === 'Glacial') {
      const targetH = 200; 
      let dH = targetH - h;
      if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
      stop.h = normalizeHue(h + dH * (t * 0.3));
      stop.l = Math.min(100, l + ((100 - l) * t));
    } else if (strategy === 'Heatwave') {
       const targetH = 10;
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.2));
       stop.s = s + (20 * t);
    } else if (strategy === 'Cinematic') {
       const targetH = 30;
       let dH = targetH - h;
       if (dH > 180) dH -= 360; else if (dH < -180) dH += 360;
       stop.h = normalizeHue(h + dH * (t * 0.8));
       stop.l = Math.min(95, l + ((100 - l) * t * 1.5));
    } else if (strategy === 'Memphis') {
       stop.l = l > 50 ? Math.min(90, l + 50*t) : Math.max(10, l - 50*t);
    } else if (strategy === 'Glitch') {
       const segment = Math.floor(t * 3);
       stop.h = normalizeHue(h + ((segment % 2 !== 0 ? 30 : -30) * range));
       stop.l = Math.min(100, l + ((100 - l) * range * t));
       stop.s = Math.min(100, s + (segment % 2 !== 0 ? 20 : 0));
    } else {
        stop.l = l + ((100 - l) * range * t);
    }
    variants.push(createColorStop(stop.h, stop.s, stop.l, false, space, output));
  }

  return variants;
};
