import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { LITERALS } from './literals';

export const OWNERSHIP_FILTER_OPTIONS: FilterPillOption[] = [
  { value: 'all', label: LITERALS.shared.all },
  { value: 'owned', label: LITERALS.shared.filterOwned },
  { value: 'missing', label: LITERALS.shared.filterMissing },
];
