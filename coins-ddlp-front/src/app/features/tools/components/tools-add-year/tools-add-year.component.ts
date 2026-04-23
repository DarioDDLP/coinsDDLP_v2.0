import { Component, computed, effect, ErrorHandler, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EurosService } from '../../../euros/services/euros.service';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { STANDARD_FACE_VALUES } from '../../tools.config';

@Component({
  selector: 'app-tools-add-year',
  imports: [TextInputComponent, SelectComponent, ButtonComponent],
  templateUrl: './tools-add-year.component.html',
  styleUrl: './tools-add-year.component.scss',
})
export class ToolsAddYearComponent {
  private eurosService   = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler   = inject(ErrorHandler);

  readonly literals = LITERALS.herramientas;

  private readonly allCoins = signal<{ country: string; year: number }[]>([]);

  readonly country    = signal('');
  readonly sourceYear = signal(0);
  readonly targetYear = signal(0);
  readonly loading    = signal(false);
  readonly errorMessage = signal('');

  readonly countryOptions = computed<SelectOption[]>(() => {
    const unique = [...new Set(this.allCoins().map(c => c.country))].sort();
    return unique.map(c => ({ label: c, value: c }));
  });

  readonly yearOptions = computed<SelectOption[]>(() => {
    const country = this.country();
    if (!country) return [];
    const unique = [...new Set(
      this.allCoins().filter(c => c.country === country).map(c => c.year)
    )].sort((a, b) => b - a);
    return unique.map(y => ({ label: y.toString(), value: y.toString() }));
  });

  readonly isValid = computed(() =>
    !!this.country() &&
    this.sourceYear() > 0 &&
    this.targetYear() > 0 &&
    this.targetYear() !== this.sourceYear()
  );

  constructor() {
    this.loadCoins();
    effect(() => {
      const years = this.yearOptions();
      this.sourceYear.set(years.length > 0 ? +years[0].value : 0);
    });
  }

  private loadCoins(): void {
    this.eurosService.getAll().subscribe({
      next: (coins) => this.allCoins.set(coins),
      error: (e) => this.errorHandler.handleError(e),
    });
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) return;
    this.errorMessage.set('');
    this.loading.set(true);
    try {
      const coins = await firstValueFrom(
        this.eurosService.getByCountryAndYear(this.country(), this.sourceYear())
      );
      const toCreate = coins.filter(c => STANDARD_FACE_VALUES.has(c.faceValue));

      if (toCreate.length === 0) {
        this.errorMessage.set(this.literals.tiradaEmpty);
        return;
      }

      await Promise.all(toCreate.map(c =>
        this.eurosService.create({
          country:       c.country,
          year:          this.targetYear(),
          faceValue:     c.faceValue,
          description:   c.description,
          uds:           0,
          conservation:  'ND',
          commemorative: c.commemorative,
          circulation:   c.circulation,
          mint:          c.mint,
          idNum:         c.idNum,
          observations:  undefined,
        })
      ));

      this.messageService.add({
        severity: 'success',
        summary: LITERALS.shared.toastSuccess,
        detail: `${toCreate.length} ${this.literals.tiradaSuccess}`,
        life: 4000,
      });
      this.resetForm();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.messageService.add({ ...TOAST_MESSAGES.herramientas.tiradaError, life: 3000 });
      this.errorMessage.set(this.literals.tiradaError);
    } finally {
      this.loading.set(false);
    }
  }

  private resetForm(): void {
    this.country.set('');
    this.sourceYear.set(0);
    this.targetYear.set(0);
  }
}
