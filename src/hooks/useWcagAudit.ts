import { useMemo, useCallback } from "react"
import { OpencodeThemeColors } from "../types"
import { getCachedContrastScore, clearContrastCache } from "../utils/cachedContrast"

interface UseWcagAuditProps {
  themeColors: OpencodeThemeColors
}

export interface WcagPair {
  label: string;
  bg: string;
  fg: string;
  bgKey: string;
  fgKey: string;
  desc: string;
  isNonText?: boolean;
  isBorder?: boolean;
  isWeak?: boolean;
  isStrong?: boolean;
  category: string;
  type: 'shell' | 'read' | 'action' | 'diff';
  score: { ratio: number, hueDiff: number, level: string, pass: boolean }
}

export const useWcagAudit = ({ themeColors }: UseWcagAuditProps) => {
  const formatAgentLabel = useCallback((str: string) => {
    if (!str) return ""
    return str.replace(/-/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
  }, [])

  const wcagPairs = useMemo(() => {
    clearContrastCache()
    const pairs: Array<WcagPair> = []
    const seenPairs = new Set<string>()
    
    const addPair = (category: string, label: string, bgKey: string, fgKey: string, desc: string, isNonTextParam = false) => {
      const pairId = `${category}:${bgKey}:${fgKey}`
      if (seenPairs.has(pairId)) return
      seenPairs.add(pairId)

      const bg = themeColors[bgKey as keyof OpencodeThemeColors]
      const fg = themeColors[fgKey as keyof OpencodeThemeColors]
      if (typeof bg === 'string' && typeof fg === 'string') {
        const isBorderElement = fgKey.includes('border') || fgKey.includes('ring') || fgKey.includes('divider') || fgKey.includes('rule') || fgKey.includes('separator');
        const isExplicitText = !isBorderElement && (fgKey.includes('text') || fgKey.includes('foreground') || fgKey.includes('title') || fgKey.includes('label') || fgKey.includes('placeholder') || fgKey.includes('description') || fgKey.includes('syntax') || (fgKey.includes('icon') && (category.includes('DIFF'))));
        const isNonText = isNonTextParam || (!isExplicitText && !label.includes("TEXT") && !label.includes("FOREGROUND") && !label.includes("DIFF"));
        const isStrong = fgKey.includes('strong');
        const isWeak = fgKey.includes('weak');

        const contrastScore = getCachedContrastScore(bg, fg, isNonText, isBorderElement, isWeak, isStrong, category);
        
        let type: 'shell' | 'read' | 'action' | 'diff' = 'shell';
        if (category.includes('SURFACES')) type = 'shell';
        else if (category.includes('TYPOGRAPHY')) type = 'read';
        else if (category.includes('INTERACTIVE') || category.includes('ACTIONS') || category.includes('BUTTONS')) type = 'action';
        else if (category.includes('STATUS') || category.includes('SEMANTIC')) type = 'diff';

        pairs.push({ category, label, bg, fg, bgKey, fgKey, desc, isNonText, isBorder: isBorderElement, isStrong, isWeak, type, score: contrastScore })
      }
    }

    // --- LOG_00_SESSION_CRITICAL_AUDIT ---
    addPair("LOG_00_SESSION_CRITICAL_AUDIT", formatAgentLabel("ACTIVE_SESSION_TEXT"), "surface-base-active", "text-text-strong", "ACTIVE SESSION TEXT")
    addPair("LOG_00_SESSION_CRITICAL_AUDIT", formatAgentLabel("ACTIVE_SESSION_ICON"), "surface-base-active", "text-icon-weak", "ACTIVE SESSION ICON", true)
    addPair("LOG_00_SESSION_CRITICAL_AUDIT", formatAgentLabel("HOVER_SESSION_TEXT"), "surface-raised-base-hover", "text-text-strong", "HOVER SESSION TEXT")
    addPair("LOG_00_SESSION_CRITICAL_AUDIT", formatAgentLabel("HOVER_SESSION_ICON"), "surface-raised-base-hover", "text-icon-weak", "HOVER SESSION ICON", true)

    // --- LOG_01_TYPOGRAPHY ---
    const backgrounds = ["background-base", "background-strong"]
    const coreTexts = ["text-base", "text-weak", "text-strong"]
    backgrounds.forEach(bg => {
      coreTexts.forEach(fg => {
        addPair("LOG_01_TYPOGRAPHY", `${formatAgentLabel(fg.replace("text-", ""))}_ON_${formatAgentLabel(bg.replace("background-", ""))}`, bg, fg, `${fg} ON ${bg}`, false)
      })
    })

    // --- LOG_02_SURFACES ---
    const surfaceCategories = [
      { name: "LOG_02_SURFACES", prefix: "surface-base", items: ["base", "hover"] },
      { name: "LOG_02_SURFACES", prefix: "surface-inset", items: ["base", "strong"] },
      { name: "LOG_02_SURFACES", prefix: "surface-raised", items: ["base", "strong", "stronger-non-alpha"] },
      { name: "LOG_02_SURFACES", prefix: "surface-float", items: ["base", "strong"] },
    ]
    surfaceCategories.forEach(cat => {
      cat.items.forEach(item => {
        let bgKey = ""
        if (item === "base" && (cat.prefix === "surface-base" || cat.prefix === "surface-weak" || cat.prefix === "surface-weaker" || cat.prefix === "surface-strong")) {
          bgKey = cat.prefix
        } else if (item === "hover" && cat.prefix === "surface-base") {
          bgKey = "surface-base-hover"
        } else if (item === "active" && cat.prefix === "surface-base") {
          bgKey = "surface-base-active"
        } else {
          bgKey = `${cat.prefix}-${item}`
        }
        addPair("LOG_02_SURFACES", formatAgentLabel(bgKey.replace("surface-", "")), "background-base", bgKey, `SURFACE ${bgKey.toUpperCase().replace(/-/g, '_')} ON BACKGROUND`, true)
        addPair("LOG_02_SURFACES", `TEXT_ON_${formatAgentLabel(bgKey.replace("surface-", ""))}`, bgKey, "text-base", `TEXT_BASE_ON_${bgKey.toUpperCase().replace(/-/g, '_')}`, false)
        addPair("LOG_02_SURFACES", `ICON_ON_${formatAgentLabel(bgKey.replace("surface-", ""))}`, bgKey, "icon-base", `ICON_BASE_ON_${bgKey.toUpperCase().replace(/-/g, '_')}`, true)
        if (bgKey.includes("-hover")) {
          const baseKey = bgKey.replace("-hover", "");
          if (themeColors[baseKey as keyof OpencodeThemeColors]) {
            addPair("LOG_02_SURFACES", `${formatAgentLabel(bgKey.replace("surface-", ""))}_VS_BASE`, baseKey, bgKey, `HOVER VS BASE STATE`, true);
          }
        }
      })
    })

    // --- LOG_03_ACTIONS ---
    const interactiveSurfaces = [
      { bg: "surface-brand-base", fg: "text-on-brand-base", label: "BRAND_BASE" },
      { bg: "surface-brand-hover", fg: "text-on-brand-base", label: "BRAND_HOVER" },
      { bg: "surface-brand-active", fg: "text-on-brand-base", label: "BRAND_ACTIVE" },
      { bg: "surface-brand-base", fg: "text-on-brand-strong", label: "BRAND_STRONG" },
      { bg: "surface-interactive-base", fg: "text-on-interactive-base", label: "INTERACTIVE_BASE" },
      { bg: "surface-interactive-hover", fg: "text-on-interactive-base", label: "INTERACTIVE_HOVER" },
      { bg: "surface-interactive-active", fg: "text-on-interactive-base", label: "INTERACTIVE_ACTIVE" },
      { bg: "surface-interactive-weak", fg: "text-on-interactive-weak", label: "INTERACTIVE_WEAK" },
      { bg: "surface-interactive-weak-hover", fg: "text-on-interactive-weak", label: "INTERACTIVE_WEAK_HOVER" }
    ]
    interactiveSurfaces.forEach(s => {
      addPair("LOG_03_ACTIONS", formatAgentLabel(s.label), s.bg, s.fg, `TEXT_ON_${s.bg.toUpperCase().replace(/-/g, '_')}`, false)
      if (s.bg.includes("-hover")) {
        const baseKey = s.bg.replace("-hover", "-base");
        if (themeColors[baseKey as keyof OpencodeThemeColors]) {
          addPair("LOG_03_ACTIONS", `${formatAgentLabel(s.label)}_VS_BASE`, baseKey, s.bg, `HOVER VS BASE STATE`, true);
        }
      } else if (s.bg.includes("-active")) {
        const baseKey = s.bg.replace("-active", "-base");
        if (themeColors[baseKey as keyof OpencodeThemeColors]) {
          addPair("LOG_03_ACTIONS", `${formatAgentLabel(s.label)}_VS_BASE`, baseKey, s.bg, `ACTIVE VS BASE STATE`, true);
        }
      }
    })
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_TEXT"), "background-base", "text-interactive-base", "INTERACTIVE_TEXT_ON_BACKGROUND", false)
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_ICON"), "background-base", "icon-interactive-base", "INTERACTIVE_ICON_CONTRAST", true)
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER"), "background-base", "border-interactive-base", "INTERACTIVE_BORDER_CONTRAST", true)
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_HOVER"), "background-base", "border-interactive-hover", "INTERACTIVE_BORDER_HOVER_CONTRAST", true)
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_ACTIVE"), "background-base", "border-interactive-active", "INTERACTIVE_BORDER_ACTIVE_CONTRAST", true)
    addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_SELECTED"), "background-base", "border-interactive-selected", "INTERACTIVE_BORDER_SELECTED_CONTRAST", true)

    // --- LOG_04_BUTTONS ---
    addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_BASE"), "button-secondary-base", "text-base", "SECONDARY_BUTTON_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_HOVER"), "button-secondary-hover", "text-base", "SECONDARY_BUTTON_HOVER_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_HOVER_VS_BASE"), "button-secondary-base", "button-secondary-hover", "SECONDARY HOVER VS BASE", true)
    addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER"), "button-ghost-hover", "text-base", "GHOST_BUTTON_HOVER_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER_VS_BASE"), "background-base", "button-ghost-hover", "GHOST HOVER VS BASE", true)
    addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER2"), "button-ghost-hover2", "text-base", "GHOST_BUTTON_HOVER2_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER2_VS_BASE"), "background-base", "button-ghost-hover2", "GHOST HOVER2 VS BASE", true)
    addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_BASE"), "button-danger-base", "text-on-critical-base", "DANGER_BUTTON_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_HOVER"), "button-danger-hover", "text-on-critical-base", "DANGER_BUTTON_HOVER_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_HOVER_VS_BASE"), "button-danger-base", "button-danger-hover", "DANGER HOVER VS BASE", true)
    addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_ACTIVE"), "button-danger-active", "text-on-critical-base", "DANGER_BUTTON_ACTIVE_TEXT", false)
    addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_ACTIVE_VS_BASE"), "button-danger-base", "button-danger-active", "DANGER ACTIVE VS BASE", true)

    // --- LOG_05_SEMANTIC ---
    const semanticTypes = ["success", "warning", "critical", "info"]
    semanticTypes.forEach(type => {
      const states = [
        { suffix: "base", label: "BASE" },
        { suffix: "hover", label: "HOVER" },
        { suffix: "active", label: "ACTIVE" },
        { suffix: "weak", label: "WEAK" },
        { suffix: "strong", label: "STRONG" }
      ]
      states.forEach(state => {
        const bgKey = `surface-${type}-${state.suffix}`
        const fgKey = (state.suffix === 'strong' || state.suffix === 'base') 
          ? `text-on-${type}-${state.suffix === 'strong' ? 'strong' : 'base'}`
          : `text-on-${type}-base`;
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_${state.label}`), bgKey, fgKey, `${type.toUpperCase()}_${state.label}_SURFACE_CONTRAST`, false)
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_STRONG_ON_${state.label}`), bgKey, `text-on-${type}-strong`, `${type.toUpperCase()}_STRONG_TEXT_ON_${state.label}_SURFACE`, false)
        if (state.suffix === "hover" || state.suffix === "active") {
          const baseKey = `surface-${type}-base`;
          if (themeColors[baseKey as keyof OpencodeThemeColors]) {
            addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_${state.label}_VS_BASE`), baseKey, bgKey, `${state.label} VS BASE STATE`, true);
          }
        }
      })
      addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_ICON`), `background-base`, `icon-${type}-base`, `${type.toUpperCase()}_ICON_ON_BACKGROUND`, true)
      addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_BORDER`), `background-base`, `border-${type}-base`, `${type.toUpperCase()}_BORDER_ON_BACKGROUND`, true)
      addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_STRONG_ON_BG`), `background-base`, `text-on-${type}-strong`, `${type.toUpperCase()}_STRONG_TEXT_ON_MAIN_BG`, false)
      addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_BASE_ON_BG`), `background-base`, `text-on-${type}-base`, `${type.toUpperCase()}_BASE_TEXT_ON_MAIN_BG`, false)
    })

    // --- LOG_06_DIFFS ---
    const diffStates = [
      { type: "add", label: "ADD" },
      { type: "delete", label: "DELETE" },
      { type: "hidden", label: "HIDDEN" }
    ]
    diffStates.forEach(diff => {
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_TEXT`), `surface-diff-${diff.type}-base`, `text-diff-${diff.type}-base`, `DIFF_${diff.label}_TEXT_CONTRAST`, false)
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_WEAK`), `surface-diff-${diff.type}-weak`, `text-diff-${diff.type}-base`, `${diff.label}_TEXT_ON_WEAK_BACKGROUND`, false)
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_WEAKER`), `surface-diff-${diff.type}-weaker`, `text-diff-${diff.type}-base`, `${diff.label}_TEXT_ON_WEAKER_BACKGROUND`, false)
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_STRONG`), `surface-diff-${diff.type}-strong`, `text-diff-${diff.type}-strong`, `STRONG_${diff.label}_TEXT_CONTRAST`, false)
      const strongerFg = diff.type === 'delete' ? 'text-on-critical-base' : (diff.type === 'add' ? 'text-on-success-base' : 'text-base')
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_STRONGER`), `surface-diff-${diff.type}-stronger`, strongerFg, `${diff.label}_TEXT_ON_STRONGER_BACKGROUND`, false)
      addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_ICON`), `background-base`, `icon-diff-${diff.type}-base`, `DIFF_${diff.label}_ICON_ON_BACKGROUND`, true)
    })
    addPair("LOG_06_DIFFS", formatAgentLabel("SKIP_BACKGROUND"), "background-base", "surface-diff-skip-base", "SKIP_LINE_CONTRAST", true)
    addPair("LOG_06_DIFFS", formatAgentLabel("UNCHANGED_BACKGROUND"), "background-base", "surface-diff-unchanged-base", "UNCHANGED_LINE_CONTRAST", true)
    addPair("LOG_06_DIFFS", formatAgentLabel("SYNTAX_DIFF_ADD"), "code-background", "syntax-diff-add", "SYNTAX_DIFF_ADD_ON_CODE_BG", false)
    addPair("LOG_06_DIFFS", formatAgentLabel("SYNTAX_DIFF_DELETE"), "code-background", "syntax-diff-delete", "SYNTAX_DIFF_DELETE_ON_CODE_BG", false)

    // --- LOG_07_INPUTS ---
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_TEXT"), "input-base", "text-base", "TEXT_INSIDE_INPUT_FIELD", false)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_BORDER"), "background-base", "border-base", "INPUT_BORDER_ON_BACKGROUND", true)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_PLACEHOLDER"), "input-base", "text-weaker", "PLACEHOLDER_TEXT_CONTRAST", false)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_HOVER"), "input-hover", "text-base", "TEXT_IN_HOVERED_INPUT", false)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_ACTIVE"), "input-active", "text-base", "TEXT_IN_ACTIVE_INPUT", false)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_DISABLED"), "background-base", "input-disabled", "DISABLED_INPUT_BACKGROUND_CONTRAST", true)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_SELECTED_BORDER"), "background-base", "border-selected", "SELECTED_INPUT_BORDER_CONTRAST", true)
    addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_FOCUS_RING"), "background-base", "input-focus-ring", "INPUT FOCUS RING", true)

    // --- LOG_08_TERMINAL ---
    const ansiColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]
    ansiColors.forEach(color => {
      addPair("LOG_08_TERMINAL", formatAgentLabel(color), "background-base", `terminal-ansi-${color}`, `TERMINAL ${color.toUpperCase()} ON BACKGROUND`, false)
      addPair("LOG_08_TERMINAL", formatAgentLabel(`bright-${color}`), "background-base", `terminal-ansi-bright-${color}`, `TERMINAL BRIGHT ${color.toUpperCase()} ON BACKGROUND`, false)
    })
    addPair("LOG_08_TERMINAL", formatAgentLabel("TERMINAL_CURSOR"), "background-base", "terminal-cursor", "TERMINAL CURSOR CONTRAST", true)
    addPair("LOG_08_TERMINAL", formatAgentLabel("TERMINAL_SELECTION"), "terminal-selection", "text-base", "TERMINAL SELECTION CONTRAST", false)

    // --- LOG_09_COMPARISONS ---
    addPair("LOG_09_COMPARISONS", formatAgentLabel("TEXT_BASE_VS_ICON_BASE"), "background-base", "text-base", "TEXT (4.5:1) VS ICON (1.1:1)", false)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("ICON_BASE_VS_TEXT_BASE"), "background-base", "icon-base", "ICON (1.1:1) VS TEXT (4.5:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("ACTIVE_INDICATOR_VS_BORDER"), "background-base", "line-indicator-active", "ACTIVE INDICATOR (4.5:1) VS BORDER (1.1:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("BORDER_VS_ACTIVE_INDICATOR"), "background-base", "border-base", "BORDER (1.1:1) VS ACTIVE INDICATOR (4.5:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("STATUS_ICON_VS_DECORATIVE"), "background-base", "status-icon", "STATUS ICON (4.5:1) VS DECORATIVE (1.1:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("ICON_WEAK_VS_STATUS"), "background-base", "icon-weak", "WEAK ICON (1.1:1) VS STATUS (4.5:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("TAB_ACTIVE_VS_INACTIVE"), "background-base", "tab-active", "ACTIVE TAB (4.5:1) VS INACTIVE (1.1:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("SURFACE_WEAK_VS_ACTIVE"), "background-base", "surface-weak", "WEAK SURFACE (1.1:1) VS ACTIVE (4.5:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("TERMINAL_CURSOR_VS_BORDER"), "background-base", "terminal-cursor", "CURSOR (4.5:1) VS BORDER (1.1:1)", true)
    addPair("LOG_09_COMPARISONS", formatAgentLabel("LOGO_VS_TEXT"), "background-base", "logo-base-strong", "LOGO (1.1:1) VS TEXT (4.5:1)", true)

    // --- LOG_09_AVATARS ---
    const avatarColors = ["pink", "mint", "orange", "purple", "cyan", "lime", "blue", "green", "yellow", "red", "gray"]
    avatarColors.forEach(color => {
      addPair("LOG_09_AVATARS", formatAgentLabel(color), `avatar-background-${color}`, `avatar-text-${color}`, `AVATAR_${color.toUpperCase()}_CONTRAST`, false)
    })
    
    // --- LOG_31_AVATAR_EXPANDED ---
    const expandedAvatarColors = ["pink", "mint", "orange", "purple", "cyan", "lime", "blue", "green", "yellow", "red", "gray"]
    expandedAvatarColors.forEach(color => {
      addPair("LOG_09_AVATARS", formatAgentLabel(`EXPANDED_${color}`), `avatar-background-${color}`, `avatar-text-${color}`, `EXPANDED_AVATAR_${color.toUpperCase()}_CONTRAST`, false)
    })

    // --- LOG_10_SYNTAX ---
    const syntaxTokensDetailed = [
      "syntax-comment", "syntax-keyword", "syntax-function", "syntax-variable", 
      "syntax-string", "syntax-number", "syntax-type", "syntax-operator", 
      "syntax-punctuation", "syntax-object", "syntax-regexp", "syntax-primitive", 
      "syntax-property", "syntax-constant", "syntax-tag", "syntax-attribute",
      "syntax-value", "syntax-namespace", "syntax-class",
      "syntax-success", "syntax-warning", "syntax-critical", "syntax-info", 
      "syntax-diff-add", "syntax-diff-delete"
    ]
    syntaxTokensDetailed.forEach(token => {
      const parts = token.split("-")
      const label = formatAgentLabel(parts.length > 2 ? `${parts[1]}_${parts[2]}` : parts[1])
      addPair("LOG_10_SYNTAX", label, "code-background", token, `SYNTAX ${label} ON EDITOR BACKGROUND`, false)
    })

    // --- LOG_11_UI_EXTRAS ---
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR"), "background-base", "line-indicator", "LINE INDICATOR CONTRAST", false)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR_ACTIVE"), "background-base", "line-indicator-active", "ACTIVE LINE INDICATOR CONTRAST", false)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR_HOVER"), "background-base", "line-indicator-hover", "HOVER LINE INDICATOR CONTRAST", false)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_ACTIVE"), "background-base", "tab-active", "ACTIVE TAB INDICATOR CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_INACTIVE"), "background-base", "tab-inactive", "INACTIVE TAB INDICATOR CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_HOVER"), "background-base", "tab-hover", "HOVER TAB INDICATOR CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("FOCUS_RING"), "background-base", "focus-ring", "FOCUS RING CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("SCROLLBAR"), "scrollbar-track", "scrollbar-thumb", "SCROLLBAR CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("SELECTION"), "selection-background", "selection-foreground", "SELECTION CONTRAST", true)
    addPair("LOG_11_UI_EXTRAS", formatAgentLabel("INACTIVE_SELECTION"), "selection-inactive-background", "text-base", "INACTIVE SELECTION CONTRAST", true)

    // --- LOG_12_SPLASH_LOADING ---
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE"), "background-base", "icon-base", "OPENCODE LOGO BASE ON BACKGROUND", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_STRONG"), "background-base", "icon-strong-base", "OPENCODE LOGO STRONG ON BACKGROUND", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_WEAK"), "background-base", "icon-weak-base", "OPENCODE LOGO WEAK ON BACKGROUND", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE_STRONG"), "icon-base", "icon-strong-base", "LOGO BASE VS STRONG", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE_WEAK"), "icon-base", "icon-weak-base", "LOGO BASE VS WEAK", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_STRONG_WEAK"), "icon-strong-base", "icon-weak-base", "LOGO STRONG VS WEAK", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOADING_SPINNER"), "background-base", "icon-interactive-base", "LOADING SPINNER CONTRAST", true)
    addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOADING_TEXT"), "background-base", "text-weak", "LOADING TEXT CONTRAST", false)

    // --- LOG_13_TREE_UI ---
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_BG_SELECTED"), "background-base", "tree-background-selected", "TREE SELECTED BG CONTRAST", true)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_BG_HOVER"), "background-base", "tree-background-hover", "TREE HOVER BG CONTRAST", true)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_SELECTED_TEXT"), "tree-background-selected", "tree-foreground-selected", "TREE SELECTED TEXT CONTRAST", false)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_HOVER_TEXT"), "tree-background-hover", "tree-foreground-hover", "TREE HOVER TEXT CONTRAST", false)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_ICON_SELECTED"), "tree-background-selected", "tree-icon-selected", "TREE SELECTED ICON CONTRAST", true)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_TEXT_ON_BASE"), "background-base", "text-base", "TREE TEXT ON MAIN BACKGROUND", false)
    addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_TEXT_WEAK_ON_BASE"), "background-base", "text-weak", "TREE WEAK TEXT ON MAIN BACKGROUND", false)

    // --- LOG_14_TABS_EXTENDED ---
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_BG"), "background-base", "tab-active-background", "ACTIVE TAB BG CONTRAST", true)
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_TEXT"), "tab-active-background", "tab-active-foreground", "ACTIVE TAB TEXT CONTRAST", false)
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_BORDER"), "background-base", "tab-active-border", "ACTIVE TAB BORDER/INDICATOR", true)
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_INACTIVE_BG"), "background-base", "tab-inactive-background", "INACTIVE TAB BG CONTRAST", true)
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_INACTIVE_TEXT"), "tab-inactive-background", "tab-inactive-foreground", "INACTIVE TAB TEXT CONTRAST", false)
    addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_HOVER_TEXT"), "background-base", "text-strong", "TAB HOVER TEXT CONTRAST", false)

    // --- LOG_15_BREADCRUMBS ---
    addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_TEXT"), "background-base", "breadcrumb-foreground", "BREADCRUMB TEXT ON BG", false)
    addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_HOVER"), "background-base", "breadcrumb-foreground-hover", "BREADCRUMB HOVER TEXT ON BG", false)
    addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_SEP"), "background-base", "breadcrumb-separator", "BREADCRUMB SEPARATOR CONTRAST", true)
    addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_BG"), "background-base", "breadcrumb-background", "BREADCRUMB BG CONTRAST", true)

    // --- LOG_16_BORDERS_FUNCTIONAL ---
    const functionalBorders = ["interactive", "success", "warning", "critical", "info"]
    functionalBorders.forEach(type => {
      addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_BASE`), "background-base", `border-${type}-base`, `${type.toUpperCase()} BORDER ON BG`, true)
      addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_HOVER`), "background-base", `border-${type}-hover`, `${type.toUpperCase()} BORDER HOVER ON BG`, true)
      addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_SELECT`), "background-base", `border-${type}-selected`, `${type.toUpperCase()} BORDER SELECTED ON BG`, true)
    })

    // --- LOG_17_MARKDOWN_DETAILED ---
    const markdownElements = [
      { key: "markdown-text", label: "TEXT" },
      { key: "markdown-heading", label: "HEADING" },
      { key: "markdown-link", label: "LINK" },
      { key: "markdown-link-text", label: "LINK_TEXT" },
      { key: "markdown-code", label: "CODE_INLINE" },
      { key: "markdown-block-quote", label: "BLOCKQUOTE" },
      { key: "markdown-emph", label: "EMPHASIS" },
      { key: "markdown-strong", label: "STRONG" },
      { key: "markdown-list-item", label: "LIST_ITEM" },
      { key: "markdown-list-enumeration", label: "LIST_ENUM" },
      { key: "markdown-image", label: "IMAGE" },
      { key: "markdown-image-text", label: "IMAGE_TEXT" }
    ]
    markdownElements.forEach(el => {
      addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel(el.label), "background-base", el.key, `MARKDOWN ${el.label} ON BACKGROUND`, false)
    })
    addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel("CODE_BLOCK_BG"), "background-base", "markdown-code-block", "MARKDOWN CODE BLOCK CONTRAST", true)
    addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel("HR_LINE"), "background-base", "markdown-horizontal-rule", "MARKDOWN HORIZONTAL RULE", true)

    // --- LOG_18_EDITOR_ADDITIONAL ---
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("CODE_FOREGROUND"), "code-background", "code-foreground", "EDITOR DEFAULT TEXT CONTRAST", false)
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("LINE_INDICATOR"), "background-base", "line-indicator", "LINE INDICATOR CONTRAST", false)
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("LINE_INDICATOR_ACTIVE"), "background-base", "line-indicator-active", "ACTIVE LINE INDICATOR CONTRAST", false)
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_ACTIVE"), "background-base", "tab-active", "ACTIVE TAB CONTRAST", true)
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_INACTIVE"), "background-base", "tab-inactive", "INACTIVE TAB CONTRAST", true)
    addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_HOVER"), "background-base", "tab-hover", "HOVER TAB CONTRAST", true)

    // --- LOG_19_BORDERS ---
    const borderTokens = [
      "border-base", "border-hover", "border-active", "border-selected",
      "border-weak-base", "border-weak-hover", "border-weak-active",
      "border-weaker-base", "border-weaker-hover", "border-weaker-active",
      "border-strong-base", "border-strong-hover", "border-strong-active",
      "border-interactive-base", "border-success-base", "border-warning-base", "border-critical-base", "border-info-base"
    ]
    borderTokens.forEach(token => {
      addPair("LOG_19_BORDERS", formatAgentLabel(token.replace("border-", "")), "background-base", token, `BORDER ${token.toUpperCase().replace(/-/g, '_')} ON BACKGROUND`, true)
    })

    // --- LOG_30_ICONS_DETAILED ---
    const iconVariants = ["base", "hover", "active", "selected"]
    const iconStrengths = ["", "weak-", "weaker-", "strong-"]
    iconStrengths.forEach(strength => {
      iconVariants.forEach(variant => {
        const token = `icon-${strength}${variant}`
        addPair("LOG_30_ICONS_DETAILED", formatAgentLabel(token), "background-base", token, `ICON ${token.toUpperCase()} ON BACKGROUND`, true)
      })
    })

    // --- LOG_20_SELECTIONS ---
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT"), "selection-background", "selection-foreground", "SELECTION TEXT CONTRAST", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("BASE_TEXT_ON_SELECTION"), "selection-background", "text-base", "BASE TEXT ON SELECTION BACKGROUND", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("INACTIVE_SELECTION_TEXT"), "selection-inactive-background", "text-base", "TEXT ON INACTIVE SELECTION", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_VS_BG"), "background-base", "selection-background", "SELECTION BACKGROUND VS BASE", true)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("INACTIVE_SELECTION_VS_BG"), "background-base", "selection-inactive-background", "INACTIVE SELECTION VS BASE", true)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT_BASE"), "selection-background", "text-base", "BASE TEXT ON SELECTION", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT_WEAK"), "selection-background", "text-weak", "WEAK TEXT ON SELECTION", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_DIFF_ADD"), "selection-background", "text-diff-add-base", "DIFF ADD TEXT ON SELECTION", false)
    addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_DIFF_DELETE"), "selection-background", "text-diff-delete-base", "DIFF DELETE TEXT ON SELECTION", false)

    // --- LOG_36_SESSION_ITEM_DETAILS ---
    const sessionBgs = ["tree-background-selected", "selection-background"]
    sessionBgs.forEach(bg => {
      const bgLabel = bg.includes("tree") ? "TREE_SEL" : "GEN_SEL"
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_BASE_TEXT`), bg, "text-base", "PRIMARY TEXT ON SESSION SELECTION", false)
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_WEAK_TEXT`), bg, "text-weak", "SECONDARY/PATH TEXT ON SESSION SELECTION", false)
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_DIFF_ADD`), bg, "text-diff-add-base", "GREEN DIFF COUNT ON SESSION SELECTION", false)
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_DIFF_DELETE`), bg, "text-diff-delete-base", "RED DIFF COUNT ON SESSION SELECTION", false)
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_ICON_BASE`), bg, "icon-base", "ICON ON SESSION SELECTION", true)
      addPair("LOG_36_SESSION_ITEM_DETAILS", formatAgentLabel(`${bgLabel}_ICON_WEAK`), bg, "icon-weak-base", "WEAK ICON ON SESSION SELECTION", true)
    })

    // --- LOG_21_SEMANTIC_SURFACES ---
    const surfaceSemanticTypes = ["brand", "interactive", "success", "warning", "critical", "info"]
    surfaceSemanticTypes.forEach(type => {
      const bg = `surface-${type}-base`
      const fg = `text-on-${type}-base`
      addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_BASE`), bg, fg, `TEXT ON ${type.toUpperCase()} BASE`, false)
      if (themeColors[`text-on-${type}-weak` as keyof OpencodeThemeColors]) {
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_WEAK_ON_BASE`), bg, `text-on-${type}-weak`, `WEAK TEXT ON ${type.toUpperCase()} BASE`, false)
      }
      if (themeColors[`text-on-${type}-strong` as keyof OpencodeThemeColors]) {
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_STRONG_ON_BASE`), bg, `text-on-${type}-strong`, `STRONG TEXT ON ${type.toUpperCase()} BASE`, false)
      }
      addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_HOVER`), `surface-${type}-hover`, fg, `TEXT ON ${type.toUpperCase()} HOVER`, false)
      if (themeColors[`surface-${type}-active` as keyof OpencodeThemeColors]) {
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_ACTIVE`), `surface-${type}-active`, fg, `TEXT ON ${type.toUpperCase()} ACTIVE`, false)
      }
      if (themeColors[`surface-${type}-weak` as keyof OpencodeThemeColors]) {
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_BASE_TEXT_ON_WEAK`), `surface-${type}-weak`, "text-base", `BASE TEXT ON WEAK ${type.toUpperCase()}`, false)
      }
    })

    // --- LOG_22_INVERTED_TEXT ---
    addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_TEXT_ON_STRONG"), "surface-strong", "text-invert-base", "INVERTED TEXT ON STRONG SURFACE", false)
    addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_TEXT_ON_BRAND"), "surface-brand-base", "text-invert-base", "INVERTED TEXT ON BRAND SURFACE", false)
    addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_ICON_ON_STRONG"), "surface-strong", "icon-invert-base", "INVERTED ICON ON STRONG SURFACE", true)

    // --- LOG_22_COLORED_TEXT_ICON ---
    const coloredBgs = [
      { key: "brand", label: "BRAND" },
      { key: "success", label: "SUCCESS" },
      { key: "warning", label: "WARNING" },
      { key: "critical", label: "CRITICAL" },
      { key: "info", label: "INFO" }
    ]
    coloredBgs.forEach(bg => {
      ["weak", "weaker"].forEach(variant => {
        const fgKey = `text-on-${bg.key}-${variant}`
        const bgKey = `surface-${bg.key}-base`
        addPair("LOG_22_COLORED_TEXT_ICON", formatAgentLabel(`${bg.label}_${variant.toUpperCase()}_TEXT`), bgKey, fgKey, `${variant.toUpperCase()} TEXT ON ${bg.label} BASE`, false)
      })
      const iconKey = `icon-on-${bg.key}-base`
      const bgKey = `surface-${bg.key}-base`
      addPair("LOG_22_COLORED_TEXT_ICON", formatAgentLabel(`${bg.label}_ICON`), bgKey, iconKey, `${bg.label} ICON ON ${bg.label} BASE`, true)
    })

    // --- LOG_23_AGENT_UI ---
    const agentIcons = ["plan", "docs", "ask", "build"]
    agentIcons.forEach(icon => {
      addPair("LOG_23_AGENT_UI", formatAgentLabel(`AGENT_${icon.toUpperCase()}_ICON`), "background-base", `icon-agent-${icon}-base`, `AGENT ${icon.toUpperCase()} ICON CONTRAST`, true)
    })

    // --- LOG_24_INTERACTIVE_STATES ---
    const interactiveTokens = [
      { key: "hover", label: "HOVER" },
      { key: "active", label: "ACTIVE" },
      { key: "selected", label: "SELECTED" }
    ]
    interactiveTokens.forEach(state => {
      addPair("LOG_24_INTERACTIVE_STATES", formatAgentLabel(`ICON_${state.label}`), "background-base", `icon-${state.key}`, `ICON ${state.label} ON BACKGROUND`, true)
      addPair("LOG_24_INTERACTIVE_STATES", formatAgentLabel(`BORDER_${state.label}`), "background-base", `border-${state.key}`, `BORDER ${state.label} ON BACKGROUND`, true)
    })

    // --- LOG_25_SEMANTIC_DETAILED ---
    const semanticStates = ["brand", "success", "warning", "critical", "info"]
    semanticStates.forEach(type => {
      const statefulIcons = ["hover", "selected"]
      statefulIcons.forEach(state => {
        const bgKey = `surface-${type}-base`
        const fgKey = `icon-on-${type}-${state}`
        addPair("LOG_25_SEMANTIC_DETAILED", formatAgentLabel(`${type}_ICON_${state}`), bgKey, fgKey, `${type.toUpperCase()} ICON ${state.toUpperCase()} ON ${type.toUpperCase()} BASE`, true)
      })
    })

    // --- LOG_26_COMPLEX_SURFACES ---
    addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("RAISED_STRONGER_NON_ALPHA"), "background-base", "surface-raised-stronger-non-alpha", "RAISED STRONGER (NON-ALPHA) SURFACE CONTRAST", true)
    addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("FLOAT_STRONG_ACTIVE"), "background-base", "surface-float-strong-active", "FLOAT STRONG ACTIVE SURFACE CONTRAST", true)
    addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("INTERACTIVE_ACTIVE_SURFACE"), "background-base", "surface-base-interactive-active", "INTERACTIVE ACTIVE SURFACE CONTRAST", true)

    // --- LOG_27_INVERTED_TEXT_ICON ---
    const darkSurfaces = [
      { key: "surface-strong", label: "STRONG" },
      { key: "surface-brand-base", label: "BRAND" },
      { key: "surface-critical-base", label: "CRITICAL" }
    ]
    darkSurfaces.forEach(bg => {
      addPair("LOG_27_INVERTED_TEXT_ICON", formatAgentLabel(`INVERT_TEXT_ON_${bg.label}`), bg.key, "text-invert-base", `INVERTED TEXT ON ${bg.label}`, false)
      addPair("LOG_27_INVERTED_TEXT_ICON", formatAgentLabel(`INVERT_ICON_ON_${bg.label}`), bg.key, "icon-invert-base", `INVERTED ICON ON ${bg.label}`, true)
    })

    // --- LOG_28_INPUT_DETAILED ---
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_DISABLED_TEXT"), "input-disabled", "text-weaker", "DISABLED INPUT TEXT CONTRAST", false)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_HOVER_BORDER"), "background-base", "border-hover", "INPUT HOVER BORDER CONTRAST", true)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_BORDER"), "background-base", "border-active", "INPUT ACTIVE BORDER CONTRAST", true)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_HOVER_VS_BASE"), "input-base", "input-hover", "INPUT HOVER VS BASE CONTRAST", true)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_VS_BASE"), "input-base", "input-active", "INPUT ACTIVE VS BASE CONTRAST", true)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_VS_HOVER"), "input-hover", "input-active", "INPUT ACTIVE VS HOVER CONTRAST", true)
    addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_BASE_VS_BG"), "background-base", "input-base", "INPUT BASE VS BACKGROUND", true)

    // --- LOG_29_DIFF_EXTRAS ---
    addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_MODIFIED_ICON"), "background-base", "icon-diff-modified-base", "DIFF MODIFIED ICON CONTRAST", true)
    addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_ADD_HOVER_ICON"), "background-base", "icon-diff-add-hover", "DIFF ADD HOVER ICON CONTRAST", true)
    addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_ADD_ACTIVE_ICON"), "background-base", "icon-diff-add-active", "DIFF ADD ACTIVE ICON CONTRAST", true)

    // --- LOG_32_MISC_BORDERS_ICONS ---
    addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("BORDER_COLOR"), "background-base", "border-color", "GENERAL BORDER COLOR CONTRAST", true)
    addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("BORDER_DISABLED"), "background-base", "border-disabled", "DISABLED BORDER CONTRAST", true)
    addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("ICON_WEAK_HOVER"), "background-base", "icon-weak-hover", "WEAK ICON HOVER CONTRAST", true)
    addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("ICON_STRONG_SELECTED"), "background-base", "icon-strong-selected", "STRONG ICON SELECTED CONTRAST", true)

    // --- LOG_33_SURFACE_TEXT_PAIRS ---
    const surfaceTypes = ["inset", "raised", "float"]
    surfaceTypes.forEach(s => {
      const bg = `surface-${s}-base`
      addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_BASE`), bg, "text-base", `TEXT ON ${s.toUpperCase()} SURFACE`, false)
      addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_WEAK`), bg, "text-weak", `WEAK TEXT ON ${s.toUpperCase()} SURFACE`, false)
      addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_STRONG`), bg, "text-strong", `STRONG TEXT ON ${s.toUpperCase()} SURFACE`, false)
    })
    if (themeColors["surface-inset-strong" as keyof OpencodeThemeColors]) {
      addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel("INSET_STRONG_TEXT"), "surface-inset-strong", "text-base", "TEXT ON INSET STRONG SURFACE", false)
    }

    // --- LOG_34_INTERACTIVE_SURFACE_PAIRS ---
    const detailedInteractiveSurfaces = ["brand", "interactive"]
    detailedInteractiveSurfaces.forEach(s => {
      const bg = `surface-${s}-base`
      addPair("LOG_34_INTERACTIVE_SURFACE_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT`), bg, `text-on-${s}-base`, `${s.toUpperCase()} TEXT ON SURFACE`, false)
      addPair("LOG_34_INTERACTIVE_SURFACE_PAIRS", formatAgentLabel(`${s.toUpperCase()}_ICON`), bg, `icon-on-${s}-base`, `${s.toUpperCase()} ICON ON SURFACE`, true)
    })

    // --- LOG_35_BUTTON_TEXT ---
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("SECONDARY_BUTTON_TEXT"), "button-secondary-base", "text-base", "SECONDARY BUTTON TEXT", false)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("DANGER_BUTTON_TEXT"), "button-danger-base", "text-on-critical-base", "DANGER BUTTON TEXT", false)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_TEXT"), "background-base", "text-base", "GHOST BUTTON TEXT (NORMAL)", false)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_HOVER_TEXT"), "button-ghost-hover", "text-base", "GHOST BUTTON TEXT (HOVER)", false)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("SECONDARY_BUTTON_HOVER_VS_BASE"), "button-secondary-base", "button-secondary-hover", "SECONDARY BUTTON HOVER VS BASE", true)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("DANGER_BUTTON_HOVER_VS_BASE"), "button-danger-base", "button-danger-hover", "DANGER BUTTON HOVER VS BASE", true)
    addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_HOVER_VS_BG"), "background-base", "button-ghost-hover", "GHOST BUTTON HOVER VS BACKGROUND", true)

    return pairs
  }, [themeColors, formatAgentLabel])

  const passCount = useMemo(() => wcagPairs.filter(p => p.score.pass).length, [wcagPairs])
  const failCount = useMemo(() => wcagPairs.filter(p => !p.score.pass).length, [wcagPairs])

  return { wcagPairs, formatAgentLabel, passCount, failCount }
}
