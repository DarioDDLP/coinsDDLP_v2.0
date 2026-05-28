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
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { FACE_VALUE_OPTIONS, MINT_OPTIONS_GERMANY } from '../../tools.config';

@Component({
  selector: 'app-tools-add-euro',
  imports: [TextInputComponent, SelectComponent, ToggleComponent, ButtonComponent],
  templateUrl: './tools-add-euro.component.html',
  styleUrl: './tools-add-euro.component.scss',
})
export class ToolsAddEuroComponent {
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly literals = LITERALS.herramientas;
  readonly faceValueOptions = FACE_VALUE_OPTIONS;
  readonly mintOptions = MINT_OPTIONS_GERMANY;

  readonly countryOptions = signal<SelectOption[]>([]);
  readonly country = signal('');
  readonly year = signal(0);
  readonly faceValue = signal('');
  readonly description = signal('');
  readonly commemorative = signal(false);
  readonly circulation = signal(true);
  readonly mint = signal('');
  readonly idNum = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly isMintRequired = computed(() => this.country() === 'Alemania');

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
  }

  private loadCountries(): void {
    this.eurosService.getAll().subscribe({
      next: (coins) => {
        const unique = [...new Set(coins.map((c) => c.country))].sort();
        this.countryOptions.set(unique.map((c) => ({ label: c, value: c })));
      },
      error: (e) => this.errorHandler.handleError(e),
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) return;
    this.errorMessage.set('');
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
      });
      this.messageService.add({ ...TOAST_MESSAGES.herramientas.addSuccess, life: 3000 });
      this.resetForm();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals.addError);
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
  }
}
