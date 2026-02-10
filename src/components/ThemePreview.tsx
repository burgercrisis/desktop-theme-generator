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
      surfaceStronger: get('surface-stronger'),
      surfaceRaisedStronger: get('surface-raised-stronger'),
      foreground: get('text-base'),
      foregroundWeak: get('text-weak'),
      foregroundWeaker: get('text-weaker'),
      foregroundStrong: get('text-strong'),
      foregroundStronger: get('text-stronger'),
      textOnBrand: get('text-on-brand-base'),
      textOnBrandStrong: get('text-on-brand-strong'),
      borderBase: get('border-base'),
      borderWeak: get('border-weak'),
      borderStrong: get('border-strong'),
      borderSelected: get('border-selected'),
      iconBase: get('icon-base'),
      iconWeak: get('icon-weak'),
      iconStrong: get('icon-strong'),
      iconOnBrand: get('icon-on-brand-base'),
      iconOnBrandStrong: get('icon-on-brand-strong'),
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
      diffAddBackground: get('surface-diff-add-base'),
      diffAddForeground: get('text-diff-add-base'),
      diffRemoveBackground: get('surface-diff-delete-base'),
      diffRemoveForeground: get('text-diff-delete-base'),
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
      buttonSecondary: get('button-secondary-base'),
      buttonSecondaryText: get('text-base'),
      buttonGhostHover: get('button-ghost-hover'),
      avatarPink: get('avatar-background-pink'),
      avatarPinkText: get('avatar-text-pink'),
      syntaxKeyword: get('syntax-keyword'),
      syntaxFunction: get('syntax-function'),
      syntaxString: get('syntax-string'),
      syntaxComment: get('syntax-comment'),
      syntaxVariable: get('syntax-variable'),
      syntaxNumber: get('syntax-number'),
      syntaxType: get('syntax-type'),
      terminalBlack: get('terminal-ansi-black'),
      terminalRed: get('terminal-ansi-red'),
      terminalGreen: get('terminal-ansi-green'),
      terminalYellow: get('terminal-ansi-yellow'),
      terminalBlue: get('terminal-ansi-blue'),
      terminalMagenta: get('terminal-ansi-magenta'),
      terminalCyan: get('terminal-ansi-cyan'),
      terminalWhite: get('terminal-ansi-white'),
      terminalBrightBlack: get('terminal-ansi-bright-black'),
      terminalBrightRed: get('terminal-ansi-bright-red'),
      terminalBrightGreen: get('terminal-ansi-bright-green'),
      terminalBrightYellow: get('terminal-ansi-bright-yellow'),
      terminalBrightBlue: get('terminal-ansi-bright-blue'),
      terminalBrightMagenta: get('terminal-ansi-bright-magenta'),
      terminalBrightCyan: get('terminal-ansi-bright-cyan'),
      terminalBrightWhite: get('terminal-ansi-bright-white'),
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

  const sidebarItems = [
    { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ), 
      label: 'Chat', 
      active: true 
    },
    { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ), 
      label: 'Files' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ), 
      label: 'Editor' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ), 
      label: 'Tools' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ), 
      label: 'Settings' 
    },
  ];

  const terminalLines = [
    { type: 'command', content: 'opencode --version', prompt: '$' },
    { type: 'output', content: 'opencode-cli v1.2.4 (stable)', color: 'text-weak' },
    { type: 'command', content: 'npm run dev', prompt: '$' },
    { type: 'output', content: '> vite v5.0.0 dev server running at:', color: 'text-weak' },
    { type: 'link', label: '> Local:', content: 'http://localhost:5173/', color: 'terminal-ansi-blue' },
  ];

  return (
    <div className="flex flex-col h-full rounded-lg border overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-colors" style={{ backgroundColor: theme.background, borderColor: theme.borderBase }}>
      {/* Actual Titlebar structure */}
      <header className="h-10 shrink-0 flex items-center justify-between px-3 gap-2 transition-colors relative" style={{ backgroundColor: theme.background, borderBottom: `1px solid ${theme.borderWeak}` }}>
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <div className="w-7 h-7 rounded flex items-center justify-center hover:bg-surface-raised-base transition-colors cursor-pointer" style={{ color: theme.iconWeak }}>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 4.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5zm0 4.5a.5.5 0 01.5-.5h11a.5.5 0 010 1h-11a.5.5 0 01-.5-.5z" />
            </svg>
          </div>
          {/* Back/Forward */}
          <div className="flex items-center gap-0.5 ml-1">
            <div className="w-7 h-7 rounded flex items-center justify-center opacity-40" style={{ color: theme.iconWeak }}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M10.293 3.293a1 1 0 011.414 1.414L7.414 9l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5z" /></svg>
            </div>
            <div className="w-7 h-7 rounded flex items-center justify-center opacity-40" style={{ color: theme.iconWeak }}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M5.707 3.293a1 1 0 010 1.414L9.586 9l-3.879 3.879a1 1 0 011.414 1.414l5-5a1 1 0 010-1.414l-5-5a1 1 0 01-1.414 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Center Search Bar (SessionHeader) */}
        <div className="absolute left-1/2 -translate-x-1/2 w-[320px] h-[28px] flex items-center gap-2 px-2 rounded border transition-colors cursor-text group" style={{ 
          backgroundColor: theme.surfaceRaised, 
          borderColor: theme.borderWeak,
        }}>
          <div className="w-4 h-4 flex items-center justify-center" style={{ color: theme.iconWeak }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" /></svg>
          </div>
          <span className="text-[12px] truncate flex-1" style={{ color: theme.foregroundWeak }}>Search files...</span>
          <div className="px-1 py-0.5 rounded text-[10px] border flex items-center justify-center min-w-[24px]" style={{ borderColor: theme.borderWeak, color: theme.foregroundWeaker, backgroundColor: theme.background }}>
            <span className="opacity-70 font-mono">⌘K</span>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <div className="px-3 h-7 flex items-center justify-center rounded text-[12px] font-medium hover:opacity-90 active:opacity-100 cursor-pointer transition-colors shadow-sm" 
               style={{ backgroundColor: theme.primary, color: theme.textOnBrand }}>
            Share
          </div>
          <div className="flex gap-1.5 ml-2 mr-1">
            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: '#ff5f56' }} />
            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: '#ffbd2e' }} />
            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: '#27c93f' }} />
          </div>
        </div>
      </header>

      <div 
        className="flex-1 w-full relative flex transition-colors overflow-hidden"
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
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.scrollbarThumb};
            border: 3px solid transparent;
            background-clip: content-box;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: ${theme.scrollbarThumb};
            border-width: 2px;
          }
        `}</style>

        {/* Sidebar Nav Desktop */}
        <div className="flex h-full shrink-0 overflow-hidden">
          {/* Project Rail - Far left 16px rail */}
          <div className="w-[16px] shrink-0 flex flex-col items-center py-3 gap-3 transition-colors border-r" style={{ backgroundColor: theme.background, borderColor: theme.borderWeak }}>
            <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: theme.iconWeak, opacity: 0.3 }} />
          </div>

          {/* Activity Bar - 64px wide */}
          <div className="w-16 shrink-0 flex flex-col border-r transition-colors items-center py-4 gap-4" style={{ backgroundColor: theme.backgroundStronger, borderColor: theme.borderWeak }}>
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold shadow-sm mb-3" style={{ backgroundColor: theme.avatarPink, color: theme.avatarPinkText }}>
              OC
            </div>
            
            <div className="flex-1 flex flex-col gap-6 items-center">
              {sidebarItems.map((item, idx) => (
                <div 
                  key={idx}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative"
                  style={{ 
                    backgroundColor: item.active ? theme.surfaceRaisedActive : 'transparent',
                    color: item.active ? theme.primary : theme.iconWeak
                  }}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {item.icon}
                  </div>
                  {item.active && (
                    <div className="absolute -left-[12px] w-1.5 h-6 rounded-r-full" style={{ backgroundColor: theme.primary }} />
                  )}
                </div>
              ))}
            </div>

            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-icon-weak hover:text-foreground transition-colors cursor-pointer mb-2" style={{ color: theme.iconWeak }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-colors" style={{ backgroundColor: theme.background }}>
          {/* Tabs */}
          <div className="flex h-10 shrink-0 border-b items-center px-1 gap-0 transition-colors" style={{ backgroundColor: theme.background, borderColor: theme.borderWeak }}>
            <div className="flex items-center gap-2 px-4 h-full border-b-2 relative group cursor-pointer" style={{ borderBottomColor: theme.primary, backgroundColor: theme.tabActive }}>
              <span className="text-[12px] font-medium" style={{ color: theme.foreground }}>Button.tsx</span>
              <div className="w-3.5 h-3.5 rounded-md flex items-center justify-center hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 h-full border-r opacity-60 hover:opacity-100 transition-opacity cursor-pointer" style={{ borderColor: theme.borderWeak }}>
              <span className="text-[12px] font-medium" style={{ color: theme.foregroundWeak }}>layout.tsx</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden custom-scrollbar" style={{ overflowY: 'auto' }}>
              <div className="flex min-h-full">
                <div className="w-12 shrink-0 text-right select-none pt-4 border-r" style={{ borderColor: theme.borderWeak, backgroundColor: theme.background }}>
                  {Array.from({ length: 25 }, (_, i) => (
                    <div 
                      key={i} 
                      className="h-6 text-[11px] leading-6 pr-3 font-mono"
                      style={{ 
                        color: theme.foregroundWeaker,
                        opacity: 0.5
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex-1 font-mono text-[13px] pt-4 px-4 bg-transparent">
                  {diffLines.map((line, idx) => (
                    <div 
                      key={idx}
                      className="h-6 flex items-center -mx-4 px-4 group relative"
                      style={{
                        backgroundColor: 
                          line.type === 'added' ? theme.diffAddBackground :
                          line.type === 'removed' ? theme.diffRemoveBackground :
                          line.type === 'hunk' ? theme.tabActive : // Using tabActive as a proxy for hunk background
                          'transparent',
                        color:
                          line.type === 'added' ? theme.diffAddForeground :
                          line.type === 'removed' ? theme.diffRemoveForeground :
                          line.type === 'header' || line.type === 'hunk' ? theme.secondaryText :
                          theme.codeForeground
                      }}
                    >
                      {/* Diff Line Prefix (+/-/@@) */}
                      <span className="w-4 shrink-0 opacity-50 select-none text-[11px] font-mono">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
                      </span>
                      <span className="flex-1 whitespace-pre">
                        {line.type === 'header' || line.type === 'hunk' ? (
                          <span style={{ color: theme.secondary }}>{line.content}</span>
                        ) : (
                          highlightCode(line.content)
                        )}
                      </span>
                      {line.type === 'added' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: theme.success }} />
                      )}
                      {line.type === 'removed' && (
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: theme.critical }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terminal Area */}
            <div className="h-48 border-t flex flex-col transition-colors shadow-[0_-4px_12px_rgba(0,0,0,0.1)]" 
                 style={{ borderColor: theme.borderWeak, backgroundColor: theme.backgroundStronger }}>
              <div className="h-9 shrink-0 flex items-center px-4 border-b transition-colors" 
                   style={{ borderColor: theme.borderWeak, backgroundColor: theme.backgroundStronger }}>
                <div className="flex items-center gap-2 border-b-2 h-full" style={{ borderBottomColor: theme.primary }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.foreground }}>Terminal</span>
                </div>
                <div className="flex-1" />
                <div className="flex gap-1">
                  <div className="w-7 h-7 rounded flex items-center justify-center hover:bg-surface-raised-base transition-colors cursor-pointer" style={{ color: theme.iconWeak }}>
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z" /></svg>
                  </div>
                  <div className="w-7 h-7 rounded flex items-center justify-center hover:bg-surface-raised-base transition-colors cursor-pointer" style={{ color: theme.iconWeak }}>
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" /></svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 font-mono text-[12px] overflow-y-auto custom-scrollbar">
                {terminalLines.map((line, i) => (
                  <div key={i} className="flex gap-2 mb-1 min-h-[1.2em]">
                    {line.prompt && <span style={{ color: theme.terminalGreen }}>{line.prompt}</span>}
                    {line.label && <span style={{ color: theme.foregroundWeak }}>{line.label}</span>}
                    <span style={{ 
                      color: line.type === 'command' ? theme.terminalWhite : 
                             line.color ? (theme as any)[line.color.replace(/-([a-z])/g, (g:any) => g[1].toUpperCase())] || theme.foregroundWeak : 
                             theme.foregroundWeak 
                    }}>
                      {line.content}
                    </span>
                  </div>
                ))}
                <div className="flex gap-1.5 mt-4 opacity-80">
                  {[
                    theme.terminalBlack, theme.terminalRed, theme.terminalGreen, theme.terminalYellow, 
                    theme.terminalBlue, theme.terminalMagenta, theme.terminalCyan, theme.terminalWhite,
                  ].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemePreview;
