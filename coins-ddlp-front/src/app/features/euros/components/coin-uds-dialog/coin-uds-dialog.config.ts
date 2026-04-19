import { SelectOption } from '../../../../shared/components/select/select.component';
import { CONSERVATION_STATES } from '../../../../shared/constants/conservation-states.const';

export const CONSERVATION_OPTIONS: SelectOption[] = CONSERVATION_STATES.map(s => ({
  label: `${s.code} — ${s.name}`,
  value: s.code,
}));
