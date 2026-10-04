import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { UbicacionService } from '../../services/ubicacion.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
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
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';

@Component({
  selector: 'app-ubicacion-edit-dialog',
  imports: [
    DialogComponent,
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

  readonly visible = model(false);
  readonly location = input<CountryLocation | null>(null);

  readonly saved = output<void>();

  readonly literals = LITERALS.ubicacion;
  readonly sharedLiterals = LITERALS.shared;

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
    // Al abrir: se cargan los valores de la entrada (vacíos si es nueva) y, la primera vez, los países
    effect(() => {
      if (!this.visible()) return;
      const loc = this.location();
      untracked(() => {
        this.fillForm(loc);
        if (!this.countriesRequested) this.loadCountries();
      });
    });
  }

  private fillForm(loc: CountryLocation | null): void {
    this.country.set(loc?.country ?? '');
    this.album.set(loc?.album?.toString() ?? '');
    this.yearFrom.set(loc?.yearFrom?.toString() ?? '');
    this.yearTo.set(loc?.yearTo?.toString() ?? '');
    this.isClosed.set(loc?.isClosed ?? false);
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
      this.messageService.add(TOAST_MESSAGES.ubicacion.saveSuccess);
      this.saved.emit();
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loading.set(false);
    }
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
}
