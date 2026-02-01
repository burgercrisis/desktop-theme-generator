
import Color from 'colorjs.io';
import { ColorStop, ColorSpace, OutputSpace, HSL } from '../../types';
import { 
    jchToHex, jchToDisplay, hexToHsl, 
    hsluvToHex, hsluvToDisplay, lchToHex, 
    okLchToHex, iptToHex, luvToHex, 
    hslToHex, hslToDisplay 
} from './converters';

export const normalizeHue = (h: number) => (h % 360 + 360) % 360;

export const createColorStop = (h: number, s: number, l: number, isBase: boolean = false, space: ColorSpace = 'HSL', output: OutputSpace = 'sRGB'): ColorStop => {
  const nh = normalizeHue(h);
  const ns = Math.max(0, s); 
  const nl = Math.max(0, Math.min(100, l));
  
  let hex: string;
  let displayString: string;
  let finalHsl: HSL;
  let cam02Data: { j: number, c: number, h: number } | undefined;
  let hsluvData: { h: number, s: number, l: number } | undefined;
  let coordsData: { l: number, c: number, h: number, a?: number, b?: number } | undefined;

  if (space === 'CAM02') {
      hex = jchToHex(nl, ns, nh); 
      displayString = jchToDisplay(nl, ns, nh, output);
      finalHsl = hexToHsl(hex); 
      cam02Data = { j: nl, c: ns, h: nh };
  } else if (space === 'HSLuv') {
      const clampedS = Math.min(100, ns);
      hex = hsluvToHex(nh, clampedS, nl);
      displayString = hsluvToDisplay(nh, clampedS, nl, output);
      finalHsl = hexToHsl(hex);
      hsluvData = { h: nh, s: clampedS, l: nl };
  } else if (space === 'LCh D50') {
      hex = lchToHex(nl, ns, nh, 'D50');
      finalHsl = hexToHsl(hex);
      displayString = hex; 
      if(output !== 'sRGB') {
           try { displayString = new Color('lch', [nl, ns, nh]).toString(); } catch(e) {}
      }
      coordsData = { l: nl, c: ns, h: nh };
  } else if (space === 'LCh D65') {
      hex = lchToHex(nl, ns, nh, 'D65');
      finalHsl = hexToHsl(hex);
      displayString = hex;
       if(output !== 'sRGB') {
           const rad = nh * (Math.PI / 180);
           try { displayString = new Color('lab-d65', [nl, ns*Math.cos(rad), ns*Math.sin(rad)]).toString(); } catch(e) {}
      }
      coordsData = { l: nl, c: ns, h: nh };
  } else if (space === 'OkLCh') {
      hex = okLchToHex(nl, ns, nh);
      finalHsl = hexToHsl(hex);
      displayString = hex;
      if(output !== 'sRGB') {
           try { displayString = new Color('oklch', [nl/100, ns/500, nh]).toString(); } catch(e) {}
      }
      coordsData = { l: nl, c: ns, h: nh };
  } else if (space === 'IPT') {
      hex = iptToHex(nl, ns, nh);
      finalHsl = hexToHsl(hex);
      
      const I = nl / 100;
      const C = ns / 400; 
      const rad = nh * (Math.PI / 180);
      const P = C * Math.cos(rad);
      const T = C * Math.sin(rad);
      
      displayString = hex;
      if(output !== 'sRGB') {
           try { displayString = new Color('ipt', [I, P, T]).toString(); } catch(e) {}
      }
      coordsData = { l: nl, c: ns, h: nh, a: P, b: T };
  } else if (space === 'LCh(uv)') {
      hex = luvToHex(nl, ns, nh, 'LCh');
      finalHsl = hexToHsl(hex);
      displayString = hex;
       if(output !== 'sRGB') {
           try { displayString = new Color('lchuv', [nl, ns, nh]).toString(); } catch(e) {}
      }
      coordsData = { l: nl, c: ns, h: nh };
  } else {
      const clampedS = Math.min(100, ns);
      hex = hslToHex(nh, clampedS, nl);
      displayString = hslToDisplay(nh, clampedS, nl, output);
      finalHsl = { h: nh, s: clampedS, l: nl };
  }

  return {
    hsl: finalHsl,
    hex: hex,
    displayString: displayString,
    isBase,
    cam02: cam02Data,
    hsluv: hsluvData,
    coords: coordsData
  };
};

export const interpolateValues = (start: HSL, end: HSL, t: number): HSL => {
  let dH = end.h - start.h;
  if (dH > 180) dH -= 360;
  else if (dH < -180) dH += 360;
  
  return {
    h: start.h + dH * t,
    s: start.s + (end.s - start.s) * t,
    l: start.l + (end.l - start.l) * t
  };
};
