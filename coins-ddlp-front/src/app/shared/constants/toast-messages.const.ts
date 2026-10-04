import { ToastMessageOptions } from 'primeng/api';
import { LITERALS } from './literals';

// Solo éxitos e info: los errores los muestra GlobalErrorHandler
const success = (detail: string): ToastMessageOptions => ({
  severity: 'success',
  summary: LITERALS.shared.toastSuccess,
  detail,
});

const info = (detail: string): ToastMessageOptions => ({
  severity: 'info',
  summary: LITERALS.shared.toastInfo,
  detail,
});

export const TOAST_MESSAGES = {
  euros: {
    saveSuccess: success(LITERALS.euros.saveSuccess),
    deleteSuccess: success(LITERALS.euros.deleteSuccess),
  },
  admin: {
    saveSuccess: success(LITERALS.admin.saveSuccess),
    deleteSuccess: success(LITERALS.admin.deleteSuccess),
  },
  auth: {
    loginSuccess: success(LITERALS.auth.loginSuccess),
    logoutSuccess: info(LITERALS.auth.logoutSuccess),
    recoverySuccess: success(LITERALS.auth.recoverySuccess),
  },
  pesetas: {
    saveSuccess: success(LITERALS.pesetas.saveSuccess),
  },
  herramientas: {
    addSuccess: success(LITERALS.herramientas.addSuccess),
    tiradaSuccess: (count: number) => success(`${count} ${LITERALS.herramientas.tiradaSuccess}`),
  },
  ubicacion: {
    saveSuccess: success(LITERALS.ubicacion.saveSuccess),
    deleteSuccess: success(LITERALS.ubicacion.deleteSuccess),
  },
} as const;
