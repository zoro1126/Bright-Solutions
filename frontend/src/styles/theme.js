// Central Design Tokens for Bright Solutions (Aligned with Medlink Warm Amber Layout Language)
export const tokens = {
  colors: {
    primary: {
      amber: '#FFC21A',
      amberHover: '#F5A300',
      amberPressed: '#E08A00',
      amberHighlight: '#FFE500',
      contrastText: '#0A2540',
    },
    surfaces: {
      canvas: '#FFFDF8',
      container: '#FAF6EC',
      card: '#FFFFFF',
      hairline: '#EAE4D3',
      strip: '#FFF7E0',
      stripBorder: '#FFEDB8',
      badgeTint: '#FFE08A',
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
      50: '#FAF6EC',
    },
    ochre: {
      base: '#B89C14',
      dark: '#8A740C',
      light: '#FFF7E0',
    },
    alert: {
      red: '#DC2626',
      redSurface: '#FEE2E2',
      redText: '#B91C1C',
    },
    semantic: {
      completed: { bg: '#E6F7ED', text: '#047857', border: '#A7F3D0' },
      scheduled: { bg: '#FFF7E0', text: '#8A740C', border: '#FFEDB8' },
      waiting: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
      crisis: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
    },
    chart: {
      series1: '#0A2540', // Navy
      series2: '#FFC21A', // Amber
      series3: '#B89C14', // Ochre
      series4: '#E7E2D6', // Warm light gray
    }
  },
  typography: {
    fontSans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
  },
  radii: {
    container: '32px',
    card: '24px',
    pill: '9999px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  shadows: {
    flat: 'none',
    card: '0 1px 2px 0 rgba(10, 37, 64, 0.02)',
    amberGlow: '0 0 0 3px rgba(255, 194, 26, 0.4)',
  }
};
