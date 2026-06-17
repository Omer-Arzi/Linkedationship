import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0A66C2',
      light: '#378FE9',
    },
    success: {
      main: '#057642',
    },
    error: {
      main: '#CC1016',
    },
    background: {
      default: '#E8EFF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2433',
      secondary: '#5D7A96',
    },
    divider: '#C2D3E5',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': {
          height: '100%',
          overflow: 'hidden',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
  },
})

// Export the raw CSS variable values for use in sx props / inline styles
export const C = {
  bg:        '#E8EFF7',
  bgSurface: '#FFFFFF',
  bgNav:     '#16304F',
  bgNav2:    '#1E3D60',
  bgNav3:    '#254A73',
  border:    '#C2D3E5',
  borderNav: '#1F3D5E',
  text:      '#1A2433',
  muted:     '#5D7A96',
  navText:   '#A8C4DC',
  navActive: '#FFFFFF',
  blue:      '#0A66C2',
  blueLight: '#378FE9',
  green:     '#057642',
  red:       '#CC1016',
  yellow:    '#B06A00',
  purple:    '#6B2FBE',
  logBg:     '#0C1929',
  logText:   '#B8CCDC',
  logMuted:  '#4A6A85',
  logGreen:  '#2EA84D',
  logRed:    '#F05050',
  logYellow: '#D4A017',
  logPurple: '#A67FD4',
  logBlue:   '#5BA3E0',
  logCyan:   '#3DB8C8',
  logSystem: '#2A6A8A',
}

export default theme
