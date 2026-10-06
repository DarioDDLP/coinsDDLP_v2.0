import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { formatNumber } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { PesetasService } from '../../services/pesetas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { DetailDrawerComponent } from '../../../../shared/components/detail-drawer/detail-drawer.component';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { COUNTRY_DB_NAMES } from '../../../../shared/constants/countries.const';
import { injectLiterals, I18nService } from '../../../../shared/services/i18n.service';
import { PesetaEditDialogComponent } from '../peseta-edit-dialog/peseta-edit-dialog.component';

interface Feature {
  label: string;
  value: string;
  separator?: boolean;
}

const NUMISTA_PIECE_URL = 'https://en.numista.com/catalogue/pieces';

/** Ficha de una peseta en panel lateral. Ruta hija de la vista de pesetas: moneda/:id. */
@Component({
  selector: 'app-peseta-detail-drawer',
  imports: [
    DetailDrawerComponent,
    BadgeComponent,
    ErrorPanelComponent,
    ButtonComponent,
    CountryFlagComponent,
    PesetaEditDialogComponent,
  ],
  templateUrl: './peseta-detail-drawer.component.html',
  styleUrl: './peseta-detail-drawer.component.scss',
})
export class PesetaDetailDrawerComponent {
  readonly lang = inject(I18nService).lang;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PesetasService);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);

  readonly literals = injectLiterals('pesetaDetail');
  readonly pesetasLiterals = injectLiterals('pesetas');
  readonly sharedLiterals = injectLiterals('shared');
  /** Nombre de BD: solo para la bandera. */
  readonly country = COUNTRY_DB_NAMES.ESP;

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  readonly peseta = signal<Peseta | null>(null);
  readonly hasError = signal(false);
  readonly editVisible = signal(false);
  private loadSub?: Subscription;

  constructor() {
    effect(() => {
      const id = this.id();
      this.service.revision();
      if (id) untracked(() => this.load(id));
    });
  }

  private load(id: string): void {
    this.hasError.set(false);
    // Solo cuenta la última petición: una anterior que llegue tarde no pisa la ficha
    this.loadSub?.unsubscribe();
    this.loadSub = this.service.getById(id).subscribe({
      next: (peseta) => {
        if (!peseta) {
          this.close();
          return;
        }
        this.peseta.set(peseta);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        // Si falla una recarga tras editar se mantiene la ficha: basta con el toast
        if (String(this.peseta()?.id) !== id) this.hasError.set(true);
      },
    });
  }

  retry(): void {
    const id = this.id();
    if (id) this.load(id);
  }

  readonly conservationBadge = computed(() =>
    getConservationBadge(this.peseta()?.conservation ?? undefined),
  );
  readonly udsBadge = computed(() => getUdsBadge(this.peseta()?.uds ?? 0));
  readonly udsLabel = computed(() => {
    const uds = this.peseta()?.uds ?? 0;
    return `${uds} ${uds === 1 ? this.pesetasLiterals().unitShort : this.pesetasLiterals().unitsShort}`;
  });

  readonly numistaUrl = computed(() => {
    const idNum = this.peseta()?.peseta_type?.idNum;
    return idNum ? `${NUMISTA_PIECE_URL}${idNum}.html` : null;
  });

  readonly overline = computed(() => {
    const p = this.peseta();
    return p ? `${this.pesetasLiterals().country} · ${p.label}` : '';
  });

  readonly features = computed<Feature[]>(() => {
    const p = this.peseta();
    if (!p) return [];
    const t = p.peseta_type;
    const l = this.literals();
    const rows: (Feature | null)[] = [
      { label: l.labelFaceValue, value: t.faceValueLabel },
      { label: l.labelYears, value: `${t.minYear}–${t.maxYear}` },
      t.composition ? { label: l.labelComposition, value: t.composition } : null,
      t.weightG ? { label: l.labelWeight, value: `${t.weightG} g` } : null,
      t.diameterMm ? { label: l.labelDiameter, value: `${t.diameterMm} mm` } : null,
      t.shape ? { label: l.labelShape, value: t.shape } : null,
      t.orientation ? { label: l.labelOrientation, value: t.orientation } : null,
      t.ruler ? { label: l.labelRuler, value: t.ruler } : null,
      t.mint ? { label: l.labelMint, value: t.mint } : null,
      t.demonetized ? { label: l.labelDemonetized, value: t.demonetized } : null,
      t.kmRef ? { label: l.labelKmRef, value: t.kmRef } : null,
      t.engraverObverse ? { label: l.labelEngraverObverse, value: t.engraverObverse } : null,
      t.engraverReverse ? { label: l.labelEngraverReverse, value: t.engraverReverse } : null,
      { label: l.labelMintYear, value: p.label, separator: true },
      p.mintage
        ? { label: l.labelMintage, value: formatNumber(p.mintage, this.lang(), '1.0-0') }
        : null,
    ];
    return rows.filter((r): r is Feature => r !== null);
  });

  close(): void {
    this.router.navigate(['../..'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    });
  }
}
