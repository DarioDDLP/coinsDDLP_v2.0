import { Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../../core/services/auth.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { TradeRequest } from '../../../../shared/interfaces/trade.interface';
import {
  isTradeUnread,
  TRADE_STATUS_SEVERITY,
  tradeCoinCount,
} from '../../../../shared/helpers/trade.helper';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { tradeKindLabel, tradeStatusLabel } from '../../trades.labels';

/** Tabla de solicitudes recibidas o enviadas; cada fila abre su detalle. */
@Component({
  selector: 'app-trade-request-list',
  imports: [TableModule, BadgeComponent, DatePipe],
  templateUrl: './trade-request-list.component.html',
  styleUrl: './trade-request-list.component.scss',
})
export class TradeRequestListComponent {
  private auth = inject(AuthService);
  readonly lang = inject(I18nService).lang;
  readonly literals = injectLiterals('trades');

  readonly requests = input.required<TradeRequest[]>();
  /** Recibidas: se muestra quién pide; enviadas: a quién se pide. */
  readonly mode = input.required<'received' | 'sent'>();

  readonly opened = output<TradeRequest>();

  readonly rows = computed(() => {
    const t = this.literals();
    const uid = this.auth.currentUser()?.uid ?? null;
    const received = this.mode() === 'received';
    return this.requests().map((request) => ({
      request,
      party: received ? request.requesterName : request.ownerName,
      kind: tradeKindLabel(request.kind, t),
      status: tradeStatusLabel(request.status, t),
      severity: TRADE_STATUS_SEVERITY[request.status],
      coins: tradeCoinCount(request),
      unread: isTradeUnread(request, uid),
    }));
  });
}
