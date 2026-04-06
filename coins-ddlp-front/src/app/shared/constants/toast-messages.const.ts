import { LITERALS } from './literals';

export const TOAST_MESSAGES = {
  euros: {
    saveSuccess:   { severity: 'success', summary: 'Guardado',   detail: LITERALS.euros.saveSuccess   },
    saveError:     { severity: 'error',   summary: 'Error',       detail: LITERALS.euros.saveError     },
    deleteSuccess: { severity: 'success', summary: 'Eliminado',   detail: LITERALS.euros.deleteSuccess },
    deleteError:   { severity: 'error',   summary: 'Error',       detail: LITERALS.euros.deleteError   },
  },
  auth: {
    loginSuccess:  { severity: 'success', summary: 'Bienvenido',  detail: LITERALS.auth.loginSuccess   },
    loginError:    { severity: 'error',   summary: 'Error',       detail: LITERALS.auth.loginError     },
    logoutSuccess: { severity: 'info',    summary: 'Hasta pronto',detail: LITERALS.auth.logoutSuccess  },
  },
} as const;
