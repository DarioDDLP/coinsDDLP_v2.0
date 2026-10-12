export type TradeKind = 'exchange' | 'purchase' | 'gift';

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

/** De qué lado de la comparación salen las repetidas que se muestran. */
export type TradeSide = 'primary' | 'compare';

/** Datos de la moneda que se guardan en la cesta y se pintan en las solicitudes. */
export interface TradeCoinInfo {
  id: string;
  year: number;
  country: string;
  faceValue: string;
  description: string;
  variant?: string;
  mint?: string;
}

/** Moneda guardada en la cesta, a la espera de enviar la solicitud a su dueño. */
export interface TradeCartItem {
  coin: TradeCoinInfo;
  ownerId: string;
  ownerName: string;
  quantity: number;
  /** Unidades que el dueño ofrecía al añadirla (el servidor vuelve a comprobarlo al enviar). */
  max: number;
}

/** Monedas de la cesta de un mismo dueño: se envían en una sola solicitud. */
export interface TradeCartGroup {
  ownerId: string;
  ownerName: string;
  items: TradeCartItem[];
}

export interface TradeRequestItem {
  euroId: string;
  quantity: number;
  euro: TradeCoinInfo;
}

export interface TradeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  ownerId: string;
  /** Nombre de la colección a la que se pide. */
  ownerName: string;
  kind: TradeKind;
  status: TradeStatus;
  message: string | null;
  response: string | null;
  createdAt: string;
  updatedAt: string;
  ownerSeen: boolean;
  requesterSeen: boolean;
  items: TradeRequestItem[];
}

export interface NewTradeRequest {
  ownerId: string;
  kind: TradeKind;
  message: string;
  items: { euroId: string; quantity: number }[];
}
