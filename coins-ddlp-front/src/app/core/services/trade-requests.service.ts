import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../app.config';
import { AuthService } from './auth.service';
import { TABLES } from '../../shared/constants/collections.const';
import {
  NewTradeRequest,
  TradeRequest,
  TradeRequestItem,
} from '../../shared/interfaces/trade.interface';

const REQUEST_SELECT =
  '*, owner(name), trade_request_item(euroId, quantity, euro(id, year, country, faceValue, description, variant, mint))';

interface RawTradeRequest extends Omit<TradeRequest, 'ownerName' | 'items'> {
  owner: { name: string } | null;
  trade_request_item: TradeRequestItem[] | null;
}

/**
 * Solicitudes de intercambio del usuario con sesión (recibidas y enviadas).
 * Las escrituras van por funciones de la BD que validan permisos y estado.
 * Mantiene el número de solicitudes con novedades y lo actualiza en vivo (Realtime).
 */
@Injectable({ providedIn: 'root' })
export class TradeRequestsService {
  private supabase = inject(SUPABASE_CLIENT);
  private auth = inject(AuthService);
  private channel: RealtimeChannel | null = null;

  /** Se incrementa con cada cambio (propio o recibido en vivo) para que las vistas recarguen. */
  readonly revision = signal(0);
  /** Solicitudes con novedades sin ver: recibidas sin abrir y enviadas que han cambiado. */
  readonly unreadCount = signal(0);

  constructor() {
    effect(() => {
      const uid = this.auth.currentUser()?.uid ?? null;
      untracked(() => this.watch(uid));
    });
    inject(DestroyRef).onDestroy(() => this.unwatch());
  }

  async list(): Promise<TradeRequest[]> {
    const { data, error } = await this.supabase
      .from(TABLES.tradeRequest)
      .select(REQUEST_SELECT)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as RawTradeRequest[]).map((r) => this.map(r));
  }

  async create(request: NewTradeRequest): Promise<string> {
    const { data, error } = await this.supabase.rpc('trade_request_create', {
      p_owner: request.ownerId,
      p_kind: request.kind,
      p_message: request.message,
      p_items: request.items,
    });
    if (error) throw error;
    this.changed();
    return data as string;
  }

  async respond(id: string, status: 'accepted' | 'rejected', response: string): Promise<void> {
    await this.call('trade_request_respond', { p_id: id, p_status: status, p_response: response });
  }

  async cancel(id: string): Promise<void> {
    await this.call('trade_request_cancel', { p_id: id });
  }

  async complete(id: string): Promise<void> {
    await this.call('trade_request_complete', { p_id: id });
  }

  async markSeen(id: string): Promise<void> {
    await this.call('trade_request_mark_seen', { p_id: id });
  }

  /** Email de la otra parte; `null` hasta que la solicitud se acepta. */
  async contact(id: string): Promise<string | null> {
    const { data, error } = await this.supabase.rpc('trade_request_contact', { p_id: id });
    if (error) throw error;
    return (data as string | null) ?? null;
  }

  private async call(fn: string, args: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.rpc(fn, args);
    if (error) throw error;
    this.changed();
  }

  private changed(): void {
    this.revision.update((r) => r + 1);
    void this.refreshUnread();
  }

  private async refreshUnread(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) {
      this.unreadCount.set(0);
      return;
    }
    const { count, error } = await this.supabase
      .from(TABLES.tradeRequest)
      .select('id', { count: 'exact', head: true })
      .or(
        `and(ownerId.eq.${uid},ownerSeen.is.false),and(requesterId.eq.${uid},requesterSeen.is.false)`,
      );
    // El contador es informativo: si falla, se queda como estaba
    if (!error) this.unreadCount.set(count ?? 0);
  }

  /** Escucha en vivo las solicitudes del usuario (la RLS solo le envía las suyas). */
  private watch(uid: string | null): void {
    this.unwatch();
    if (!uid) {
      this.unreadCount.set(0);
      return;
    }
    void this.refreshUnread();
    this.channel = this.supabase
      .channel(`trade-requests-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.tradeRequest }, () =>
        this.changed(),
      )
      .subscribe();
  }

  private unwatch(): void {
    if (this.channel) void this.supabase.removeChannel(this.channel);
    this.channel = null;
  }

  private map(raw: RawTradeRequest): TradeRequest {
    const { owner, trade_request_item, ...request } = raw;
    return {
      ...request,
      ownerName: owner?.name ?? '',
      items: trade_request_item ?? [],
    };
  }
}
