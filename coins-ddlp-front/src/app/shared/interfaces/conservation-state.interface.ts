import { Severity } from './severity.interface';

export interface ConservationState {
  code: string;
  name: string;
  description: string;
  severity: Severity;
}
