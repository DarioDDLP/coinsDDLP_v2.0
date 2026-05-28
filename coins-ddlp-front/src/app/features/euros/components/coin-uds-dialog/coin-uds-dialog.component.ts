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
import { Dialog } from 'primeng/dialog';
import { MessageService, SharedModule } from 'primeng/api';
import { EurosService } from '../../services/euros.service';
import { OwnerService, OWNER_IDS } from '../../../../core/services/owner.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { ConservationCode, EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CONSERVATION_OPTIONS } from '../../../../shared/constants/conservation-states.const';
import { FilterPillOption } from '../../../../shared/components/filter-pills/filter-pills.component';

@Component({
  selector: 'app-coin-uds-dialog',
  imports: [
    Dialog,
    SharedModule,
    ButtonComponent,
    TextInputComponent,
    SelectComponent,
    TextareaComponent,
    ToggleComponent,
    CountryFlagComponent,
    FilterPillsComponent,
  ],
  templateUrl: './coin-uds-dialog.component.html',
  styleUrl: './coin-uds-dialog.component.scss',
})
export class CoinUdsDialogComponent {
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private ownerService = inject(OwnerService);
  readonly authService = inject(AuthService);

  visible = input<boolean>(false);
  coin = input<EuroCoin | null>(null);

  saved = output<void>();
  closed = output<void>();

  readonly literals = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;
  readonly conservationOptions = CONSERVATION_OPTIONS;

  readonly ownerPickerOptions: FilterPillOption[] = [
    { value: 'dario', label: LITERALS.shared.ownerDario },
    { value: 'manolo', label: LITERALS.shared.ownerManolo },
  ];

  readonly showOwnerPicker = computed(
    () => this.ownerService.current() === 'ambas' && this.authService.isAdmin(),
  );

  readonly editingOwner = signal<'dario' | 'manolo'>('dario');

  readonly dialogTitle = computed(() => {
    const c = this.coin();
    return c ? `${this.sharedLiterals.edit} ${c.faceValue} ${c.year}` : this.literals.editCoin;
  });

  readonly uds = signal(0);
  readonly conservation = signal<ConservationCode>('ND');
  readonly observations = signal('');
  readonly circulation = signal(true);
  readonly idNum = signal('');
  readonly description = signal('');
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.setupFormEffect();
  }

  private setupFormEffect(): void {
    effect(() => {
      const c = this.coin();
      const owner = this.editingOwner();
      const isManolo = owner === 'manolo';

      this.uds.set(isManolo ? (c?.udsAlt ?? 0) : (c?.uds ?? 0));
      this.conservation.set(isManolo ? (c?.conservationAlt ?? 'ND') : (c?.conservation ?? 'ND'));
      this.observations.set(isManolo ? (c?.observationsAlt ?? '') : (c?.observations ?? ''));
      this.circulation.set(c?.circulation ?? true);
      this.idNum.set(c?.idNum ?? '');
      this.description.set(c?.description ?? '');
      this.errorMessage.set('');
    });
  }

  onOwnerPickerChange(slug: string): void {
    this.editingOwner.set(slug as 'dario' | 'manolo');
  }

  async onSubmit(): Promise<void> {
    const coin = this.coin();
    if (!coin) return;

    const ownerId = !this.authService.isAdmin()
      ? this.authService.currentUser()!.uid
      : this.showOwnerPicker()
        ? OWNER_IDS[this.editingOwner()]
        : (this.ownerService.primaryId() ?? OWNER_IDS.dario);

    this.errorMessage.set('');
    this.loading.set(true);
    try {
      await this.eurosService.update(
        coin.id,
        {
          uds: this.uds(),
          conservation: this.conservation(),
          observations: this.observations(),
          circulation: this.circulation(),
          idNum: this.idNum(),
          description: this.description(),
        },
        ownerId,
      );
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
