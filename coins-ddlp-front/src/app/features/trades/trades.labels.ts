import { FilterPillOption } from '../../shared/components/filter-pills/filter-pills.component';
import { Translations } from '../../shared/interfaces/translations.interface';
import { TradeKind, TradeStatus } from '../../shared/interfaces/trade.interface';

type TradeLiterals = Translations['trades'];

export type TradesTab = 'cart' | 'received' | 'sent';

export const TRADES_TABS: readonly TradesTab[] = ['cart', 'received', 'sent'];

export function tradeKindLabel(kind: TradeKind, t: TradeLiterals): string {
  const labels: Record<TradeKind, string> = {
    exchange: t.kindExchange,
    purchase: t.kindPurchase,
    gift: t.kindGift,
  };
  return labels[kind];
}

export function tradeStatusLabel(status: TradeStatus, t: TradeLiterals): string {
  const labels: Record<TradeStatus, string> = {
    pending: t.statusPending,
    accepted: t.statusAccepted,
    rejected: t.statusRejected,
    cancelled: t.statusCancelled,
    completed: t.statusCompleted,
  };
  return labels[status];
}

export function getTradeKindOptions(t: TradeLiterals): FilterPillOption[] {
  return (['exchange', 'purchase', 'gift'] as const).map((kind) => ({
    value: kind,
    label: tradeKindLabel(kind, t),
  }));
}
