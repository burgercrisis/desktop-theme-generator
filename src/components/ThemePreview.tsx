import React from 'react';

interface ThemePreviewProps {
  theme: {
    background: string;
    backgroundWeak: string;
    backgroundStrong: string;
    backgroundStronger: string;
    surfaceBase: string;
    surfaceBaseHover: string;
    surfaceBaseActive: string;
    surfaceRaised: string;
    surfaceRaisedHover: string;
    surfaceRaisedActive: string;
    surfaceRaisedStrong: string;
    surfaceWeak: string;
    surfaceWeaker: string;
    surfaceStrong: string;
    foreground: string;
    foregroundWeak: string;
    foregroundWeaker: string;
    foregroundStrong: string;
    textOnBrand: string;
    borderBase: string;
    borderWeak: string;
    borderStrong: string;
    borderSelected: string;
    iconBase: string;
    iconWeak: string;
    iconStrong: string;
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryText: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    secondaryText: string;
    accent: string;
    accentHover: string;
    accentActive: string;
    accentText: string;
    success: string;
    successHover: string;
    successActive: string;
    successText: string;
    warning: string;
    warningHover: string;
    warningActive: string;
    warningText: string;
    critical: string;
    criticalHover: string;
    criticalActive: string;
    criticalText: string;
    info: string;
    infoHover: string;
    infoActive: string;
    infoText: string;
    muted: string;
    border: string;
    codeBackground: string;
    codeForeground: string;
    diffAddBackground: string;
    diffAddForeground: string;
    diffRemoveBackground: string;
    diffRemoveForeground: string;
    diffChangeBackground: string;
    diffChangeForeground: string;
    tabActive: string;
    tabInactive: string;
    tabHover: string;
    lineIndicator: string;
    lineIndicatorActive: string;
    avatarBackground: string;
    avatarForeground: string;
    scrollbarThumb: string;
    scrollbarTrack: string;
    overlay: string;
    focusRing: string;
    shadow: string;
  };
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme: rawTheme }) => {
  // Normalize theme to handle both camelCase and kebab-case (Opencode) tokens
  const theme = React.useMemo(() => {
    const t = rawTheme as any;
    const get = (camel: string, kebab: string, fallback = '#808080') => {
      return t[camel] || t[kebab] || fallback;
    };

    return {
      background: get('background', 'background-base'),
      backgroundWeak: get('backgroundWeak', 'background-weak'),
      backgroundStrong: get('backgroundStrong', 'background-strong'),
      backgroundStronger: get('backgroundStronger', 'background-stronger'),
      surfaceBase: get('surfaceBase', 'surface-base'),
      surfaceBaseHover: get('surfaceBaseHover', 'surface-base-hover'),
      surfaceBaseActive: get('surfaceBaseActive', 'surface-base-active'),
      surfaceRaised: get('surfaceRaised', 'surface-raised-base'),
      surfaceRaisedHover: get('surfaceRaisedHover', 'surface-raised-base-hover'),
      surfaceRaisedActive: get('surfaceRaisedActive', 'surface-raised-base-active'),
      surfaceRaisedStrong: get('surfaceRaisedStrong', 'surface-raised-strong'),
      surfaceWeak: get('surfaceWeak', 'surface-weak'),
      surfaceWeaker: get('surfaceWeaker', 'surface-weaker'),
      surfaceStrong: get('surfaceStrong', 'surface-strong'),
      foreground: get('foreground', 'text-base'),
      foregroundWeak: get('foregroundWeak', 'text-weak'),
      foregroundWeaker: get('foregroundWeaker', 'text-weaker'),
      foregroundStrong: get('foregroundStrong', 'text-strong'),
      textOnBrand: get('textOnBrand', 'text-on-brand-base'),
      borderBase: get('borderBase', 'border-base'),
      borderWeak: get('borderWeak', 'border-weak'),
      borderStrong: get('borderStrong', 'border-strong'),
      borderSelected: get('borderSelected', 'border-selected'),
      iconBase: get('iconBase', 'icon-base'),
      iconWeak: get('iconWeak', 'icon-weak'),
      iconStrong: get('iconStrong', 'icon-strong'),
      primary: get('primary', 'primary-base'),
      primaryHover: get('primaryHover', 'primary-hover'),
      primaryActive: get('primaryActive', 'primary-active'),
      primaryText: get('primaryText', 'primary-text'),
      secondary: get('secondary', 'secondary-base'),
      secondaryHover: get('secondaryHover', 'secondary-hover'),
      secondaryActive: get('secondaryActive', 'secondary-active'),
      secondaryText: get('secondaryText', 'secondary-text'),
      accent: get('accent', 'accent-base'),
      accentHover: get('accentHover', 'accent-hover'),
      accentActive: get('accentActive', 'accent-active'),
      accentText: get('accentText', 'accent-text'),
      success: get('success', 'success-base'),
      successHover: get('successHover', 'success-hover'),
      successActive: get('successActive', 'success-active'),
      successText: get('successText', 'success-text'),
      warning: get('warning', 'warning-base'),
      warningHover: get('warningHover', 'warning-hover'),
      warningActive: get('warningActive', 'warning-active'),
      warningText: get('warningText', 'warning-text'),
      critical: get('critical', 'critical-base'),
      criticalHover: get('criticalHover', 'critical-hover'),
      criticalActive: get('criticalActive', 'critical-active'),
      criticalText: get('criticalText', 'critical-text'),
      info: get('info', 'info-base'),
      infoHover: get('infoHover', 'info-hover'),
      infoActive: get('infoActive', 'info-active'),
      infoText: get('infoText', 'info-text'),
      muted: get('muted', 'text-weaker'),
      border: get('border', 'border-base'),
      codeBackground: get('codeBackground', 'code-background'),
      codeForeground: get('codeForeground', 'code-foreground'),
      diffAddBackground: get('diffAddBackground', 'diff-add-base'),
      diffAddForeground: get('diffAddForeground', 'diff-add-foreground'),
      diffRemoveBackground: get('diffRemoveBackground', 'diff-delete-base'),
      diffRemoveForeground: get('diffRemoveForeground', 'diff-delete-foreground'),
      diffChangeBackground: get('diffChangeBackground', 'surface-base'),
      diffChangeForeground: get('diffChangeForeground', 'text-base'),
      tabActive: get('tabActive', 'tab-active'),
      tabInactive: get('tabInactive', 'tab-inactive'),
      tabHover: get('tabHover', 'tab-hover'),
      lineIndicator: get('lineIndicator', 'line-indicator'),
      lineIndicatorActive: get('lineIndicatorActive', 'line-indicator-active'),
      avatarBackground: get('avatarBackground', 'avatar-background'),
      avatarForeground: get('avatarForeground', 'avatar-foreground'),
      scrollbarThumb: get('scrollbarThumb', 'scrollbar-thumb'),
      scrollbarTrack: get('scrollbarTrack', 'scrollbar-track'),
      overlay: get('overlay', 'overlay'),
      focusRing: get('focusRing', 'focus-ring'),
      shadow: get('shadow', 'shadow'),
    };
  }, [rawTheme]);
  const diffContent = `--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,10 +1,15 @@
 import React from 'react';
+import { Spinner } from '../Spinner';
 
 interface ButtonProps {
   children: React.ReactNode;
   variant?: 'primary' | 'secondary';
   size?: 'small' | 'medium' | 'large';
+  loading?: boolean;
+  disabled?: boolean;
   onClick?: () => void;
 }

 export const Button: React.FC<ButtonProps> = ({
@@ -12,10 +17,15 @@
   variant = 'primary',
   size = 'medium',
   children,
+  loading = false,
+  disabled = false,
   onClick,
 }) => {
   return (
-    <button className="button" onClick={onClick}>
+    <button
+      className={\`button button-\${variant} button-\${size}\`}
+      disabled={disabled || loading}
+      onClick={onClick}
+    >
+      {loading && <Spinner className="button-spinner" />}
       {children}
     </button>
   );
`;

  const parseDiffLines = (diff: string) => {
    const lines = diff.split('\n');
    const result: { type: 'added' | 'removed' | 'unchanged' | 'header' | 'hunk'; content: string; lineNum?: number }[] = [];
    
    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++')) {
        result.push({ type: 'header', content: line });
      } else if (line.startsWith('@@')) {
        result.push({ type: 'hunk', content: line });
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        result.push({ type: 'added', content: line.slice(1) });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        result.push({ type: 'removed', content: line.slice(1) });
      } else {
        result.push({ type: 'unchanged', content: line });
      }
    }
    return result;
  };

  const diffLines = parseDiffLines(diffContent);

  const terminalHistory = [
    { type: 'command' as const, content: '$ npm install react react-dom' },
    { type: 'output' as const, content: 'added 127 packages in 3s' },
    { type: 'command' as const, content: '$ npm run dev' },
    { type: 'output' as const, content: '> vite v5.0.0 dev server running at:' },
    { type: 'output' as const, content: '> Local: http://localhost:5173/' },
    { type: 'output' as const, content: '> Network: use --host to expose' },
  ];

  const sessionItems = [
    { icon: '📁', name: 'src/components', type: 'folder' as const, expanded: true },
    { icon: '📄', name: 'Button.tsx', type: 'file' as const, active: true },
    { icon: '📄', name: 'Button.css', type: 'file' as const },
    { icon: '📄', name: 'index.ts', type: 'file' as const },
    { icon: '📁', name: 'src/utils', type: 'folder' as const },
    { icon: '📄', name: 'format.ts', type: 'file' as const },
    { icon: '📄', name: 'package.json', type: 'file' as const },
    { icon: '📄', name: 'tsconfig.json', type: 'file' as const },
    { icon: '📄', name: 'vite.config.ts', type: 'file' as const },
  ];

  const sidebarItems = [
    { icon: '💬', label: 'Chat', active: true },
    { icon: '📂', label: 'Context' },
    { icon: '📝', label: 'Files' },
    { icon: '🔧', label: 'Terminal' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div 
      className="w-full h-full rounded-lg overflow-hidden relative flex flex-col"
      style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        lineHeight: 1.5,
        color: theme.foreground,
        backgroundColor: theme.background,
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .diff-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .diff-scrollbar::-webkit-scrollbar-track {
          background: ${theme.background};
        }
        .diff-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme.scrollbarThumb};
          border-radius: 4px;
        }
      `}</style>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex flex-col items-center py-2 border-r" style={{ width: '40px', backgroundColor: theme.surfaceRaised, borderColor: theme.borderWeak }}>
          {sidebarItems.map((item, idx) => (
            <button 
              key={idx}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors mb-1"
              style={{ 
                backgroundColor: item.active ? theme.surfaceBase : 'transparent',
                color: item.active ? theme.primary : theme.iconWeak
              }}
            >
              <span className="text-sm">{item.icon}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: theme.background }}>
          <div className="flex h-9 shrink-0 border-b items-center px-3" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.borderWeak }}>
            <span className="text-xs font-medium" style={{ color: theme.foregroundWeak }}>src/components/Button.tsx</span>
            <div className="flex-1" />
            <button 
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ color: theme.iconWeak }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                <path d="M2 3.5A1.5 1.5 0 013.5 2h2.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H12.5A1.5 1.5 0 0114 5.5v1.401a2.986 2.986 0 00-1.5-.401h-9a2.986 2.986 0 00-1.5.401V3.5z" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M3.5 6A1.5 1.5 0 002 7.5v5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-5A1.5 1.5 0 0012.5 6h-9z" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden diff-scrollbar" style={{ overflowY: 'auto' }}>
              <div className="flex">
                <div className="w-10 shrink-0 text-right select-none" style={{ color: theme.foregroundWeak }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div 
                      key={i} 
                      className="h-6 text-xs leading-6 pr-2"
                      style={{ 
                        color: i + 1 === 1 || i + 1 === 8 || i + 1 === 9 || i + 1 === 20 ? theme.foregroundWeak : theme.foregroundWeak,
                        opacity: 0.4
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 font-mono text-xs">
                  {diffLines.map((line, idx) => (
                    <div 
                      key={idx}
                      className="h-6 flex items-center"
                      style={{
                        backgroundColor: 
                          line.type === 'added' ? theme.diffAddBackground : 
                          line.type === 'removed' ? theme.diffRemoveBackground : 
                          line.type === 'hunk' ? theme.surfaceBase : 'transparent',
                        color: 
                          line.type === 'added' ? theme.diffAddForeground :
                          line.type === 'removed' ? theme.diffRemoveForeground :
                          line.type === 'header' ? theme.foregroundWeak :
                          line.type === 'hunk' ? theme.accent : theme.codeForeground,
                      }}
                    >
                      <span 
                        className="w-6 text-center opacity-50 shrink-0"
                        style={{ 
                          color: 
                            line.type === 'added' ? theme.success :
                            line.type === 'removed' ? theme.critical : 'transparent'
                        }}
                      >
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.type === 'header' || line.type === 'hunk' ? '' : ' '}
                      </span>
                      <span className={line.type === 'header' ? 'opacity-60 truncate' : 'truncate'}>{line.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-48 border-l shrink-0 flex flex-col" style={{ borderColor: theme.borderWeak, backgroundColor: theme.surfaceRaised }}>
              <div className="h-7 border-b flex items-center px-2" style={{ borderColor: theme.borderWeak }}>
                <span className="text-xs font-medium" style={{ color: theme.foregroundWeak }}>Session</span>
              </div>
              <div className="flex-1 overflow-y-auto p-1">
                {sessionItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer"
                    style={{ 
                      backgroundColor: item.active ? theme.surfaceBase : 'transparent',
                    }}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className="text-xs truncate" style={{ color: item.type === 'folder' ? theme.foregroundWeak : theme.foreground }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-64 border-l flex flex-col shrink-0" style={{ borderColor: theme.borderWeak, backgroundColor: theme.surfaceRaised }}>
          <div className="h-7 border-b flex items-center px-2" style={{ borderColor: theme.borderWeak }}>
            <span className="text-xs font-medium" style={{ color: theme.foregroundWeak }}>Terminal</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs diff-scrollbar" style={{ overflowY: 'auto' }}>
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="mb-1">
                {item.type === 'command' ? (
                  <span className="flex items-center gap-1" style={{ color: theme.accent }}>
                    <span>$</span>
                    <span style={{ color: theme.foreground }}>{item.content.replace('$ ', '')}</span>
                  </span>
                ) : (
                  <span style={{ color: theme.foregroundWeak }}>{item.content}</span>
                )}
              </div>
            ))}
            <div className="flex items-center gap-1 mt-1" style={{ color: theme.accent }}>
              <span>$</span>
              <span className="animate-pulse" style={{ color: theme.foreground }}>_</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-9 shrink-0 border-t flex items-center px-3 gap-2" style={{ backgroundColor: theme.surfaceRaised, borderColor: theme.borderWeak }}>
        <button className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors" style={{ backgroundColor: theme.primary, color: theme.primaryText }}>
          <span>Accept</span>
        </button>
        <button className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors" style={{ backgroundColor: theme.surfaceBase, color: theme.foreground, border: `1px solid ${theme.borderWeak}` }}>
          <span>Reject</span>
        </button>
        <div className="flex-1" />
        <span className="text-xs" style={{ color: theme.foregroundWeak }}>2 changes in session</span>
      </div>
    </div>
  );
};

export default ThemePreview;
