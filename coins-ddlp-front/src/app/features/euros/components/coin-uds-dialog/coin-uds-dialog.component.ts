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
import { EurosService } from '../../services/euros.service';
import { OwnerService } from '../../../../core/services/owner.service';
import { AuthService } from '../../../../core/services/auth.service';
import { injectCan } from '../../../../core/services/permissions.service';
import { injectCanEditUnits } from '../../euros-permissions';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { SelectComponent } from '../../../../shared/components/select/select.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { ToggleComponent } from '../../../../shared/components/toggle/toggle.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ConservationCode, EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CONSERVATION_OPTIONS } from '../../../../shared/constants/conservation-states.const';
import { FilterPillOption } from '../../../../shared/components/filter-pills/filter-pills.component';
import { translateFaceValue } from '../../../../shared/helpers/face-value.helper';

@Component({
  selector: 'app-coin-uds-dialog',
  imports: [
    DialogComponent,
    ButtonComponent,
    TextInputComponent,
    SelectComponent,
    TextareaComponent,
    ToggleComponent,
    CountryFlagComponent,
    FilterPillsComponent,
    BadgeComponent,
  ],
  templateUrl: './coin-uds-dialog.component.html',
  styleUrl: './coin-uds-dialog.component.scss',
})
export class CoinUdsDialogComponent {
  private i18n = inject(I18nService);
  private eurosService = inject(EurosService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private ownerService = inject(OwnerService);
  private authService = inject(AuthService);

  readonly canEditUnits = injectCanEditUnits();
  readonly canEditCatalog = injectCan('euros.catalog.edit');
  private canEditAny = injectCan('euros.units.editAny');

  readonly visible = model(false);
  readonly coin = input<EuroCoin | null>(null);

  readonly literals = injectLiterals('euros');
  readonly sharedLiterals = injectLiterals('shared');
  private faceValues = injectLiterals('faceValues');
  readonly conservationOptions = CONSERVATION_OPTIONS;

  /** Al comparar, con `editAny`, se elige en cuál de las dos colecciones se guarda. */
  readonly ownerPickerOptions = computed<FilterPillOption[]>(() => [
    { value: 'primary', label: this.ownerService.primaryName() },
    { value: 'compare', label: this.ownerService.compareName() },
  ]);

  readonly showOwnerPicker = computed(() => this.ownerService.isComparing() && this.canEditAny());

  readonly editingOwner = signal<'primary' | 'compare'>('primary');

  readonly dialogTitle = computed(() => {
    const c = this.coin();
    return c
      ? `${this.sharedLiterals().edit} ${translateFaceValue(c.faceValue, this.faceValues())} ${c.year}`
      : this.literals().editCoin;
  });

  readonly uds = signal(0);
  readonly conservation = signal<ConservationCode>('ND');
  readonly observations = signal('');
  readonly circulation = signal(true);
  readonly idNum = signal('');
  readonly description = signal('');
  readonly loading = signal(false);

  constructor() {
    // Al abrir (o al cambiar de colección al comparar) se cargan los valores guardados de la moneda
    effect(() => {
      if (!this.visible()) return;
      const coin = this.coin();
      const owner = this.editingOwner();
      untracked(() => this.fillForm(coin, owner));
    });
  }

  private fillForm(c: EuroCoin | null, owner: 'primary' | 'compare'): void {
    const isCompare = owner === 'compare';
    this.uds.set(isCompare ? (c?.udsAlt ?? 0) : (c?.uds ?? 0));
    this.conservation.set(isCompare ? (c?.conservationAlt ?? 'ND') : (c?.conservation ?? 'ND'));
    this.observations.set(isCompare ? (c?.observationsAlt ?? '') : (c?.observations ?? ''));
    this.circulation.set(c?.circulation ?? true);
    this.idNum.set(c?.idNum ?? '');
    this.description.set(c?.description ?? '');
  }

  onOwnerPickerChange(value: string): void {
    this.editingOwner.set(value === 'compare' ? 'compare' : 'primary');
  }

  async onSubmit(): Promise<void> {
    const coin = this.coin();
    if (!coin) return;

    // Sin `editAny` solo puede escribir en su propia colección
    const ownerId = !this.canEditAny()
      ? this.authService.currentUser()!.uid
      : this.showOwnerPicker() && this.editingOwner() === 'compare'
        ? this.ownerService.compareId()
        : this.ownerService.primaryId();

    // Solo se envía lo que el usuario puede editar
    const data: Partial<EuroCoin> = {};
    if (this.canEditUnits()) {
      Object.assign(data, {
        uds: this.uds(),
        conservation: this.conservation(),
        observations: this.observations(),
      });
    }
    if (this.canEditCatalog()) {
      Object.assign(data, {
        circulation: this.circulation(),
        idNum: this.idNum(),
        description: this.description(),
      });
    }

    this.loading.set(true);
    try {
      await this.eurosService.update(coin.id, data, ownerId);
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.euros.saveSuccess));
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loading.set(false);
    }
  }

  /** Tras la animación de cierre: la próxima vez se abre editando la colección principal. */
  onHidden(): void {
    this.editingOwner.set('primary');
  }
}
