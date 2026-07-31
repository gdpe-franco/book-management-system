export interface BookEventDelivery {
  id: string;
  event: unknown;
}

export interface BookEventStream {
  ensureGroup(): Promise<void>;
  readNew(count?: number, blockMs?: number): Promise<BookEventDelivery[]>;
  claimStale(minIdleMs: number, count?: number): Promise<BookEventDelivery[]>;
  acknowledge(id: string): Promise<void>;
}
