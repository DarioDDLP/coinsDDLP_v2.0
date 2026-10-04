import { LITERALS } from './literals';

export const TOAST_MESSAGES = {
  euros: {
    saveSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.euros.saveSuccess,
    },
    deleteSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.euros.deleteSuccess,
    },
  },
  admin: {
    saveSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.admin.saveSuccess,
    },
    deleteSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.admin.deleteSuccess,
    },
  },
  auth: {
    loginSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.auth.loginSuccess,
    },
    logoutSuccess: {
      severity: 'info',
      summary: LITERALS.shared.toastInfo,
      detail: LITERALS.auth.logoutSuccess,
    },
    recoverySuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.auth.recoverySuccess,
    },
  },
  pesetas: {
    saveSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.pesetas.saveSuccess,
    },
  },
  herramientas: {
    addSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.herramientas.addSuccess,
    },
    addError: {
      severity: 'error',
      summary: LITERALS.shared.toastError,
      detail: LITERALS.herramientas.addError,
    },
    tiradaSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
    },
    tiradaError: {
      severity: 'error',
      summary: LITERALS.shared.toastError,
      detail: LITERALS.herramientas.tiradaError,
    },
  },
  ubicacion: {
    deleteSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.ubicacion.deleteSuccess,
    },
    saveSuccess: {
      severity: 'success',
      summary: LITERALS.shared.toastSuccess,
      detail: LITERALS.ubicacion.saveSuccess,
    },
  },
} as const;
