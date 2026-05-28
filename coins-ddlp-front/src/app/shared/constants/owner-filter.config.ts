import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { LITERALS } from './literals';

export const OWNER_FILTER_OPTIONS: FilterPillOption[] = [
  { value: 'dario', label: LITERALS.shared.ownerDario },
  { value: 'manolo', label: LITERALS.shared.ownerManolo },
  { value: 'ambas', label: LITERALS.shared.ownerBoth },
];
