import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { Translations } from '../interfaces/translations.interface';

export function getOwnerFilterOptions(t: Translations['shared']): FilterPillOption[] {
  return [
    { value: 'dario', label: t.ownerDario },
    { value: 'manolo', label: t.ownerManolo },
    { value: 'both', label: t.ownerBoth },
  ];
}
