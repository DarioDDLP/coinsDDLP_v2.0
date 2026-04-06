export interface ConservationState {
  code: string;
  name: string;
  description: string;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
}
