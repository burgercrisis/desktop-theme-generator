import React from 'react';
import { contrastControl, ContrastControlState } from '../utils/contrastControl';

interface ContrastControlProps {
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  isDarkMode: boolean;
}

const ContrastControlComponent: React.FC<ContrastControlProps> = ({ 
  intensity, 
  onIntensityChange, 
  isDarkMode 
}) => {
  const description = contrastControl.getContrastDescription(intensity, isDarkMode);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dynamic Contrast Control
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(e) => onIntensityChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0% (Single Color)</span>
            <span>100% (Full Dynamic Range)</span>
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {intensity}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </div>
        </div>

        {intensity === 100 && (
          <div className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
            ⚠️ Maximum Dynamic Range Active
            {isDarkMode ? 
              " (White → Black)" : 
              " (Black → White)"
            }
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="font-mono">
            MODE: {isDarkMode ? 'DARK' : 'LIGHT'}
          </div>
          <div className="font-mono">
            RANGE: {intensity === 0 ? '0%' : `${100 - intensity}%`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContrastControlComponent;
