import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { UbicacionService } from '../../services/ubicacion.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import {
  SelectComponent,
  SelectOption,
} from '../../../../shared/components/select/select.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import {
  CountryLocation,
  NewCountryLocation,
} from '../../../../shared/interfaces/country-location.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';

@Component({
  selector: 'app-ubicacion-edit-dialog',
  imports: [Dialog, ButtonComponent, TextInputComponent, SelectComponent, ToggleComponent],
  templateUrl: './ubicacion-edit-dialog.component.html',
  styleUrl: './ubicacion-edit-dialog.component.scss',
})
export class UbicacionEditDialogComponent {
  private service = inject(UbicacionService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  visible = input<boolean>(false);
  location = input<CountryLocation | null>(null);

  saved = output<void>();
  closed = output<void>();

  readonly literals = LITERALS.ubicacion;
  readonly sharedLiterals = LITERALS.shared;

  readonly country = signal('');
  readonly album = signal('');
  readonly yearFrom = signal('');
  readonly yearTo = signal('');
  readonly isClosed = signal(false);
  readonly loading = signal(false);

  readonly countryOptions = toSignal(
    this.service
      .getCountries()
      .pipe(map((countries): SelectOption[] => countries.map((c) => ({ label: c, value: c })))),
    { initialValue: [] as SelectOption[] },
  );

  readonly countryLocked = computed(() => this.location() !== null);

  readonly header = computed(() => {
    const loc = this.location();
    if (!loc) return this.literals.addCountry;
    if (!loc.id) return this.literals.addEntry;
    return this.literals.editEntry;
  });

  readonly canSubmit = computed(
    () => !!this.country() && !!this.album() && !!this.yearFrom() && !this.loading(),
  );

  constructor() {
    this.setupFormEffect();
  }

  protected async onSubmit(): Promise<void> {
    this.loading.set(true);
    try {
      const loc = this.location();
      if (loc?.id) {
        await this.service.update(loc.id, this.buildPayload());
      } else {
        await this.service.add(this.buildPayload());
      }
      this.messageService.add({ ...TOAST_MESSAGES.ubicacion.saveSuccess, life: 3000 });
      this.saved.emit();
      this.close();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.messageService.add({ ...TOAST_MESSAGES.ubicacion.saveError, life: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  protected onHide(): void {
    this.close();
  }

  private setupFormEffect(): void {
    effect(() => {
      const loc = this.location();
      this.country.set(loc?.country ?? '');
      this.album.set(loc?.album?.toString() ?? '');
      this.yearFrom.set(loc?.yearFrom?.toString() ?? '');
      this.yearTo.set(loc?.yearTo?.toString() ?? '');
      this.isClosed.set(loc?.isClosed ?? false);
    });
  }

  private buildPayload(): NewCountryLocation {
    return {
      country: this.country(),
      album: Number(this.album()),
      yearFrom: Number(this.yearFrom()),
      yearTo: this.yearTo() ? Number(this.yearTo()) : null,
      isClosed: this.isClosed(),
    };
  }

  private close(): void {
    this.loading.set(false);
    this.closed.emit();
  }
}
