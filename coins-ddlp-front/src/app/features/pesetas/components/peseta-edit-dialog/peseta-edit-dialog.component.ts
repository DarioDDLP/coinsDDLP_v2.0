import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { PesetasService } from '../../services/pesetas.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CONSERVATION_OPTIONS } from '../../../../shared/constants/conservation-states.const';

@Component({
  selector: 'app-peseta-edit-dialog',
  imports: [
    DialogComponent,
    ButtonComponent,
    TextInputComponent,
    SelectComponent,
    TextareaComponent,
  ],
  templateUrl: './peseta-edit-dialog.component.html',
  styleUrl: './peseta-edit-dialog.component.scss',
})
export class PesetaEditDialogComponent {
  private i18n = inject(I18nService);
  private pesetasService = inject(PesetasService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly visible = model(false);
  readonly peseta = input<Peseta | null>(null);

  readonly literals = injectLiterals('pesetas');
  readonly sharedLiterals = injectLiterals('shared');

  readonly dialogTitle = computed(() => {
    const p = this.peseta();
    return p
      ? `${this.sharedLiterals().edit} ${p.peseta_type.faceValueLabel} ${p.mintYear}`
      : this.literals().editCoin;
  });

  readonly uds = signal(0);
  readonly conservation = signal('ND');
  readonly observations = signal('');
  readonly loading = signal(false);

  readonly isConservationLocked = computed(() => this.uds() === 0);

  readonly availableConservationOptions = computed(() =>
    this.isConservationLocked()
      ? CONSERVATION_OPTIONS
      : CONSERVATION_OPTIONS.filter((o) => o.value !== 'ND'),
  );

  constructor() {
    // Al abrir se cargan los valores guardados de la peseta
    effect(() => {
      if (!this.visible()) return;
      const p = this.peseta();
      untracked(() => {
        this.uds.set(p?.uds ?? 0);
        this.conservation.set(p?.conservation ?? 'ND');
        this.observations.set(p?.observations ?? '');
      });
    });

    // Sin unidades el estado es ND; con unidades hay que elegir uno real
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

    this.loading.set(true);
    try {
      await this.pesetasService.update(peseta.id, {
        uds: this.uds(),
        conservation: this.conservation() || 'ND',
        observations: this.observations() || null,
      });
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.pesetas.saveSuccess));
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loading.set(false);
    }
  }
}
