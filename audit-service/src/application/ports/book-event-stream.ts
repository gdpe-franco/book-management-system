export interface BookEventDelivery {
  id: string;
  fields: Record<string, string>;
}

export interface BookEventStream {
  ensureGroup(): Promise<void>;
  readNew(count?: number): Promise<BookEventDelivery[]>;
}
