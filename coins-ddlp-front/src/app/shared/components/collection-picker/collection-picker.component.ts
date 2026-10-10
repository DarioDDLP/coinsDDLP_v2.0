import { Component, computed, input, output } from '@angular/core';
import { SelectComponent, SelectOption } from '../select/select.component';
import { Owner } from '../../interfaces/owner.interface';
import { injectLiterals } from '../../services/i18n.service';

/** Selector de colección: la principal y, opcionalmente, otra para comparar (solo dos a la vez). */
@Component({
  selector: 'app-collection-picker',
  imports: [SelectComponent],
  templateUrl: './collection-picker.component.html',
  styleUrl: './collection-picker.component.scss',
})
export class CollectionPickerComponent {
  readonly owners = input<Owner[]>([]);
  readonly primary = input<string | null>(null);
  readonly compare = input<string | null>(null);

  readonly primaryChange = output<string>();
  /** `null` = sin comparar. */
  readonly compareChange = output<string | null>();

  readonly literals = injectLiterals('shared');

  readonly primaryOptions = computed<SelectOption[]>(() =>
    this.owners().map((o) => ({ label: o.name, value: o.id })),
  );

  readonly compareOptions = computed<SelectOption[]>(() => [
    { label: this.literals().compareNone, value: '' },
    ...this.owners()
      .filter((o) => o.id !== this.primary())
      .map((o) => ({ label: o.name, value: o.id })),
  ]);

  onCompareChange(value: string | null): void {
    this.compareChange.emit(value || null);
  }
}
