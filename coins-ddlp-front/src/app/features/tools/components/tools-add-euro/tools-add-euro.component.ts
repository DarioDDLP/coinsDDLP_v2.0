import { Component, computed, effect, ErrorHandler, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { EurosService } from '../../../euros/services/euros.service';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import {
  SelectComponent,
  SelectOption,
} from '../../../../shared/components/select/select.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import {
  FACE_VALUE_OPTIONS,
  MINT_OPTIONS_GERMANY,
  VARIANT_FACE_VALUES,
  VARIANT_OPTIONS,
} from '../../tools.config';

@Component({
  selector: 'app-tools-add-euro',
  imports: [
    TextInputComponent,
    SelectComponent,
    ToggleComponent,
    ButtonComponent,
    SkeletonComponent,
  ],
  templateUrl: './tools-add-euro.component.html',
  styleUrl: './tools-add-euro.component.scss',
})
export class ToolsAddEuroComponent {
  private i18n = inject(I18nService);
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly literals = injectLiterals('herramientas');
  readonly faceValueOptions = FACE_VALUE_OPTIONS;
  readonly mintOptions = MINT_OPTIONS_GERMANY;
  readonly variantOptions = VARIANT_OPTIONS;

  readonly countryOptions = signal<SelectOption[]>([]);
  readonly isReady = signal(false);
  readonly country = signal('');
  readonly year = signal(0);
  readonly faceValue = signal('');
  readonly description = signal('');
  readonly commemorative = signal(false);
  readonly circulation = signal(true);
  readonly mint = signal('');
  readonly idNum = signal('');
  readonly variant = signal('');
  readonly loading = signal(false);

  readonly isMintRequired = computed(() => this.country() === 'Alemania');
  readonly isVariantApplicable = computed(() => VARIANT_FACE_VALUES.has(this.faceValue()));

  readonly isValid = computed(
    () =>
      !!this.country() &&
      this.year() > 0 &&
      !!this.faceValue() &&
      !!this.description() &&
      (!this.isMintRequired() || !!this.mint()),
  );

  constructor() {
    this.loadCountries();
    effect(() => {
      if (!this.isMintRequired()) this.mint.set('');
    });
    effect(() => {
      if (!this.isVariantApplicable()) this.variant.set('');
    });
  }

  private loadCountries(): void {
    this.eurosService.getAll().subscribe({
      next: (coins) => {
        const unique = [...new Set(coins.map((c) => c.country))].sort();
        this.countryOptions.set(unique.map((c) => ({ label: c, value: c })));
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.isReady.set(true);
      },
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) return;
    this.loading.set(true);
    try {
      await this.eurosService.create({
        country: this.country(),
        year: this.year(),
        faceValue: this.faceValue(),
        description: this.description(),
        commemorative: this.commemorative(),
        circulation: this.circulation(),
        mint: this.mint() || undefined,
        idNum: this.idNum(),
        variant: this.variant() || undefined,
      });
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.herramientas.addSuccess));
      this.resetForm();
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loading.set(false);
    }
  }

  private resetForm(): void {
    this.country.set('');
    this.year.set(0);
    this.faceValue.set('');
    this.description.set('');
    this.commemorative.set(false);
    this.circulation.set(true);
    this.mint.set('');
    this.idNum.set('');
    this.variant.set('');
  }
}
