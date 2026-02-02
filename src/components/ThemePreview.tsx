import React from 'react';

interface ThemePreviewProps {
  theme: Record<string, string>;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme: rawTheme }) => {
  // Direct access to Opencode kebab-case tokens
  const theme = React.useMemo(() => {
    const t = rawTheme as any;
    const get = (key: string, fallback = '#808080') => t[key] || fallback;

    return {
      background: get('background-base'),
      backgroundWeak: get('background-weak'),
      backgroundStrong: get('background-strong'),
      backgroundStronger: get('background-stronger'),
      surfaceBase: get('surface-base'),
      surfaceBaseHover: get('surface-base-hover'),
      surfaceBaseActive: get('surface-base-active'),
      surfaceRaised: get('surface-raised-base'),
      surfaceRaisedHover: get('surface-raised-base-hover'),
      surfaceRaisedActive: get('surface-raised-base-active'),
      surfaceRaisedStrong: get('surface-raised-strong'),
      surfaceWeak: get('surface-weak'),
      surfaceWeaker: get('surface-weaker'),
      surfaceStrong: get('surface-strong'),
      foreground: get('text-base'),
      foregroundWeak: get('text-weak'),
      foregroundWeaker: get('text-weaker'),
      foregroundStrong: get('text-strong'),
      textOnBrand: get('text-on-brand-base'),
      borderBase: get('border-base'),
      borderWeak: get('border-weak'),
      borderStrong: get('border-strong'),
      borderSelected: get('border-selected'),
      iconBase: get('icon-base'),
      iconWeak: get('icon-weak'),
      iconStrong: get('icon-strong'),
      primary: get('primary-base'),
      primaryHover: get('primary-hover'),
      primaryActive: get('primary-active'),
      primaryText: get('primary-text'),
      secondary: get('secondary-base'),
      secondaryHover: get('secondary-hover'),
      secondaryActive: get('secondary-active'),
      secondaryText: get('secondary-text'),
      accent: get('accent-base'),
      accentHover: get('accent-hover'),
      accentActive: get('accent-active'),
      accentText: get('accent-text'),
      success: get('success-base'),
      successHover: get('success-hover'),
      successActive: get('success-active'),
      successText: get('success-text'),
      warning: get('warning-base'),
      warningHover: get('warning-hover'),
      warningActive: get('warning-active'),
      warningText: get('warning-text'),
      critical: get('critical-base'),
      criticalHover: get('critical-hover'),
      criticalActive: get('critical-active'),
      criticalText: get('critical-text'),
      info: get('info-base'),
      infoHover: get('info-hover'),
      infoActive: get('info-active'),
      infoText: get('info-text'),
      muted: get('text-weaker'),
      border: get('border-base'),
      codeBackground: get('code-background'),
      codeForeground: get('code-foreground'),
      diffAddBackground: get('diff-add-base'),
      diffAddForeground: get('diff-add-foreground'),
      diffRemoveBackground: get('diff-delete-base'),
      diffRemoveForeground: get('diff-delete-foreground'),
      diffChangeBackground: get('surface-base'),
      diffChangeForeground: get('text-base'),
      tabActive: get('tab-active'),
      tabInactive: get('tab-inactive'),
      tabHover: get('tab-hover'),
      lineIndicator: get('line-indicator'),
      lineIndicatorActive: get('line-indicator-active'),
      avatarBackground: get('avatar-background'),
      avatarForeground: get('avatar-foreground'),
      scrollbarThumb: get('scrollbar-thumb'),
      scrollbarTrack: get('scrollbar-track'),
      overlay: get('overlay'),
      focusRing: get('focus-ring'),
      shadow: get('shadow'),
      selectionBackground: get('selection-background'),
      selectionForeground: get('selection-foreground'),
      syntaxKeyword: get('syntax-keyword'),
      syntaxFunction: get('syntax-function'),
      syntaxString: get('syntax-string'),
      syntaxComment: get('syntax-comment'),
      syntaxVariable: get('syntax-variable'),
      terminalBlack: get('terminal-ansi-black'),
      terminalRed: get('terminal-ansi-red'),
      terminalGreen: get('terminal-ansi-green'),
      terminalYellow: get('terminal-ansi-yellow'),
      terminalBlue: get('terminal-ansi-blue'),
      terminalMagenta: get('terminal-ansi-magenta'),
      terminalCyan: get('terminal-ansi-cyan'),
      terminalWhite: get('terminal-ansi-white'),
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

  const highlightCode = (code: string) => {
    // Very simple regex-based highlighting for preview purposes
    return code.split(/(\s+|[{}()[\],;.]|'[^']*'|"[^"]*"|\/\/[^\n]*)/).map((part, i) => {
      if (!part) return null;
      
      if (part.startsWith('//')) {
        return <span key={i} style={{ color: theme.syntaxComment }}>{part}</span>;
      }
      if (part.startsWith("'") || part.startsWith('"')) {
        return <span key={i} style={{ color: theme.syntaxString }}>{part}</span>;
      }
      if (/^(import|export|interface|return|const|boolean|void|default|as)$/.test(part)) {
        return <span key={i} style={{ color: theme.syntaxKeyword }}>{part}</span>;
      }
      if (/^[A-Z][a-zA-Z0-9]*$/.test(part) || /^(onClick|children|variant|size|loading|disabled)$/.test(part)) {
        return <span key={i} style={{ color: theme.syntaxVariable }}>{part}</span>;
      }
      if (part === 'Button' || part === 'Spinner' || part === 'React') {
        return <span key={i} style={{ color: theme.syntaxFunction }}>{part}</span>;
      }
      
      // Simulate selection on a specific part for visual check
      if (part === 'loading' && code.includes('loading?: boolean;')) {
        return (
          <span 
            key={i} 
            style={{ 
              backgroundColor: theme.selectionBackground, 
              color: theme.selectionForeground,
              borderRadius: '2px',
              padding: '0 2px'
            }}
          >
            {part}
          </span>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

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
                      <span className={line.type === 'header' ? 'opacity-60 truncate' : 'truncate'}>
                        {line.type === 'header' || line.type === 'hunk' ? line.content : highlightCode(line.content)}
                      </span>
                    </div>
                  ))}
                </div>
          </div>

          <div className="h-24 border-t px-3 py-2 font-mono text-[11px] overflow-hidden" style={{ borderColor: theme.borderWeak, backgroundColor: theme.surfaceBase }}>
            <div className="flex gap-2 mb-1">
              <span style={{ color: theme.terminalGreen }}>$</span>
              <span style={{ color: theme.terminalWhite }}>npm run dev</span>
            </div>
            <div style={{ color: theme.foregroundWeak }}>{`> vite v5.0.0 dev server running at:`}</div>
            <div className="flex gap-2">
              <span style={{ color: theme.foregroundWeak }}>{`> Local:`}</span>
              <span style={{ color: theme.terminalBlue }}>http://localhost:5173/</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[theme.terminalBlack, theme.terminalRed, theme.terminalGreen, theme.terminalYellow, theme.terminalBlue, theme.terminalMagenta, theme.terminalCyan, theme.terminalWhite].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
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
