import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { Translations } from '../interfaces/translations.interface';

export function getOwnershipFilterOptions(t: Translations['shared']): FilterPillOption[] {
  return [
    { value: 'all', label: t.all },
    { value: 'owned', label: t.filterOwned },
    { value: 'missing', label: t.filterMissing },
  ];
}
