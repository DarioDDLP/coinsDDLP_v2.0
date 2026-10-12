import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { TradeCartService } from '../../../../core/services/trade-cart.service';
import { TradeRequestsService } from '../../../../core/services/trade-requests.service';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import {
  FilterPillOption,
  FilterPillsComponent,
} from '../../../../shared/components/filter-pills/filter-pills.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ErrorPanelComponent } from '../../../../shared/components/error-panel/error-panel.component';
import { TradeRequest } from '../../../../shared/interfaces/trade.interface';
import { isTradeUnread } from '../../../../shared/helpers/trade.helper';
import { injectLiterals } from '../../../../shared/services/i18n.service';
import { TRADES_TABS, TradesTab } from '../../trades.labels';
import { TradeCartComponent } from '../trade-cart/trade-cart.component';
import { TradeRequestListComponent } from '../trade-request-list/trade-request-list.component';
import { TradeRequestDialogComponent } from '../trade-request-dialog/trade-request-dialog.component';

/**
 * Intercambios: la solicitud en preparación (cesta) y las solicitudes recibidas y
 * enviadas. La pestaña va en `?tab=` y las listas se recargan en vivo.
 */
@Component({
  selector: 'app-trades-page',
  imports: [
    PageLayoutComponent,
    FilterPillsComponent,
    SkeletonComponent,
    EmptyPanelComponent,
    ErrorPanelComponent,
    TradeCartComponent,
    TradeRequestListComponent,
    TradeRequestDialogComponent,
  ],
  templateUrl: './trades-page.component.html',
  styleUrl: './trades-page.component.scss',
})
export class TradesPageComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  private requestsService = inject(TradeRequestsService);
  private cart = inject(TradeCartService);

  readonly literals = injectLiterals('trades');

  private readonly tabParam = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('tab') as TradesTab | null)),
    { initialValue: null },
  );

  /** Sin pestaña en la URL: la solicitud si tiene monedas; si no, las recibidas. */
  readonly tab = computed<TradesTab>(() => {
    const tab = this.tabParam();
    if (tab && TRADES_TABS.includes(tab)) return tab;
    return this.cart.count() > 0 ? 'cart' : 'received';
  });

  private readonly requests = signal<TradeRequest[]>([]);
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  /** Usuario cuyas solicitudes están cargadas: al cambiar se vuelve al skeleton. */
  private loadedUid: string | null = null;
  private loadId = 0;

  private readonly uid = computed(() => this.auth.currentUser()?.uid ?? null);
  readonly received = computed(() => this.requests().filter((r) => r.ownerId === this.uid()));
  readonly sent = computed(() => this.requests().filter((r) => r.requesterId === this.uid()));

  readonly tabOptions = computed<FilterPillOption[]>(() => {
    const t = this.literals();
    const uid = this.uid();
    const withCount = (label: string, n: number) => (n > 0 ? `${label} (${n})` : label);
    const unread = (list: TradeRequest[]) => list.filter((r) => isTradeUnread(r, uid)).length;
    return [
      { value: 'cart', label: withCount(t.tabCart, this.cart.count()) },
      { value: 'received', label: withCount(t.tabReceived, unread(this.received())) },
      { value: 'sent', label: withCount(t.tabSent, unread(this.sent())) },
    ];
  });

  /** Solicitud abierta: se busca en la lista para ver al momento sus cambios. */
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(
    () => this.requests().find((r) => r.id === this.selectedId()) ?? null,
  );
  readonly dialogVisible = signal(false);

  constructor() {
    // Carga al entrar y recarga sin skeleton con cada cambio (propio o en vivo)
    effect(() => {
      const uid = this.uid();
      this.requestsService.revision();
      if (!uid) {
        // Al cerrar sesión no hay nada que ver aquí
        untracked(() => void this.router.navigate(['/euros']));
        return;
      }
      untracked(() => {
        this.load(uid !== this.loadedUid);
        this.loadedUid = uid;
      });
    });
  }

  async load(showSkeleton = true): Promise<void> {
    const id = ++this.loadId;
    this.hasError.set(false);
    if (showSkeleton) this.isReady.set(false);
    try {
      const requests = await this.requestsService.list();
      // Solo cuenta la última petición: una anterior que llegue tarde no pisa la nueva
      if (id !== this.loadId) return;
      this.requests.set(requests);
    } catch (e) {
      if (id !== this.loadId) return;
      this.errorHandler.handleError(e);
      // Si falla una recarga se mantienen los datos: basta con el toast
      if (showSkeleton) this.hasError.set(true);
    }
    this.isReady.set(true);
  }

  selectTab(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      replaceUrl: true,
    });
  }

  openRequest(request: TradeRequest): void {
    this.selectedId.set(request.id);
    this.dialogVisible.set(true);
  }
}
