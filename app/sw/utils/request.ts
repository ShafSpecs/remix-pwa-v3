export type JSONOptions = ResponseInit

export const json = (data: any, options: JSONOptions = {}) => {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return new Response(JSON.stringify(data), {
    ...options,
    headers: {
      ...options.headers,
      ...headers,
    },
    statusText: options.statusText || "OK",
    status: options.status || 200,
  });
}

export declare class DeferredData {
  private pendingKeysSet;
  private controller;
  private abortPromise;
  private unlistenAbortSignal;
  private subscribers;
  data: Record<string, unknown>;
  init?: ResponseInit;
  deferredKeys: string[];
  constructor(data: Record<string, unknown>, responseInit?: ResponseInit);
  private trackPromise;
  private onSettle;
  private emit;
  subscribe(fn: (aborted: boolean, settledKey?: string) => void): () => boolean;
  cancel(): void;
  resolveData(signal: AbortSignal): Promise<boolean>;
  get done(): boolean;
  get unwrappedData(): {};
  get pendingKeys(): string[];
}
export type DeferFunction = (data: Record<string, unknown>, init?: number | ResponseInit) => DeferredData;
export declare const defer: DeferFunction;