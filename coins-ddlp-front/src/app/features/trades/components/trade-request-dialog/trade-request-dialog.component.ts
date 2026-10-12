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
import { DatePipe } from '@angular/common';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import { TradeRequestsService } from '../../../../core/services/trade-requests.service';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { TradeRequest } from '../../../../shared/interfaces/trade.interface';
import { isTradeUnread, TRADE_STATUS_SEVERITY } from '../../../../shared/helpers/trade.helper';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { tradeKindLabel, tradeStatusLabel } from '../../trades.labels';
import { TradeCoinComponent } from '../trade-coin/trade-coin.component';

type TradeAction = 'accept' | 'reject' | 'cancel' | 'complete';

/**
 * Detalle de una solicitud: monedas, mensajes y las acciones que tocan según quién
 * la abre y su estado. Al abrirla se marca como vista.
 */
@Component({
  selector: 'app-trade-request-dialog',
  imports: [
    DialogComponent,
    ButtonComponent,
    BadgeComponent,
    TextareaComponent,
    TradeCoinComponent,
    DatePipe,
  ],
  templateUrl: './trade-request-dialog.component.html',
  styleUrl: './trade-request-dialog.component.scss',
})
export class TradeRequestDialogComponent {
  private i18n = inject(I18nService);
  private auth = inject(AuthService);
  private requests = inject(TradeRequestsService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);

  readonly lang = this.i18n.lang;
  readonly literals = injectLiterals('trades');
  readonly sharedLiterals = injectLiterals('shared');

  readonly visible = model(false);
  readonly request = input<TradeRequest | null>(null);

  readonly response = signal('');
  readonly contact = signal<string | null>(null);
  readonly loadingAction = signal<TradeAction | null>(null);

  private readonly uid = computed(() => this.auth.currentUser()?.uid ?? null);
  readonly isOwner = computed(() => this.request()?.ownerId === this.uid());
  readonly isPending = computed(() => this.request()?.status === 'pending');
  readonly canRespond = computed(() => this.isOwner() && this.isPending());
  readonly canCancel = computed(() => !this.isOwner() && this.isPending());
  readonly canComplete = computed(() => this.request()?.status === 'accepted');
  readonly showsContact = computed(() => {
    const status = this.request()?.status;
    return status === 'accepted' || status === 'completed';
  });

  readonly header = computed(() => {
    const r = this.request();
    const t = this.literals();
    return r ? `${t.requestTitle} · ${tradeKindLabel(r.kind, t)}` : t.requestTitle;
  });
  readonly status = computed(() => {
    const r = this.request();
    return r
      ? {
          label: tradeStatusLabel(r.status, this.literals()),
          severity: TRADE_STATUS_SEVERITY[r.status],
        }
      : null;
  });

  constructor() {
    // Al abrir: formulario limpio, se marca como vista y, si ya está aceptada, se pide el contacto
    effect(() => {
      if (!this.visible()) return;
      const request = this.request();
      untracked(() => this.onOpen(request));
    });
  }

  private onOpen(request: TradeRequest | null): void {
    if (!request) return;
    if (isTradeUnread(request, this.uid())) {
      this.requests.markSeen(request.id).catch((e) => this.errorHandler.handleError(e));
    }
    if (this.showsContact() && this.contact() === null) {
      this.requests
        .contact(request.id)
        .then((email) => this.contact.set(email))
        .catch((e) => this.errorHandler.handleError(e));
    }
  }

  async run(action: TradeAction): Promise<void> {
    const r = this.request();
    if (!r) return;
    this.loadingAction.set(action);
    try {
      if (action === 'accept' || action === 'reject') {
        await this.requests.respond(
          r.id,
          action === 'accept' ? 'accepted' : 'rejected',
          this.response(),
        );
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.trades.respondSuccess));
      } else if (action === 'cancel') {
        await this.requests.cancel(r.id);
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.trades.cancelSuccess));
      } else {
        await this.requests.complete(r.id);
        this.messageService.add(this.i18n.toast(TOAST_MESSAGES.trades.completeSuccess));
      }
      this.visible.set(false);
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.loadingAction.set(null);
    }
  }

  /** Tras la animación de cierre: limpia lo transitorio. */
  onHidden(): void {
    this.response.set('');
    this.contact.set(null);
  }
}
