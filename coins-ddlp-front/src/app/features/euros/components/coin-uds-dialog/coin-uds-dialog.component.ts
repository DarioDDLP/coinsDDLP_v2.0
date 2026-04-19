import { Component, effect, ErrorHandler, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { EurosService } from '../../services/euros.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ConservationCode, EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CONSERVATION_OPTIONS } from './coin-uds-dialog.config';

@Component({
  selector: 'app-coin-uds-dialog',
  imports: [Dialog, ButtonComponent, TextInputComponent, SelectComponent, TextareaComponent],
  templateUrl: './coin-uds-dialog.component.html',
  styleUrl: './coin-uds-dialog.component.scss',
})
export class CoinUdsDialogComponent {
  private eurosService  = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler  = inject(ErrorHandler);

  visible = input<boolean>(false);
  coin    = input<EuroCoin | null>(null);

  saved  = output<void>();
  closed = output<void>();

  readonly literals       = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;
  readonly conservationOptions = CONSERVATION_OPTIONS;

  readonly uds          = signal(0);
  readonly conservation = signal<ConservationCode>('ND');
  readonly observations = signal('');
  readonly loading      = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    effect(() => {
      const c = this.coin();
      this.uds.set(c?.uds ?? 0);
      this.conservation.set(c?.conservation ?? 'ND');
      this.observations.set(c?.observations ?? '');
      this.errorMessage.set('');
    });
  }

  async onSubmit(): Promise<void> {
    const coin = this.coin();
    if (!coin) return;

    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.eurosService.update(coin.id, {
        uds: this.uds(),
        conservation: this.conservation(),
        observations: this.observations(),
      });
      this.messageService.add({ ...TOAST_MESSAGES.euros.saveSuccess, life: 3000 });
      this.saved.emit();
      this.close();
    } catch (e) {
      this.errorHandler.handleError(e);
      this.errorMessage.set(this.literals.saveError);
    } finally {
      this.loading.set(false);
    }
  }

  onHide(): void {
    this.close();
  }

  private close(): void {
    this.errorMessage.set('');
    this.loading.set(false);
    this.closed.emit();
  }
}
