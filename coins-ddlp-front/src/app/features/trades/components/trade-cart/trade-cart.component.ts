import { Component, computed, ErrorHandler, inject, output, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TradeCartService } from '../../../../core/services/trade-cart.service';
import { TradeRequestsService } from '../../../../core/services/trade-requests.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaComponent } from '../../../../shared/components/textarea/textarea.component';
import { TradeCartGroup, TradeKind } from '../../../../shared/interfaces/trade.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { getTradeKindOptions } from '../../trades.labels';
import { TradeCoinComponent } from '../trade-coin/trade-coin.component';

/** Borrador de cada solicitud (tipo y mensaje), por dueño. */
interface Draft {
  kind: TradeKind;
  message: string;
}

const EMPTY_DRAFT: Draft = { kind: 'exchange', message: '' };

/** Cesta: una tarjeta por dueño con sus monedas, tipo, mensaje y botón de envío. */
@Component({
  selector: 'app-trade-cart',
  imports: [
    ButtonComponent,
    EmptyPanelComponent,
    FilterPillsComponent,
    TextInputComponent,
    TextareaComponent,
    TradeCoinComponent,
  ],
  templateUrl: './trade-cart.component.html',
  styleUrl: './trade-cart.component.scss',
})
export class TradeCartComponent {
  private i18n = inject(I18nService);
  private messageService = inject(MessageService);
  private errorHandler = inject(ErrorHandler);
  private requests = inject(TradeRequestsService);
  readonly cart = inject(TradeCartService);

  readonly literals = injectLiterals('trades');
  readonly kindOptions = computed(() => getTradeKindOptions(this.literals()));

  /** Se emite tras enviar una solicitud (la vista pasa a "Enviadas"). */
  readonly sent = output<void>();

  private readonly drafts = signal<Record<string, Draft>>({});
  /** Dueño cuya solicitud se está enviando. */
  readonly sendingOwner = signal<string | null>(null);

  draft(ownerId: string): Draft {
    return this.drafts()[ownerId] ?? EMPTY_DRAFT;
  }

  setKind(ownerId: string, kind: string): void {
    this.patchDraft(ownerId, { kind: kind as TradeKind });
  }

  setMessage(ownerId: string, message: string): void {
    this.patchDraft(ownerId, { message });
  }

  setQuantity(euroId: string, ownerId: string, value: string): void {
    const quantity = Math.trunc(Number(value));
    if (Number.isFinite(quantity) && quantity > 0) {
      this.cart.setQuantity(euroId, ownerId, quantity);
    }
  }

  async send(group: TradeCartGroup): Promise<void> {
    const draft = this.draft(group.ownerId);
    this.sendingOwner.set(group.ownerId);
    try {
      await this.requests.create({
        ownerId: group.ownerId,
        kind: draft.kind,
        message: draft.message,
        items: group.items.map((i) => ({ euroId: i.coin.id, quantity: i.quantity })),
      });
      this.cart.clearOwner(group.ownerId);
      this.drafts.update(({ [group.ownerId]: _, ...rest }) => rest);
      this.messageService.add(this.i18n.toast(TOAST_MESSAGES.trades.sentSuccess));
      this.sent.emit();
    } catch (e) {
      this.errorHandler.handleError(e);
    } finally {
      this.sendingOwner.set(null);
    }
  }

  private patchDraft(ownerId: string, patch: Partial<Draft>): void {
    this.drafts.update((d) => ({ ...d, [ownerId]: { ...this.draft(ownerId), ...patch } }));
  }
}
