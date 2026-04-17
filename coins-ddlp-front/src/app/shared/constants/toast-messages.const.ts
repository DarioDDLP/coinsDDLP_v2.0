import { LITERALS } from './literals';

export const TOAST_MESSAGES = {
  euros: {
    saveSuccess:   { severity: 'success', summary: LITERALS.shared.toastSuccess, detail: LITERALS.euros.saveSuccess   },
    saveError:     { severity: 'error',   summary: LITERALS.shared.toastError,   detail: LITERALS.euros.saveError     },
    deleteSuccess: { severity: 'success', summary: LITERALS.shared.toastSuccess, detail: LITERALS.euros.deleteSuccess },
    deleteError:   { severity: 'error',   summary: LITERALS.shared.toastError,   detail: LITERALS.euros.deleteError   },
  },
  admin: {
    saveSuccess:   { severity: 'success', summary: LITERALS.shared.toastSuccess, detail: LITERALS.admin.saveSuccess   },
    saveError:     { severity: 'error',   summary: LITERALS.shared.toastError,   detail: LITERALS.admin.saveError     },
    deleteSuccess: { severity: 'success', summary: LITERALS.shared.toastSuccess, detail: LITERALS.admin.deleteSuccess },
    deleteError:   { severity: 'error',   summary: LITERALS.shared.toastError,   detail: LITERALS.admin.deleteError   },
  },
  auth: {
    loginSuccess:  { severity: 'success', summary: LITERALS.shared.toastSuccess, detail: LITERALS.auth.loginSuccess  },
    loginError:    { severity: 'error',   summary: LITERALS.shared.toastError,   detail: LITERALS.auth.loginError    },
    logoutSuccess: { severity: 'info',    summary: LITERALS.shared.toastInfo,    detail: LITERALS.auth.logoutSuccess },
  },
} as const;
