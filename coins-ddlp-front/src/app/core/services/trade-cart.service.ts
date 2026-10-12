import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from './auth.service';
import { OwnerService } from './owner.service';
import { PermissionsService } from './permissions.service';
import { EuroCoin } from '../../shared/interfaces/euro-coin.interface';
import { TradeCartGroup, TradeCartItem } from '../../shared/interfaces/trade.interface';
import { coinRepeated, toTradeCoinInfo } from '../../shared/helpers/trade.helper';

const STORAGE_PREFIX = 'trade_cart_';

function readCart(uid: string): TradeCartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PREFIX + uid) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Cesta de monedas que el usuario quiere pedir, agrupadas por dueño.
 * Se guarda en `localStorage` por usuario: sobrevive a recargas y cambios de página.
 */
@Injectable({ providedIn: 'root' })
export class TradeCartService {
  private auth = inject(AuthService);
  private owners = inject(OwnerService);
  private permissions = inject(PermissionsService);
  private uid: string | null = null;

  readonly items = signal<TradeCartItem[]>([]);

  readonly count = computed(() => this.items().length);

  /** Puede añadir a la cesta las repetidas que está viendo: con sesión, permiso y colección ajena. */
  readonly canAddFromSource = computed(
    () =>
      this.auth.isLoggedIn() &&
      this.permissions.granted().has('trade.request') &&
      this.owners.canRequestFromSource(),
  );

  readonly groups = computed<TradeCartGroup[]>(() => {
    const groups = new Map<string, TradeCartGroup>();
    for (const item of this.items()) {
      const group = groups.get(item.ownerId) ?? {
        ownerId: item.ownerId,
        ownerName: item.ownerName,
        items: [],
      };
      group.items.push(item);
      groups.set(item.ownerId, group);
    }
    return [...groups.values()].sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  });

  constructor() {
    // Cada usuario tiene su cesta; sin sesión queda vacía
    effect(() => {
      const uid = this.auth.currentUser()?.uid ?? null;
      untracked(() => {
        this.uid = uid;
        this.items.set(uid ? readCart(uid) : []);
      });
    });
  }

  /** Unidades de la moneda que ya están en la cesta para ese dueño. */
  quantityOf(euroId: string, ownerId: string | null): number {
    return ownerId ? (this.find(euroId, ownerId)?.quantity ?? 0) : 0;
  }

  /**
   * Añade una unidad de la moneda desde la colección cuyas repetidas se ven.
   * Devuelve `false` si no se puede (sin disponibles o ya están todas en la cesta).
   */
  addFromSource(coin: EuroCoin): boolean {
    const ownerId = this.owners.tradeSourceId();
    const max = coinRepeated(coin, this.owners.tradeSide());
    if (!ownerId || !this.canAddFromSource() || this.quantityOf(coin.id, ownerId) >= max) {
      return false;
    }
    this.add({
      coin: toTradeCoinInfo(coin),
      ownerId,
      ownerName: this.owners.tradeSourceName(),
      max,
    });
    return true;
  }

  /** Añade la moneda (o suma una unidad si ya estaba, sin pasar del máximo). */
  add(item: Omit<TradeCartItem, 'quantity'>): void {
    const existing = this.find(item.coin.id, item.ownerId);
    if (existing) {
      this.setQuantity(item.coin.id, item.ownerId, existing.quantity + 1, item.max);
      return;
    }
    this.save([...this.items(), { ...item, quantity: 1 }]);
  }

  setQuantity(euroId: string, ownerId: string, quantity: number, max?: number): void {
    this.save(
      this.items().map((i) =>
        i.coin.id === euroId && i.ownerId === ownerId
          ? {
              ...i,
              max: max ?? i.max,
              quantity: Math.min(Math.max(quantity, 1), max ?? i.max),
            }
          : i,
      ),
    );
  }

  remove(euroId: string, ownerId: string): void {
    this.save(this.items().filter((i) => !(i.coin.id === euroId && i.ownerId === ownerId)));
  }

  /** Vacía las monedas de un dueño (tras enviarle la solicitud). */
  clearOwner(ownerId: string): void {
    this.save(this.items().filter((i) => i.ownerId !== ownerId));
  }

  private find(euroId: string, ownerId: string): TradeCartItem | undefined {
    return this.items().find((i) => i.coin.id === euroId && i.ownerId === ownerId);
  }

  private save(items: TradeCartItem[]): void {
    this.items.set(items);
    if (!this.uid) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + this.uid, JSON.stringify(items));
    } catch {
      // Sin almacenamiento (modo privado): la cesta vive solo en esta pestaña
    }
  }
}
