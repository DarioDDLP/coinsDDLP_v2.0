import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EurosService } from '../../services/euros.service';
import { NumistaService } from '../../../../core/services/numista.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { NumistaCoin } from '../../../../shared/interfaces/numista-coin.interface';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DetailDrawerComponent } from '../../../../shared/components/detail-drawer/detail-drawer.component';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { CoinUdsDialogComponent } from '../coin-uds-dialog/coin-uds-dialog.component';
import { injectCanEditCoins } from '../../euros-permissions';
import { injectCan } from '../../../../core/services/permissions.service';
import { FaceValuePipe } from '../../../../shared/pipes/face-value.pipe';
import { translateCountry } from '../../../../shared/helpers/country.helper';
import { translateFaceValue } from '../../../../shared/helpers/face-value.helper';

interface Feature {
  label: string;
  value: string;
}

/** Ficha de una moneda en panel lateral. Ruta hija de la vista de país: moneda/:id. */
@Component({
  selector: 'app-coin-detail-drawer',
  imports: [
    FaceValuePipe,
    DetailDrawerComponent,
    BadgeComponent,
    ErrorPanelComponent,
    ButtonComponent,
    CountryFlagComponent,
    ConfirmDialogComponent,
    CoinUdsDialogComponent,
  ],
  templateUrl: './coin-detail-drawer.component.html',
  styleUrl: './coin-detail-drawer.component.scss',
})
export class CoinDetailDrawerComponent {
  private i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eurosService = inject(EurosService);
  private numistaService = inject(NumistaService);
  private lang = this.i18n.lang;
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly literals = injectLiterals('coinDetail');
  private countries = injectLiterals('countries');
  private faceValues = injectLiterals('faceValues');
  readonly eurosLiterals = injectLiterals('euros');
  readonly sharedLiterals = injectLiterals('shared');

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  private readonly from = this.route.snapshot.queryParamMap.get('from');

  private readonly drawer = viewChild.required(DetailDrawerComponent);
  readonly coin = signal<EuroCoin | null>(null);
  readonly numista = signal<NumistaCoin | null>(null);
  readonly numistaLoading = signal(false);
  readonly numistaError = signal(false);
  readonly numistaQuotaError = signal(false);
  readonly hasError = signal(false);
  /** Un solo skeleton hasta tener la moneda y los datos de Numista: la ficha aparece entera. */
  readonly isLoading = computed(() => !this.hasError() && (!this.coin() || this.numistaLoading()));

  readonly udsDialogVisible = signal(false);
  readonly deleteDialogVisible = signal(false);
  readonly deleteLoading = signal(false);

  readonly canEdit = injectCanEditCoins();
  readonly canDelete = injectCan('euros.delete');

  constructor() {
    effect(() => {
      const id = this.id();
      this.eurosService.revision();
      if (id) untracked(() => this.load(id));
    });

    // Al cambiar de idioma con la ficha abierta, los textos de Numista se vuelven a pedir en el nuevo
    effect(() => {
      const lang = this.lang();
      untracked(() => {
        const coin = this.coin();
        if (coin && this.numistaLang !== null && lang !== this.numistaLang)
          this.loadNumista(coin.idNum);
      });
    });
  }

  // Solo cuenta la última petición de cada tipo: una anterior que llegue tarde no pisa la ficha
  private loadSub?: Subscription;
  private numistaSub?: Subscription;
  /** Idioma en que se pidieron los datos de Numista mostrados. */
  private numistaLang: string | null = null;

  private load(id: string): void {
    this.hasError.set(false);
    this.loadSub?.unsubscribe();
    this.loadSub = this.eurosService.getById(id).subscribe({
      next: (coin) => {
        if (!coin) {
          this.close();
          return;
        }
        const idNumChanged = coin.idNum !== this.coin()?.idNum;
        this.coin.set(coin);
        if (idNumChanged) this.loadNumista(coin.idNum);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        // Si falla una recarga tras editar se mantiene la ficha: basta con el toast
        if (String(this.coin()?.id) !== id) this.hasError.set(true);
      },
    });
  }

  retry(): void {
    const id = this.id();
    if (id) this.load(id);
  }

  private loadNumista(idNum: string): void {
    this.numistaSub?.unsubscribe();
    this.numista.set(null);
    this.numistaError.set(false);
    this.numistaQuotaError.set(false);
    this.numistaLoading.set(false);
    this.numistaLang = this.lang();
    if (!idNum || idNum === '0') return;
    this.numistaLoading.set(true);
    this.numistaSub = this.numistaService.getCoinByIdNum(idNum, this.numistaLang).subscribe({
      next: (data) => {
        this.numista.set(data);
        this.numistaLoading.set(false);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        if (e?.status === 429) this.numistaQuotaError.set(true);
        else this.numistaError.set(true);
        this.numistaLoading.set(false);
      },
    });
  }

  // --- Datos derivados ---

  readonly conservationBadge = computed(() => getConservationBadge(this.coin()?.conservation));
  readonly udsBadge = computed(() => getUdsBadge(this.coin()?.uds ?? 0));
  readonly udsLabel = computed(() => {
    const uds = this.coin()?.uds ?? 0;
    return `${uds} ${uds === 1 ? this.eurosLiterals().unitShort : this.eurosLiterals().unitsShort}`;
  });

  readonly noNumistaMessage = computed(() => {
    if (this.numistaQuotaError()) return this.literals().errorNumistaQuota;
    if (this.numistaError()) return this.literals().errorNumista;
    return this.literals().labelNoIdNum;
  });

  readonly features = computed<Feature[]>(() => {
    const n = this.numista();
    const c = this.coin();
    if (!c) return [];
    if (!n) {
      return [
        {
          label: this.literals().labelCountry,
          value: translateCountry(c.country, this.countries()),
        },
        { label: this.literals().labelYear, value: String(c.year) },
        {
          label: this.literals().labelFaceValue,
          value: translateFaceValue(c.faceValue, this.faceValues()),
        },
        ...(c.mint ? [{ label: this.literals().labelMint, value: c.mint }] : []),
        {
          label: this.literals().labelCirculation,
          value: c.circulation ? this.literals().labelYes : this.literals().labelNo,
        },
      ];
    }
    const technique = (n.technique?.text ?? '').match(/>([^<]+)</)?.[1] ?? n.technique?.text;
    const references = (n.references ?? [])
      .map((r) => `${r.catalogue.code} ${r.number}`)
      .join(' · ');
    const rows: (Feature | null)[] = [
      n.issuer?.name ? { label: this.literals().labelIssuer, value: n.issuer.name } : null,
      n.type ? { label: this.literals().labelType, value: n.type } : null,
      n.min_year
        ? { label: this.literals().labelYears, value: `${n.min_year}–${n.max_year}` }
        : null,
      c.mint ? { label: this.literals().labelMint, value: c.mint } : null,
      n.composition?.text
        ? { label: this.literals().labelComposition, value: n.composition.text }
        : null,
      n.weight ? { label: this.literals().labelWeight, value: `${n.weight} g` } : null,
      n.size ? { label: this.literals().labelDiameter, value: `${n.size} mm` } : null,
      n.thickness ? { label: this.literals().labelThickness, value: `${n.thickness} mm` } : null,
      n.shape ? { label: this.literals().labelShape, value: n.shape } : null,
      technique ? { label: this.literals().labelTechnique, value: technique } : null,
      references ? { label: this.literals().labelReferences, value: references } : null,
    ];
    return rows.filter((r): r is Feature => r !== null);
  });

  // --- Acciones ---

  /** Vuelve a la lista (lo emite el drawer una sola vez, al terminar de cerrarse). */
  close(): void {
    if (this.from === 'conmemorativas') {
      this.router.navigate(['/conmemorativas']);
      return;
    }
    this.router.navigate(['../..'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
  }

  async onConfirmDelete(): Promise<void> {
    const coin = this.coin();
    if (!coin) return;
    this.deleteLoading.set(true);
    try {
      await this.eurosService.remove(coin.id);
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.euros.deleteSuccess));
      this.deleteDialogVisible.set(false);
      this.drawer().requestClose();
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.deleteLoading.set(false);
    }
  }
}
