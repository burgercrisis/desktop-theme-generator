import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { HSL, PaletteGroup } from '../types';
import { hslToHex } from '../utils/colorUtils';

interface ColorWheelProps {
  hsl: HSL;
  paletteGroups: PaletteGroup[];
  onChange: (hsl: HSL) => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ hsl, paletteGroups, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hslRef = useRef(hsl);
  const lastUpdateRef = useRef<number>(0);

  // Update ref whenever hsl prop changes
  useEffect(() => {
    hslRef.current = hsl;
  }, [hsl]);

  const wheelSize = 320;
  const center = wheelSize / 2;
  const outerRadius = 145;
  const innerRadius = 55;

  const handleInteraction = useCallback((clientX: number, clientY: number, force = false) => {
    if (!containerRef.current) return;
    
    // Throttle updates to ~60fps (16ms) unless forced
    const now = Date.now();
    if (!force && now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;

    const rect = containerRef.current.getBoundingClientRect();
    
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const dist = Math.sqrt(x * x + y * y);
    const clampedDist = Math.max(innerRadius, Math.min(outerRadius, dist));
    const ratio = (clampedDist - innerRadius) / (outerRadius - innerRadius);
    const saturation = ratio * 100;

    onChange({
      ...hslRef.current,
      h: Math.round(angle * 100) / 100,
      s: Math.round(saturation * 100) / 100
    });
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleInteraction(e.clientX, e.clientY, true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY, true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      handleInteraction(clientX, clientY);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, handleInteraction]);

  const wheelBackground = useMemo(() => {
    const stops: string[] = [];
    for (let h = 0; h <= 360; h += 8) {
      const hex = hslToHex(h, 100, hsl.l);
      stops.push(`${hex} ${h}deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  }, [hsl.l]);

  const getPosition = (h: number, s: number) => {
    const rad = (h - 90) * (Math.PI / 180);
    const normS = Math.min(1, Math.max(0, s / 100));
    const r = innerRadius + normS * (outerRadius - innerRadius);
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad)
    };
  };

  const handlePosition = useMemo(() => {
    return getPosition(hsl.h, hsl.s);
  }, [hsl.h, hsl.s]);

  const harmonyShape = useMemo(() => {
    if (paletteGroups.length < 2) return null;

    const points = paletteGroups.map(group => {
      const pos = getPosition(group.base.hsl.h, group.base.hsl.s);
      return `${pos.x},${pos.y}`;
    }).join(' ');

    return (
      <polygon 
        points={points}
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeDasharray="4 2"
      />
    );
  }, [paletteGroups]);

  const harmonyLines = useMemo(() => {
    if (paletteGroups.length < 2) return null;

    const lines: JSX.Element[] = [];
    
    for (let i = 0; i < paletteGroups.length; i++) {
      const group = paletteGroups[i];
      const pos = getPosition(group.base.hsl.h, group.base.hsl.s);
      
      lines.push(
        <line 
          key={`line-${i}`}
          x1={center} y1={center}
          x2={pos.x} y2={pos.y}
          stroke="rgba(255,255,255,0.1)"
          strokeDasharray="3 3"
        />
      );
    }
    
    return lines;
  }, [paletteGroups, center]);

  const centerColor = hslToHex(hsl.h, hsl.s, hsl.l);

  return (
    <div className="relative flex items-center justify-center p-4 select-none">
      <div 
        ref={containerRef}
        className="relative rounded-full shadow-2xl bg-gray-900 border border-gray-700 cursor-crosshair overflow-hidden"
        style={{ width: wheelSize, height: wheelSize }}
      >
        <svg width={wheelSize} height={wheelSize} className="absolute inset-0 pointer-events-none z-10">
          {harmonyLines}
          {harmonyShape}
        </svg>

        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: wheelBackground,
            maskImage: `radial-gradient(transparent ${innerRadius}px, black ${innerRadius + 1}px)`,
            WebkitMaskImage: `radial-gradient(transparent ${innerRadius}px, black ${innerRadius + 1}px)`
          }}
        />

        <svg width={wheelSize} height={wheelSize} className="absolute inset-0 pointer-events-none">
          <circle cx={center} cy={center} r={innerRadius} fill={centerColor} />
          <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>

        {paletteGroups.map((group, idx) => {
          const pos = getPosition(group.base.hsl.h, group.base.hsl.s);
          const isMain = idx === 0;
          
          if (isMain) return null;

          return (
            <div 
              key={idx}
              className="absolute w-4 h-4 rounded-full border border-white/60 shadow-md z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pos.x,
                top: pos.y,
                backgroundColor: group.base.hex
              }}
            />
          );
        })}

        <div 
          className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg z-30 cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform active:scale-95"
          style={{
            left: handlePosition.x,
            top: handlePosition.y,
            backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,255,255,0.3)'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorWheel;
