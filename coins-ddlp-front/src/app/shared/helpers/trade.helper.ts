import { EuroCoin } from '../interfaces/euro-coin.interface';
import { TradeCoinInfo, TradeRequest, TradeSide, TradeStatus } from '../interfaces/trade.interface';
import { Severity } from '../interfaces/severity.interface';

/** Unidades que una colección ofrece: las que le sobran (deja una), salvo que el dueño la oculte. */
export function availableForTrade(uds: number, tradeHidden = false): number {
  return tradeHidden ? 0 : Math.max(uds - 1, 0);
}

/**
 * Repetidas de una moneda en el lado indicado de la comparación.
 * `includeHidden`: el dueño ve también las que no ofrece.
 */
export function coinRepeated(
  coin: Pick<EuroCoin, 'uds' | 'tradeHidden' | 'udsAlt' | 'tradeHiddenAlt'>,
  side: TradeSide,
  includeHidden = false,
): number {
  const uds = side === 'primary' ? coin.uds : (coin.udsAlt ?? 0);
  const hidden = side === 'primary' ? coin.tradeHidden : coin.tradeHiddenAlt;
  return availableForTrade(uds, !includeHidden && !!hidden);
}

export function toTradeCoinInfo(coin: TradeCoinInfo): TradeCoinInfo {
  const { id, year, country, faceValue, description, variant, mint } = coin;
  return { id, year, country, faceValue, description, variant, mint };
}

export const TRADE_STATUS_SEVERITY: Record<TradeStatus, Severity> = {
  pending: 'warn',
  accepted: 'info',
  rejected: 'danger',
  cancelled: 'neutral',
  completed: 'success',
};

/** La solicitud tiene novedades sin ver para este usuario. */
export function isTradeUnread(request: TradeRequest, uid: string | null): boolean {
  if (!uid) return false;
  if (request.ownerId === uid) return !request.ownerSeen;
  if (request.requesterId === uid) return !request.requesterSeen;
  return false;
}

/** Monedas pedidas en total (suma de cantidades). */
export function tradeCoinCount(request: Pick<TradeRequest, 'items'>): number {
  return request.items.reduce((sum, i) => sum + i.quantity, 0);
}
