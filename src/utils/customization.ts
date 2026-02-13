import type { NoteColor } from './helpers'

// ── Type Definitions ─────────────────────────────────────────────────

export type ThemeId = 'ivory' | 'pastel' | 'onyx' | 'ember'
export type CanvasType = 'dot-grid' | 'square-grid' | 'plain' | 'lined'
export type FontId = 'geist' | 'patrick-hand' | 'caveat' | 'jetbrains-mono'
export type LayoutMode = 'freeform' | 'grid' | 'radial' | 'timeline'

export interface CustomizationSettings {
  theme: ThemeId
  canvas: CanvasType
  font: FontId
  layout: LayoutMode
}

export interface CustomizationStore {
  global: CustomizationSettings
  boards: Record<string, Partial<CustomizationSettings>>
}

export const DEFAULT_SETTINGS: CustomizationSettings = {
  theme: 'ivory',
  canvas: 'dot-grid',
  font: 'geist',
  layout: 'freeform',
}

// ── Theme Definitions ────────────────────────────────────────────────

export interface ThemeConfig {
  id: ThemeId
  label: string
  isDark: boolean
  bg: string
  noteColors: Record<NoteColor, string>
  noteTopStrip: Record<NoteColor, string>
  text: string
  textMuted: string
  textPlaceholder: string
  toolbarBg: string
  toolbarBorder: string
  menuBg: string
  menuBorder: string
  menuHoverBg: string
  topBarBg: string
  dotColor: string
  gridColor: string
  gridDot: string
  lineColor: string
  fabBg: string
  fabColor: string
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  ivory: {
    id: 'ivory',
    label: 'Ivory',
    isDark: false,
    bg: '#fafaf8',
    noteColors: {
      yellow: '#fefcf0',
      pink: '#fef7f8',
      blue: '#f5f7fe',
      green: '#f5fef5',
      orange: '#fef7f0',
      purple: '#f8f5fe',
    },
    noteTopStrip: {
      yellow: '#f0ecd0',
      pink: '#f0d8e0',
      blue: '#d0ddf0',
      green: '#d0e8d0',
      orange: '#f0dcc0',
      purple: '#ddd0e8',
    },
    text: '#333',
    textMuted: '#999',
    textPlaceholder: '#bbb',
    toolbarBg: 'rgba(250,250,248,0.85)',
    toolbarBorder: 'rgba(0,0,0,0.06)',
    menuBg: 'rgba(255,255,255,0.95)',
    menuBorder: 'rgba(0,0,0,0.06)',
    menuHoverBg: 'rgba(0,0,0,0.04)',
    topBarBg: 'rgba(250,250,248,0.8)',
    dotColor: 'rgba(200,200,195,0.4)',
    gridColor: 'rgba(0,0,0,0.07)',
    gridDot: 'rgba(0,0,0,0.18)',
    lineColor: 'rgba(200,200,195,0.3)',
    fabBg: '#333',
    fabColor: '#fff',
  },
  pastel: {
    id: 'pastel',
    label: 'Pastel',
    isDark: false,
    bg: '#fefefe',
    noteColors: {
      yellow: '#fff9b1',
      pink: '#ffcce0',
      blue: '#d0e8ff',
      green: '#d4f5d4',
      orange: '#ffe0b2',
      purple: '#e8d5f5',
    },
    noteTopStrip: {
      yellow: '#f0e68c',
      pink: '#f0b0c8',
      blue: '#b0d0f0',
      green: '#b0e0b0',
      orange: '#f0c890',
      purple: '#d0b0e0',
    },
    text: '#333',
    textMuted: '#888',
    textPlaceholder: '#aaa',
    toolbarBg: 'rgba(255,255,255,0.85)',
    toolbarBorder: 'rgba(0,0,0,0.08)',
    menuBg: 'rgba(255,255,255,0.95)',
    menuBorder: 'rgba(0,0,0,0.06)',
    menuHoverBg: 'rgba(0,0,0,0.04)',
    topBarBg: 'rgba(255,255,255,0.8)',
    dotColor: 'rgba(180,180,180,0.3)',
    gridColor: 'rgba(0,0,0,0.06)',
    gridDot: 'rgba(0,0,0,0.16)',
    lineColor: 'rgba(180,180,180,0.25)',
    fabBg: '#333',
    fabColor: '#fff',
  },
  onyx: {
    id: 'onyx',
    label: 'Onyx',
    isDark: true,
    bg: '#0a0a0a',
    noteColors: {
      yellow: '#1e1e1e',
      pink: '#1c1c1c',
      blue: '#1a1a1a',
      green: '#1b1b1b',
      orange: '#1e1e1e',
      purple: '#1c1c1c',
    },
    noteTopStrip: {
      yellow: '#2e2e2e',
      pink: '#2c2c2c',
      blue: '#2a2a2a',
      green: '#2b2b2b',
      orange: '#2e2e2e',
      purple: '#2c2c2c',
    },
    text: '#e0e0e0',
    textMuted: '#777',
    textPlaceholder: '#555',
    toolbarBg: 'rgba(18,18,18,0.9)',
    toolbarBorder: 'rgba(255,255,255,0.08)',
    menuBg: 'rgba(20,20,20,0.95)',
    menuBorder: 'rgba(255,255,255,0.08)',
    menuHoverBg: 'rgba(255,255,255,0.05)',
    topBarBg: 'rgba(12,12,12,0.85)',
    dotColor: 'rgba(60,60,60,0.5)',
    gridColor: 'rgba(255,255,255,0.06)',
    gridDot: 'rgba(255,255,255,0.25)',
    lineColor: 'rgba(60,60,60,0.4)',
    fabBg: '#2a2a2a',
    fabColor: '#e0e0e0',
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    isDark: true,
    bg: '#1a1816',
    noteColors: {
      yellow: '#2e2a1e',
      pink: '#2a2220',
      blue: '#222825',
      green: '#242a20',
      orange: '#2e2820',
      purple: '#28222a',
    },
    noteTopStrip: {
      yellow: '#3e3828',
      pink: '#3a3030',
      blue: '#303835',
      green: '#323a2e',
      orange: '#3e3628',
      purple: '#38303a',
    },
    text: '#d4cfc8',
    textMuted: '#8a8580',
    textPlaceholder: '#605b55',
    toolbarBg: 'rgba(30,28,24,0.9)',
    toolbarBorder: 'rgba(255,255,255,0.06)',
    menuBg: 'rgba(28,26,22,0.95)',
    menuBorder: 'rgba(255,255,255,0.06)',
    menuHoverBg: 'rgba(255,255,255,0.04)',
    topBarBg: 'rgba(26,24,20,0.85)',
    dotColor: 'rgba(70,65,55,0.5)',
    gridColor: 'rgba(255,240,220,0.06)',
    gridDot: 'rgba(255,240,220,0.22)',
    lineColor: 'rgba(70,65,55,0.4)',
    fabBg: '#3a3530',
    fabColor: '#d4cfc8',
  },
}

// ── Font Definitions ─────────────────────────────────────────────────

export interface FontConfig {
  id: FontId
  label: string
  family: string
  fallback: string
  googleFont?: string
  sampleText: string
}

export const FONTS: Record<FontId, FontConfig> = {
  geist: {
    id: 'geist',
    label: 'Geist',
    family: 'Inter',
    fallback: 'system-ui, -apple-system, sans-serif',
    googleFont: 'Inter:wght@400;600',
    sampleText: 'Clean & modern sans-serif',
  },
  'patrick-hand': {
    id: 'patrick-hand',
    label: 'Patrick Hand',
    family: 'Patrick Hand',
    fallback: 'cursive',
    googleFont: 'Patrick+Hand',
    sampleText: 'Friendly handwritten feel',
  },
  caveat: {
    id: 'caveat',
    label: 'Caveat',
    family: 'Caveat',
    fallback: 'cursive',
    sampleText: 'Casual handwriting style',
  },
  'jetbrains-mono': {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: 'JetBrains Mono',
    fallback: 'monospace',
    googleFont: 'JetBrains+Mono:wght@400;600',
    sampleText: 'Developer monospace font',
  },
}

// ── Canvas Definitions ───────────────────────────────────────────────

export interface CanvasConfig {
  id: CanvasType
  label: string
}

export const CANVAS_TYPES: Record<CanvasType, CanvasConfig> = {
  'dot-grid': { id: 'dot-grid', label: 'Dot Grid' },
  'square-grid': { id: 'square-grid', label: 'Square Grid' },
  plain: { id: 'plain', label: 'Plain' },
  lined: { id: 'lined', label: 'Lined' },
}

// ── Layout Definitions ───────────────────────────────────────────────

export interface LayoutConfig {
  id: LayoutMode
  label: string
}

export const LAYOUTS: Record<LayoutMode, LayoutConfig> = {
  freeform: { id: 'freeform', label: 'Freeform' },
  grid: { id: 'grid', label: 'Grid' },
  radial: { id: 'radial', label: 'Radial' },
  timeline: { id: 'timeline', label: 'Timeline' },
}

// ── Helpers ──────────────────────────────────────────────────────────

export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES[id]
}

export function getFontFamily(id: FontId): string {
  const font = FONTS[id]
  return `'${font.family}', ${font.fallback}`
}

export function loadGoogleFonts(fontIds: FontId[]) {
  const families = fontIds
    .map((id) => FONTS[id].googleFont)
    .filter(Boolean)

  if (families.length === 0) return

  const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`
  const existing = document.querySelector('link[data-stikie-fonts]')
  if (existing && existing.getAttribute('href') === href) return
  if (existing) existing.remove()

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-stikie-fonts', 'true')
  document.head.appendChild(link)
}

export function applyThemeToDOM(themeId: ThemeId) {
  const theme = THEMES[themeId]
  const root = document.documentElement

  document.body.style.backgroundColor = theme.bg

  if (theme.isDark) {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }

  root.style.setProperty('--theme-dot-color', theme.dotColor)
  root.style.setProperty('--theme-grid-color', theme.gridColor)
  root.style.setProperty('--theme-grid-dot', theme.gridDot)
  root.style.setProperty('--theme-line-color', theme.lineColor)
  root.style.setProperty('--theme-bg', theme.bg)
}

// Layout calculation functions
export function calculateGridLayout(
  noteCount: number,
  canvasX: number,
  canvasY: number,
  zoom: number,
): { x: number; y: number }[] {
  const NOTE_W = 220
  const NOTE_H = 180
  const GAP = 30
  const cols = Math.max(1, Math.floor(Math.sqrt(noteCount * 1.5)))
  const totalW = cols * NOTE_W + (cols - 1) * GAP
  const rows = Math.ceil(noteCount / cols)
  const totalH = rows * NOTE_H + (rows - 1) * GAP

  const viewCenterX = (-canvasX + window.innerWidth / 2) / zoom
  const viewCenterY = (-canvasY + window.innerHeight / 2) / zoom
  const startX = viewCenterX - totalW / 2
  const startY = viewCenterY - totalH / 2

  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < noteCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    positions.push({
      x: startX + col * (NOTE_W + GAP),
      y: startY + row * (NOTE_H + GAP),
    })
  }
  return positions
}

export function calculateRadialLayout(
  noteCount: number,
  canvasX: number,
  canvasY: number,
  zoom: number,
): { x: number; y: number }[] {
  const viewCenterX = (-canvasX + window.innerWidth / 2) / zoom
  const viewCenterY = (-canvasY + window.innerHeight / 2) / zoom

  if (noteCount === 1) {
    return [{ x: viewCenterX - 110, y: viewCenterY - 90 }]
  }

  const positions: { x: number; y: number }[] = []
  const radius = Math.max(200, noteCount * 30)
  const angleStep = (2 * Math.PI) / noteCount

  for (let i = 0; i < noteCount; i++) {
    const angle = angleStep * i - Math.PI / 2
    positions.push({
      x: viewCenterX + Math.cos(angle) * radius - 110,
      y: viewCenterY + Math.sin(angle) * radius - 90,
    })
  }
  return positions
}

export function calculateTimelineLayout(
  noteCount: number,
  canvasX: number,
  canvasY: number,
  zoom: number,
): { x: number; y: number }[] {
  const NOTE_W = 220
  const GAP = 40
  const viewCenterX = (-canvasX + window.innerWidth / 2) / zoom
  const viewCenterY = (-canvasY + window.innerHeight / 2) / zoom
  const totalW = noteCount * NOTE_W + (noteCount - 1) * GAP
  const startX = viewCenterX - totalW / 2

  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < noteCount; i++) {
    positions.push({
      x: startX + i * (NOTE_W + GAP),
      y: viewCenterY - 90,
    })
  }
  return positions
}
