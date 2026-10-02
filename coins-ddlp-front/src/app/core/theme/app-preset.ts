import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** Clase en <html> que activa el esquema oscuro de PrimeNG (siempre presente). */
export const DARK_MODE_SELECTOR = '.app-dark';

/**
 * Preset "medianoche + oro" sobre Aura.
 * Las escalas reflejan los tokens de src/styles/_variables.scss:
 * surface.950 = --bg · 900 = --surface-1 · 800 = --surface-2 · 700 = --border.
 */
export const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
      color: 'light-dark({primary.500}, {primary.500})',
      contrastColor: 'light-dark(#ffffff, #ffffff)',
      hoverColor: 'light-dark({primary.600}, {primary.400})',
      activeColor: 'light-dark({primary.700}, {primary.300})',
    },
    surface: {
      0: '#ffffff',
      50: '#e6eaf2',
      100: '#c3ccdd',
      200: '#aeb8cc',
      300: '#8b97b0',
      400: '#6e7a94',
      500: '#5c6782',
      600: '#3b4c74',
      700: '#263352',
      800: '#1a2438',
      900: '#121a2b',
      950: '#0b0f1a',
    },
    typography: {
      fontSize: '0.875rem',
    },
    formField: {
      paddingX: '0.875rem',
      paddingY: '0.625rem',
      borderRadius: '10px',
      background: 'light-dark({surface.0}, {surface.900})',
      borderColor: 'light-dark({surface.300}, {surface.700})',
      hoverBorderColor: 'light-dark({surface.400}, {surface.600})',
      focusBorderColor: '{primary.color}',
      color: 'light-dark({surface.700}, {surface.50})',
      placeholderColor: 'light-dark({surface.500}, {surface.500})',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: '0 0 0 3px rgba(59, 130, 246, 0.35)',
      },
    },
    highlight: {
      background: 'light-dark({primary.50}, rgba(59, 130, 246, 0.16))',
      focusBackground: 'light-dark({primary.100}, rgba(59, 130, 246, 0.24))',
      color: 'light-dark({primary.700}, {primary.300})',
      focusColor: 'light-dark({primary.800}, {primary.200})',
    },
    content: {
      background: 'light-dark({surface.0}, {surface.900})',
      hoverBackground: 'light-dark({surface.100}, {surface.800})',
      borderColor: 'light-dark({surface.200}, #1e2942)',
    },
    text: {
      color: 'light-dark({surface.700}, {surface.50})',
      hoverColor: 'light-dark({surface.800}, {surface.0})',
      mutedColor: 'light-dark({surface.500}, {surface.300})',
      hoverMutedColor: 'light-dark({surface.600}, {surface.100})',
    },
    mask: {
      background: 'light-dark(rgba(0,0,0,0.4), rgba(4, 7, 14, 0.62))',
    },
  },
});
