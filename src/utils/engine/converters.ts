
import { jch } from 'd3-cam02';
import { hsluv } from 'd3-hsluv';
import Color from 'colorjs.io';
import { HSL, RGB, OutputSpace } from '../../types';

export const toOutputFormat = (color: any, space: OutputSpace): string => {
    const c = color as any;
    const targetSpace: Record<OutputSpace, string> = {
        'sRGB': 'srgb',
        'sRGB Linear': 'srgb-linear',
        'P3': 'p3',
        'P3 Linear': 'p3-linear',
        'AdobeRGB': 'a98-rgb',
        'ProPhoto RGB': 'prophoto-rgb',
        'Rec.709': 'srgb', // closest match; primaries match sRGB, different gamma
        'Rec.2020': 'rec2020',
        'Rec.2100 HLG': 'rec2020', // HLG transfer not available; fallback to primaries
        'Rec.2100 PQ': 'rec2020',  // PQ transfer not available; fallback to primaries
        'ICtCp': 'rec2020',        // ICtCp not built-in; fallback to primaries
        'ACES 2065-1': 'aces2065-1',
        'ACEScc': 'acescc',
        'ACEScct': 'acescct',
        'ACEScg': 'acescg',
        'HSL': 'hsl',
        'HSV': 'hsv',
        'HWB': 'hwb',
        'XYZ D50': 'xyz-d50',
        'XYZ D65': 'xyz-d65',
        'CMY': 'cmy',
        'CMYK': 'cmyk',
        'RYB': 'srgb' // no standard color space in colorjs; fallback
    };

    const toPercentString = (vals: number[]) => vals.map(v => `${(v * 100).toFixed(1)}%`).join(', ');

    try {
        const mapped = targetSpace[space];
        if (mapped) {
            // Special-case CMY/CMYK to avoid reliance on optional profiles
            if (space === 'CMY') {
                const rgb = c.to('srgb').coords.map((cVal: number) => Math.max(0, Math.min(1, cVal)));
                const cmy = rgb.map((v: number) => 1 - v);
                return `cmy(${toPercentString(cmy)})`;
            }
            if (space === 'CMYK') {
                const rgb = c.to('srgb').coords.map((cVal: number) => Math.max(0, Math.min(1, cVal)));
                const k = 1 - Math.max(rgb[0], rgb[1], rgb[2]);
                const denom = 1 - k || 1;
                const c = (1 - rgb[0] - k) / denom;
                const m = (1 - rgb[1] - k) / denom;
                const y = (1 - rgb[2] - k) / denom;
                return `cmyk(${toPercentString([c, m, y, k])})`;
            }

            return c.to(mapped).toString();
        }
    } catch (e) {
        // fall through to sRGB hex
    }

    return c.to('srgb').toString({ format: 'hex' });
};

export const hslToHex = (h: number, s: number, l: number): string => {
    try {
        const c = new Color("hsl", [h, s, l]);
        return c.to("srgb").toString({format: "hex"});
    } catch (e) { return "#000000"; }
};

export const hslToDisplay = (h: number, s: number, l: number, output: OutputSpace): string => {
    try {
        const c = new Color("hsl", [h, s, l]);
        return toOutputFormat(c, output);
    } catch (e) { return "#000000"; }
}

export const jchToHex = (J: number, C: number, h: number): string => {
    const safeJ = Math.max(0, Math.min(100, J));
    const safeC = Math.max(0, C);
    if (safeJ <= 0.5) return "#000000";
    if (safeJ >= 99.5) return "#ffffff";
    try {
        let c = jch(safeJ, safeC, h);
        let hex = c.formatHex();
        if (hex) return hex;
        let currC = safeC;
        const step = 2.5;
        while (!hex && currC > 0) {
            currC -= step;
            c = jch(safeJ, Math.max(0, currC), h);
            hex = c.formatHex();
        }
        return hex || (safeJ > 50 ? "#ffffff" : "#000000");
    } catch(e) { return "#000000"; }
};

export const jchToDisplay = (J: number, C: number, h: number, output: OutputSpace): string => {
    const hex = jchToHex(J, C, h);
    if (output === 'sRGB') return hex;
    try {
        const c = new Color(hex);
        return toOutputFormat(c, output);
    } catch(e) { return hex; }
}

export const hsluvToHex = (h: number, s: number, l: number): string => {
    const safeS = Math.max(0, Math.min(100, s));
    const safeL = Math.max(0, Math.min(100, l));
    const safeH = h % 360;
    try {
        const c = hsluv(safeH, safeS, safeL);
        return c.formatHex();
    } catch (e) { return "#000000"; }
};

export const hsluvToDisplay = (h: number, s: number, l: number, output: OutputSpace): string => {
    const hex = hsluvToHex(h, s, l);
    if (output === 'sRGB') return hex;
    try {
        const c = new Color(hex);
        return toOutputFormat(c, output);
    } catch(e) { return hex; }
};

export const okLchToHex = (l: number, s: number, h: number): string => {
    try {
        const lOk = l / 100;
        const cOk = s / 500; 
        let c = new Color('oklch', [lOk, cOk, h]);
        if (!c.inGamut('srgb')) c = c.toGamut({ space: 'srgb' });
        return c.to('srgb').toString({format:'hex'});
    } catch (e) { return hslToHex(h, Math.min(100, s), l); }
};

export const iptToHex = (l: number, s: number, h: number): string => {
    const I = l / 100;
    const C = s / 400; 
    const rad = h * (Math.PI / 180);
    const P = C * Math.cos(rad);
    const T = C * Math.sin(rad);

    const L_ = I + 0.097569 * P + 0.205226 * T;
    const M_ = I - 0.113880 * P + 0.133217 * T;
    const S_ = I + 0.032615 * P - 0.676890 * T;

    const power = 1 / 0.43;
    const L = L_ >= 0 ? Math.pow(L_, power) : -Math.pow(-L_, power);
    const M = M_ >= 0 ? Math.pow(M_, power) : -Math.pow(-M_, power);
    const S = S_ >= 0 ? Math.pow(S_, power) : -Math.pow(-S_, power);

    const X = 1.85022 * L - 1.13832 * M + 0.23844 * S;
    const Y = 0.36682 * L + 0.64388 * M - 0.01067 * S;
    const Z = 1.08891 * S;

    const rL = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    const gL = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    const bL = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

    const toSrgb = (v: number) => {
        const val = v > 0.0031308 ? 1.055 * Math.pow(v, 1/2.4) - 0.055 : 12.92 * v;
        return Math.max(0, Math.min(255, Math.round(val * 255)));
    };

    const rHex = toSrgb(rL).toString(16).padStart(2, '0');
    const gHex = toSrgb(gL).toString(16).padStart(2, '0');
    const bHex = toSrgb(bL).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
};

export const lchToHex = (l: number, s: number, h: number, mode: 'D50'|'D65' = 'D50'): string => {
    try {
        let c;
        if (mode === 'D65') {
           const rad = h * (Math.PI / 180);
           const a = s * Math.cos(rad);
           const b = s * Math.sin(rad);
           c = new Color('lab-d65', [l, a, b]);
        } else {
           c = new Color('lch', [l, s, h]);
        }
        if (!c.inGamut('srgb')) c = c.toGamut({ space: 'srgb' });
        return c.to('srgb').toString({format:'hex'});
    } catch(e) { return hslToHex(h, Math.min(100, s), l); }
};

export const luvToHex = (l: number, s: number, h: number, mode: 'LCh'|'Luv' = 'LCh'): string => {
     try {
          let c = new Color('lchuv', [l, s, h]);
          if (!c.inGamut('srgb')) c = c.toGamut({ space: 'srgb' });
          return c.to('srgb').toString({format:'hex'});
     } catch(e) { return hslToHex(h, Math.min(100, s), l); }
}

export const hexToJch = (hex: string): { J: number, C: number, h: number } => {
    try {
        const c = jch(hex);
        return { 
            J: typeof c.J === 'number' && !isNaN(c.J) ? c.J : 0, 
            C: typeof c.C === 'number' && !isNaN(c.C) ? c.C : 0, 
            h: typeof c.h === 'number' && !isNaN(c.h) ? c.h : 0 
        };
    } catch (e) { return { J: 0, C: 0, h: 0 }; }
};

export const hexToHsluv = (hex: string): { h: number, s: number, l: number } => {
    try {
        const c = hsluv(hex);
        return {
            h: typeof c.h === 'number' && !isNaN(c.h) ? c.h : 0,
            s: typeof c.s === 'number' && !isNaN(c.s) ? c.s : 0,
            l: typeof c.l === 'number' && !isNaN(c.l) ? c.l : 0
        };
    } catch (e) { return { h: 0, s: 0, l: 0 }; }
}

export const hslToRgb = (h: number, s: number, l: number): RGB => {
  try {
      const c = new Color("hsl", [h, s, l]);
      const rgb = c.to("srgb");
      return {
          r: Math.round(rgb.coords[0] * 255),
          g: Math.round(rgb.coords[1] * 255),
          b: Math.round(rgb.coords[2] * 255)
      };
  } catch(e) { return { r:0, g:0, b:0 }; }
};

export const hexToRgb = (hex: string): RGB => {
  try {
      const c = new Color(hex).to("srgb");
       return {
          r: Math.round(c.coords[0] * 255),
          g: Math.round(c.coords[1] * 255),
          b: Math.round(c.coords[2] * 255)
      };
  } catch(e) { return {r:0,g:0,b:0}; }
};

export const hexToHsl = (hex: string): HSL => {
  try {
      const c = new Color(hex).to("hsl");
      return {
          h: c.coords[0] || 0,
          s: c.coords[1] || 0,
          l: c.coords[2] || 0
      };
  } catch(e) { return { h:0, s:0, l:0 }; }
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
    try {
        const c = new Color("srgb", [r/255, g/255, b/255]).to("hsl");
        return {
            h: c.coords[0] || 0,
            s: c.coords[1] || 0,
            l: c.coords[2] || 0
        };
    } catch(e) { return { h:0, s:0, l:0 }; }
};
