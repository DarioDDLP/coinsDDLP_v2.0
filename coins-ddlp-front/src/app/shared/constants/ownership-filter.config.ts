import { FilterPillOption } from '../components/filter-pills/filter-pills.component';
import { Translations } from '../interfaces/translations.interface';

/** `withRepeated`: añade "Repetidas" (euros, donde hay intercambios). */
export function getOwnershipFilterOptions(
  t: Translations['shared'],
  withRepeated = false,
): FilterPillOption[] {
  return [
    { value: 'all', label: t.all },
    { value: 'owned', label: t.filterOwned },
    { value: 'missing', label: t.filterMissing },
    ...(withRepeated ? [{ value: 'repeated', label: t.filterRepeated }] : []),
  ];
}
