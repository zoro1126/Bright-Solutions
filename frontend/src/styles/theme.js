// Central Design Tokens for Bright Solutions (Single source of truth)
export const tokens = {
  colors: {
    primary: {
      yellow: '#FFE500',
      yellowHover: '#FACC15',
      yellowPressed: '#EAB308',
      yellowWash: 'rgba(255, 229, 0, 0.12)',
      contrastText: '#051A30',
    },
    navy: {
      950: '#051A30',
      900: '#0A2540',
      800: '#0F355A',
      700: '#1B456E',
      600: '#335C85',
      400: '#64748B',
      300: '#94A3B8',
      200: '#CBD5E1',
      100: '#E2E8F0',
      50: '#F6F7FA',
    },
    gold: {
      base: '#B89C14',
      dark: '#8A740C',
      light: '#FEF9C3',
    },
    alert: {
      red: '#DC2626',
      redRing: 'rgba(220, 38, 38, 0.25)',
      redSurface: '#FEF2F2',
      redBorder: '#FECACA',
    },
    clinical: {
      normal: { fill: '#10B981', text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
      elevated: { fill: '#F59E0B', text: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
      stage1: { fill: '#EA580C', text: '#9A3412', bg: '#FFF7ED', border: '#FED7AA' },
      stage2: { fill: '#DC2626', text: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
      crisis: { fill: '#991B1B', text: '#7F1D1D', bg: '#450A0A', border: '#DC2626' },
      info: { fill: '#0284C7', text: '#075985', bg: '#F0F9FF', border: '#BAE6FD' },
    }
  },
  typography: {
    fontSans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '22px',
    full: '9999px'
  },
  shadows: {
    card: '0 1px 3px 0 rgba(10, 37, 64, 0.04), 0 1px 2px -1px rgba(10, 37, 64, 0.04)',
    elevated: '0 4px 6px -1px rgba(10, 37, 64, 0.06), 0 2px 4px -2px rgba(10, 37, 64, 0.04)',
    drawer: '0 20px 25px -5px rgba(10, 37, 64, 0.14), 0 8px 10px -6px rgba(10, 37, 64, 0.08)',
    yellowGlow: '0 0 0 3px rgba(255, 229, 0, 0.45)',
    criticalGlow: '0 0 0 4px rgba(220, 38, 38, 0.28)',
  }
};
