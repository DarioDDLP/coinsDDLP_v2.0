import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { LITERALS } from './literals';

export const OWNER_FILTER_OPTIONS: FilterPillOption[] = [
  { value: 'dario', label: LITERALS.shared.ownerDario },
  { value: 'manolo', label: LITERALS.shared.ownerManolo },
  { value: 'both', label: LITERALS.shared.ownerBoth },
];
