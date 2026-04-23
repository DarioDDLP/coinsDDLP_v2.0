import { SelectOption } from '../../../../shared/components/select/select.component';
import { CONSERVATION_STATES } from '../../../../shared/constants/conservation-states.const';

export const FACE_VALUE_OPTIONS: SelectOption[] = [
  '1 Céntimo', '2 Céntimos', '5 Céntimos',
  '10 Céntimos', '20 Céntimos', '50 Céntimos',
  '1 Euro', '2 Euros', '2 Euros C',
].map(v => ({ label: v, value: v }));

export const CONSERVATION_OPTIONS: SelectOption[] = CONSERVATION_STATES.map(s => ({
  label: `${s.code} — ${s.name}`,
  value: s.code,
}));

export const MINT_OPTIONS_GERMANY: SelectOption[] = [
  { label: 'A — Berlín',    value: 'A' },
  { label: 'D — Múnich',    value: 'D' },
  { label: 'F — Stuttgart', value: 'F' },
  { label: 'G — Karlsruhe', value: 'G' },
  { label: 'J — Hamburgo',  value: 'J' },
];
