import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
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
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import {
  CountryLocation,
  NewCountryLocation,
} from '../../../../shared/interfaces/country-location.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { DIALOG_BREAKPOINTS } from '../../../../shared/constants/dialog.const';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';

@Component({
  selector: 'app-ubicacion-edit-dialog',
  imports: [
    Dialog,
    ButtonComponent,
    TextInputComponent,
    SelectComponent,
    ToggleComponent,
    SkeletonComponent,
  ],
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
  readonly dialogBreakpoints = DIALOG_BREAKPOINTS;

  readonly country = signal('');
  readonly album = signal('');
  readonly yearFrom = signal('');
  readonly yearTo = signal('');
  readonly isClosed = signal(false);
  readonly loading = signal(false);

  /** Países del catálogo: se piden la primera vez que se abre el diálogo, no al montar la vista. */
  readonly countryOptions = signal<SelectOption[]>([]);
  readonly countriesReady = signal(false);
  private countriesRequested = false;

  readonly countryLocked = computed(() => this.location() !== null);

  readonly header = computed(() =>
    this.location() ? this.literals.editEntry : this.literals.addCountry,
  );

  readonly canSubmit = computed(
    () => !!this.country() && !!this.album() && !!this.yearFrom() && !this.loading(),
  );

  constructor() {
    this.setupFormEffect();
    effect(() => {
      if (this.visible() && !this.countriesRequested) untracked(() => this.loadCountries());
    });
  }

  private loadCountries(): void {
    this.countriesRequested = true;
    this.countriesReady.set(false);
    this.service.getCountries().subscribe({
      next: (countries) => {
        this.countryOptions.set(countries.map((c) => ({ label: c, value: c })));
        this.countriesReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        // Se reintenta la próxima vez que se abra el diálogo
        this.countriesRequested = false;
        this.countriesReady.set(true);
      },
    });
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
