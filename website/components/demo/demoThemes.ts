export interface DemoTheme {
  id: 'vibedark' | 'catppuccin' | 'tokyonight' | 'nord' | 'cyberpunk';
  name: string;
  subtitle: string;
  bgCanvas: string;
  bgCard: string;
  bgHeader: string;
  bgFooter: string;
  border: string;
  borderActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  tagColor: string;
  previewColors: string[];
}

export const DEMO_THEMES: Record<DemoTheme['id'], DemoTheme> = {
  vibedark: {
    id: 'vibedark',
    name: 'VibeDark',
    subtitle: 'Electric Iris & Ember Pulse on Obsidian Void',
    bgCanvas: '#090a0c',
    bgCard: '#111111',
    bgHeader: '#090a0c',
    bgFooter: '#0e0e10',
    border: '#4a4b50',
    borderActive: '#5683da',
    textPrimary: '#ffffff',
    textSecondary: '#a9a9aa',
    textMuted: '#6b6c6d',
    accentPrimary: '#5683da',
    accentSecondary: '#ff8964',
    accentSuccess: '#27c93f',
    accentWarning: '#ffbd2e',
    tagColor: 'bg-[#111111] text-[#5683da] border-[#5683da]/40',
    previewColors: ['#5683da', '#ff8964', '#090a0c', '#111111'],
  },
  catppuccin: {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    subtitle: 'Soothing pastel dark theme with Mauve & Sapphire',
    bgCanvas: '#11111b',
    bgCard: '#181825',
    bgHeader: '#11111b',
    bgFooter: '#1e1e2e',
    border: '#313244',
    borderActive: '#cba6f7',
    textPrimary: '#cdd6f4',
    textSecondary: '#a6adc8',
    textMuted: '#6c7086',
    accentPrimary: '#cba6f7',
    accentSecondary: '#f2cdcd',
    accentSuccess: '#a6e3a1',
    accentWarning: '#f9e2af',
    tagColor: 'bg-[#1e1e2e] text-[#cba6f7] border-[#cba6f7]/40',
    previewColors: ['#cba6f7', '#74c7ec', '#11111b', '#181825'],
  },
  tokyonight: {
    id: 'tokyonight',
    name: 'Tokyo Night',
    subtitle: 'Clean dark theme celebrating downtown neon nights',
    bgCanvas: '#16161e',
    bgCard: '#1a1b26',
    bgHeader: '#16161e',
    bgFooter: '#1f2335',
    border: '#292e42',
    borderActive: '#7aa2f7',
    textPrimary: '#c0caf5',
    textSecondary: '#9aa5ce',
    textMuted: '#565f89',
    accentPrimary: '#7aa2f7',
    accentSecondary: '#bb9af7',
    accentSuccess: '#9ece6a',
    accentWarning: '#e0af68',
    tagColor: 'bg-[#1f2335] text-[#7aa2f7] border-[#7aa2f7]/40',
    previewColors: ['#7aa2f7', '#bb9af7', '#16161e', '#1a1b26'],
  },
  nord: {
    id: 'nord',
    name: 'Nord',
    subtitle: 'Arctic, north-bluish clean cold palette',
    bgCanvas: '#242933',
    bgCard: '#2e3440',
    bgHeader: '#242933',
    bgFooter: '#3b4252',
    border: '#434c5e',
    borderActive: '#88c0d0',
    textPrimary: '#eceff4',
    textSecondary: '#d8dee9',
    textMuted: '#4c566a',
    accentPrimary: '#88c0d0',
    accentSecondary: '#81a1c1',
    accentSuccess: '#a3be8c',
    accentWarning: '#ebcb8b',
    tagColor: 'bg-[#3b4252] text-[#88c0d0] border-[#88c0d0]/40',
    previewColors: ['#88c0d0', '#81a1c1', '#242933', '#2e3440'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    subtitle: 'High-voltage high-contrast neon yellow & laser cyan',
    bgCanvas: '#08090c',
    bgCard: '#0e1117',
    bgHeader: '#08090c',
    bgFooter: '#141923',
    border: '#273344',
    borderActive: '#fcee0a',
    textPrimary: '#fcee0a',
    textSecondary: '#00f0ff',
    textMuted: '#708298',
    accentPrimary: '#fcee0a',
    accentSecondary: '#ff003c',
    accentSuccess: '#00f0ff',
    accentWarning: '#ff7700',
    tagColor: 'bg-[#141923] text-[#fcee0a] border-[#fcee0a]/50',
    previewColors: ['#fcee0a', '#00f0ff', '#08090c', '#0e1117'],
  },
};
