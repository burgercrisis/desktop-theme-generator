# opendesktopgui - Desktop Theme Generator

A full-featured webapp for generating desktop themes using the color wheel with complete harmony and variant systems. Built by cannibalizing components from [ChromaHarmony](https://github.com/anomalyco/chromaharmony).

## Features

### Interactive Color Wheel
- Click and drag to select base colors
- Visual harmony shape overlay showing color relationships
- Connected lines to base color from wheel center

### Harmony Rules (22 types)
- **Basic**: Monochromatic, Analogous, Complementary, Split Complementary, Triadic, Tetradic, Square
- **Advanced**: Accented Analogous, Double Split Complementary, Compound, Six Tone, Golden Ratio
- **Creative**: Natural, Vivid & Pastel, Pentagram, Hard Clash, Double Analogous, Full Spectrum, Clash Complementary, Synthwave, Analogous Clash
- **Simple**: Shades

### Variant Strategies (27 types)
- **Classic**: Tints & Shades, Tones, Harmonic Blend, Vibrant, Shaded Blend
- **Specialty**: Atmospheric, Pastel, Deep & Rich, Acid Shift, Neon Glow, Metallic, Iridescent
- **Modern**: Clay, Glossy, X-Ray, Crystalline, Radioactive, Hyper, Luminous, Velvet
- **Creative**: Toxic, Vintage, Glacial, Heatwave, Cinematic, Memphis, Glitch

### Controls
- **Spread / Angle**: Adjust harmony spacing (0-180°)
- **Variants**: Number of color variants per harmony color (1-5, produces 3-11 colors)
- **Contrast / Range**: Intensity of variant generation (10-100%)

### Randomizers
- **Randomize All**: Randomize all parameters
- **Invert Base**: Flip hue 180° and invert lightness
- **Chaos Mode**: Completely random configuration
- **Thematic Presets**:
  - Cyberpunk, Cinematic, Pastel, Retro, Vivid, Earthy, Pop Art, Midnight, Psychedelic, Warm, Cool, Subtle

### Export Options
- CSS Variables
- JSON (Design tokens)
- Tailwind Config
- SCSS Variables

### Additional Features
- Real-time preview with sample UI components
- Copy any color to clipboard
- Shape visualization on color wheel
- Connected lines for harmony groups

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) 9+

### Installation

```bash
cd desktop-theme-generator
pnpm install
```

### Development

```bash
pnpm dev
```

This will start the development server at http://localhost:3000

### Build

```bash
pnpm build
```

The built files will be in the `dist` folder.

## Project Structure

```
desktop-theme-generator/
├── src/
│   ├── components/
│   │   ├── ColorWheel.tsx      # Interactive color wheel with shape visualization
│   │   ├── PaletteDisplay.tsx  # Color palette with variants
│   │   └── ThemePreview.tsx    # Live theme preview
│   ├── utils/
│   │   ├── colorUtils.ts       # Color conversion (HSL/HEX/RGB, interpolation)
│   │   ├── harmonies.ts        # 22 harmony rules + 27 variant strategies
│   │   └── exportUtils.ts      # Export to CSS, JSON, Tailwind, SCSS
│   ├── App.tsx                 # Main application with all controls
│   ├── App.css                 # Styles
│   ├── main.tsx                # Entry point
│   └── types.ts                # TypeScript definitions
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── pnpm-workspace.yaml
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS
- pnpm 9+

## Credits

Built using color wheel, color manipulation, harmony rules, and variant generation logic from [ChromaHarmony](https://github.com/anomalyco/chromaharmony).

## License

MIT
