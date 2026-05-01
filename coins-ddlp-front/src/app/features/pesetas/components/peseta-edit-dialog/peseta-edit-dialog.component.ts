import { Component, computed, effect, ErrorHandler, inject, input, output, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { PesetasService } from '../../services/pesetas.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CONSERVATION_OPTIONS } from '../../../../shared/constants/conservation-states.const';

@Component({
  selector: 'app-peseta-edit-dialog',
  imports: [Dialog, ButtonComponent, TextInputComponent, SelectComponent, TextareaComponent],
  templateUrl: './peseta-edit-dialog.component.html',
  styleUrl: './peseta-edit-dialog.component.scss',
})
export class PesetaEditDialogComponent {
  private pesetasService  = inject(PesetasService);
  private messageService  = inject(MessageService);
  private errorHandler    = inject(ErrorHandler);

  visible = input<boolean>(false);
  peseta  = input<Peseta | null>(null);

  saved  = output<void>();
  closed = output<void>();

  readonly literals       = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;

  readonly uds          = signal(0);
  readonly conservation = signal('ND');
  readonly observations = signal('');
  readonly loading      = signal(false);
  readonly errorMessage = signal('');

  readonly isConservationLocked = computed(() => this.uds() === 0);

  readonly availableConservationOptions = computed(() =>
    this.isConservationLocked()
      ? CONSERVATION_OPTIONS
      : CONSERVATION_OPTIONS.filter(o => o.value !== 'ND')
  );

  constructor() {
    effect(() => {
      const p = this.peseta();
      this.uds.set(p?.uds ?? 0);
      this.conservation.set(p?.conservation ?? 'ND');
      this.observations.set(p?.observations ?? '');
      this.errorMessage.set('');
    });

    effect(() => {
      if (this.isConservationLocked()) {
        this.conservation.set('ND');
      } else if (this.conservation() === 'ND') {
        this.conservation.set('');
      }
    });
  }

  async onSubmit(): Promise<void> {
    const peseta = this.peseta();
    if (!peseta) return;

    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.pesetasService.update(peseta.id, {
        uds: this.uds(),
        conservation: this.conservation() || 'ND',
        observations: this.observations() || null,
      });
      this.messageService.add({ ...TOAST_MESSAGES.pesetas.saveSuccess, life: 3000 });
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
