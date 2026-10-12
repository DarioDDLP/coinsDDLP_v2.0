import { TradeRequest } from '../interfaces/trade.interface';
import { availableForTrade, coinRepeated, isTradeUnread, tradeCoinCount } from './trade.helper';

describe('trade.helper', () => {
  it('availableForTrade', () => {
    expect(availableForTrade(0)).toBe(0);
    expect(availableForTrade(1)).toBe(0);
    expect(availableForTrade(3)).toBe(2);
    expect(availableForTrade(3, true)).toBe(0);
  });

  it('coinRepeated', () => {
    const coin = { uds: 3, tradeHidden: true, udsAlt: 2, tradeHiddenAlt: false };
    expect(coinRepeated(coin, 'primary')).toBe(0);
    expect(coinRepeated(coin, 'primary', true)).toBe(2);
    expect(coinRepeated(coin, 'compare')).toBe(1);
    expect(coinRepeated({ uds: 2 }, 'compare')).toBe(0);
  });

  it('isTradeUnread', () => {
    const request = {
      ownerId: 'o',
      requesterId: 'r',
      ownerSeen: false,
      requesterSeen: true,
    } as TradeRequest;
    expect(isTradeUnread(request, 'o')).toBe(true);
    expect(isTradeUnread(request, 'r')).toBe(false);
    expect(isTradeUnread(request, 'x')).toBe(false);
    expect(isTradeUnread(request, null)).toBe(false);
  });

  it('tradeCoinCount', () => {
    expect(tradeCoinCount({ items: [] })).toBe(0);
    expect(
      tradeCoinCount({
        items: [
          { euroId: 'a', quantity: 2, euro: {} as never },
          { euroId: 'b', quantity: 1, euro: {} as never },
        ],
      }),
    ).toBe(3);
  });
});
