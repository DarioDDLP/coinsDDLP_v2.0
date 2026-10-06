import { ToastDefinition } from '../interfaces/translations.interface';

// Solo éxitos e info: los errores los muestra GlobalErrorHandler.
// Los textos se resuelven al lanzarlos: this.messageService.add(this.i18n.toast(TOAST_MESSAGES.x.y))
const success = (detailKey: string): ToastDefinition => ({
  severity: 'success',
  summaryKey: 'shared.toastSuccess',
  detailKey,
});

const info = (detailKey: string): ToastDefinition => ({
  severity: 'info',
  summaryKey: 'shared.toastInfo',
  detailKey,
});

export const TOAST_MESSAGES = {
  euros: {
    saveSuccess: success('euros.saveSuccess'),
    deleteSuccess: success('euros.deleteSuccess'),
  },
  admin: {
    saveSuccess: success('admin.saveSuccess'),
    deleteSuccess: success('admin.deleteSuccess'),
  },
  auth: {
    loginSuccess: success('auth.loginSuccess'),
    logoutSuccess: info('auth.logoutSuccess'),
    recoverySuccess: success('auth.recoverySuccess'),
  },
  pesetas: {
    saveSuccess: success('pesetas.saveSuccess'),
  },
  herramientas: {
    addSuccess: success('herramientas.addSuccess'),
    /** Con la cantidad delante: `this.i18n.toast(…tiradaSuccess, n)`. */
    tiradaSuccess: success('herramientas.tiradaSuccess'),
  },
  ubicacion: {
    saveSuccess: success('ubicacion.saveSuccess'),
    deleteSuccess: success('ubicacion.deleteSuccess'),
  },
} as const;
