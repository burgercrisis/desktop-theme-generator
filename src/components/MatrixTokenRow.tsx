import React from 'react';

interface MatrixTokenRowProps {
  property: string;
  currentColor: string;
  activeMode: 'light' | 'dark';
  isOverridden: boolean;
  handleManualReset: (key: string) => void;
  handleManualOverride: (key: string, hex: string) => void;
  setQuickPicker: (picker: any) => void;
  formatAgentLabel: (str: string) => string;
  activeVariantsMap: Record<string, any>;
  themeColors: Record<string, string>;
}

export const MatrixTokenRow = React.memo(({
  property,
  currentColor,
  activeMode,
  isOverridden,
  handleManualReset,
  handleManualOverride,
  setQuickPicker,
  formatAgentLabel,
  activeVariantsMap,
}: MatrixTokenRowProps) => {
  return (
    <div className={`group flex items-center justify-between gap-4 p-2 rounded-md transition-colors ${activeMode === 'light' ? 'hover:bg-gray-50 border-b border-gray-100' : 'hover:bg-white/5 border-b border-white/5'}`}>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono transition-colors truncate ${activeMode === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {formatAgentLabel(property)}
          </span>
          {isOverridden && (
            <button 
              onClick={() => handleManualReset(property)}
              className="text-[8px] px-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors uppercase font-bold tracking-tighter"
              title="RESET_OVERRIDE"
            >
              Custom
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div 
            className={`w-3 h-3 rounded-[2px] border shrink-0 cursor-pointer hover:scale-110 transition-transform ${activeMode === 'light' ? 'border-gray-200' : 'border-white/10'}`}
            style={{ backgroundColor: currentColor }}
            onClick={(e) => setQuickPicker({ x: e.clientX, y: e.clientY, key: property, label: property })}
            title="QUICK_PICKER"
          />
          <span className={`text-[8px] font-mono transition-colors uppercase ${activeMode === 'light' ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-600 group-hover:text-gray-500'}`}>{currentColor}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 max-w-none justify-end overflow-x-auto custom-scrollbar">
        {Object.entries(activeVariantsMap).map(([seedName, variants]: [string, any]) => (
          <div key={`${property}-${seedName}`} className={`flex gap-0.5 p-0.5 rounded border ${activeMode === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-purple-500/5 border-purple-500/10'}`}>
            {variants.map((variant: any, idx: number) => {
              const isSelected = currentColor?.toLowerCase() === variant.hex.toLowerCase()

              return (
                <button
                  key={`${property}-${seedName}-${idx}`}
                  onClick={() => handleManualOverride(property, variant.hex)}
                  className={`w-1.5 h-2.5 rounded-[0.5px] transition-all relative flex items-center justify-center ${
                    isSelected 
                      ? `ring-1 ring-purple-400 ring-offset-1 ${activeMode === 'light' ? 'ring-offset-white' : 'ring-offset-[#0d0d17]'} z-10 scale-110` 
                      : "hover:scale-110 opacity-40 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: variant.hex }}
                  title={`${seedName}_V${idx}: ${variant.hex}`}
                >
                  {isSelected && (
                    <div 
                      className="w-0.5 h-0.5 rounded-full bg-white/60" 
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  );
});
