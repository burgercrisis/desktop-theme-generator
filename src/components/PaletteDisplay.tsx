import React from 'react';
import { ColorStop } from '../types';

interface PaletteDisplayProps {
  colors: ColorStop[];
  label: string;
  onCopy?: (hex: string) => void;
}

const PaletteDisplay: React.FC<PaletteDisplayProps> = ({ colors, label, onCopy }) => {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">{label}</h3>
      <div className="flex gap-1">
        {colors.map((color, idx) => (
          <div 
            key={idx} 
            className="group relative cursor-pointer"
            onClick={() => onCopy?.(color.hex)}
            title={color.name}
          >
            <div 
              className="w-10 h-10 rounded-lg shadow-md transition-transform hover:scale-110 hover:shadow-lg"
              style={{ backgroundColor: color.hex }}
            />
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <span className="text-[10px] text-gray-300 font-mono bg-gray-900 px-1.5 py-0.5 rounded whitespace-nowrap border border-gray-700">{color.hex}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaletteDisplay;
