import invariant from 'tiny-invariant';

export type JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit
) => Response;

export const json: JsonFunction = (data, init = {}) => {
  let responseInit = typeof init === "number" ? { status: init } : init;

  let headers = new Headers(responseInit.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
};

export type RedirectFunction = (
  url: string,
  init?: number | ResponseInit
) => Response;

/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */
export const redirect: RedirectFunction = (url, init = 302) => {
  let responseInit = init;

  if (typeof responseInit === "number") {
    responseInit = { status: responseInit };
  } else if (typeof responseInit.status === "undefined") {
    responseInit.status = 302;
  }

  let headers = new Headers(responseInit.headers);
  headers.set("Location", url);

  return new Response(null, {
    ...responseInit,
    headers,
  });
};

export class AbortedDeferredError extends Error {}

export interface TrackedPromise extends Promise<any> {
  _tracked?: boolean;
  _data?: any;
  _error?: any;
}

function isTrackedPromise(value: any): value is TrackedPromise {
  return (
    value instanceof Promise && (value as TrackedPromise)._tracked === true
  );
}

function unwrapTrackedPromise(value: any) {
  if (!isTrackedPromise(value)) {
    return value;
  }

  if (value._error) {
    throw value._error;
  }
  return value._data;
}

export class DeferredData {
  private pendingKeysSet: Set<string> = new Set<string>();
  private controller: AbortController;
  private abortPromise: Promise<void>;
  private unlistenAbortSignal: () => void;
  private subscribers: Set<(aborted: boolean, settledKey?: string) => void> =
    new Set();
  data: Record<string, unknown>;
  init?: ResponseInit;
  deferredKeys: string[] = [];

  constructor(data: Record<string, unknown>, responseInit?: ResponseInit) {
    invariant(
      data && typeof data === "object" && !Array.isArray(data),
      "defer() only accepts plain objects"
    );

    // Set up an AbortController + Promise we can race against to exit early
    // cancellation
    let reject: (e: AbortedDeferredError) => void;
    this.abortPromise = new Promise((_, r) => (reject = r));
    this.controller = new AbortController();
    let onAbort = () =>
      reject(new AbortedDeferredError("Deferred data aborted"));
    this.unlistenAbortSignal = () =>
      this.controller.signal.removeEventListener("abort", onAbort);
    this.controller.signal.addEventListener("abort", onAbort);

    this.data = Object.entries(data).reduce(
      (acc, [key, value]) =>
        Object.assign(acc, {
          [key]: this.trackPromise(key, value),
        }),
      {}
    );

    if (this.done) {
      // All incoming values were resolved
      this.unlistenAbortSignal();
    }

    this.init = responseInit;
  }

  private trackPromise(
    key: string,
    value: Promise<unknown> | unknown
  ): TrackedPromise | unknown {
    if (!(value instanceof Promise)) {
      return value;
    }

    this.deferredKeys.push(key);
    this.pendingKeysSet.add(key);

    // We store a little wrapper promise that will be extended with
    // _data/_error props upon resolve/reject
    let promise: TrackedPromise = Promise.race([value, this.abortPromise]).then(
      (data) => this.onSettle(promise, key, undefined, data as unknown),
      (error) => this.onSettle(promise, key, error as unknown)
    );

    // Register rejection listeners to avoid uncaught promise rejections on
    // errors or aborted deferred values
    promise.catch(() => {});

    Object.defineProperty(promise, "_tracked", { get: () => true });
    return promise;
  }

  private onSettle(
    promise: TrackedPromise,
    key: string,
    error: unknown,
    data?: unknown
  ): unknown {
    if (
      this.controller.signal.aborted &&
      error instanceof AbortedDeferredError
    ) {
      this.unlistenAbortSignal();
      Object.defineProperty(promise, "_error", { get: () => error });
      return Promise.reject(error);
    }

    this.pendingKeysSet.delete(key);

    if (this.done) {
      // Nothing left to abort!
      this.unlistenAbortSignal();
    }

    // If the promise was resolved/rejected with undefined, we'll throw an error as you
    // should always resolve with a value or null
    if (error === undefined && data === undefined) {
      let undefinedError = new Error(
        `Deferred data for key "${key}" resolved/rejected with \`undefined\`, ` +
          `you must resolve/reject with a value or \`null\`.`
      );
      Object.defineProperty(promise, "_error", { get: () => undefinedError });
      this.emit(false, key);
      return Promise.reject(undefinedError);
    }

    if (data === undefined) {
      Object.defineProperty(promise, "_error", { get: () => error });
      this.emit(false, key);
      return Promise.reject(error);
    }

    Object.defineProperty(promise, "_data", { get: () => data });
    this.emit(false, key);
    return data;
  }

  private emit(aborted: boolean, settledKey?: string) {
    this.subscribers.forEach((subscriber) => subscriber(aborted, settledKey));
  }

  subscribe(fn: (aborted: boolean, settledKey?: string) => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  cancel() {
    this.controller.abort();
    this.pendingKeysSet.forEach((v, k) => this.pendingKeysSet.delete(k));
    this.emit(true);
  }

  async resolveData(signal: AbortSignal) {
    let aborted = false;
    if (!this.done) {
      let onAbort = () => this.cancel();
      signal.addEventListener("abort", onAbort);
      aborted = await new Promise((resolve) => {
        this.subscribe((aborted) => {
          signal.removeEventListener("abort", onAbort);
          if (aborted || this.done) {
            resolve(aborted);
          }
        });
      });
    }
    return aborted;
  }

  get done() {
    return this.pendingKeysSet.size === 0;
  }

  get unwrappedData() {
    invariant(
      this.data !== null && this.done,
      "Can only unwrap data on initialized and settled deferreds"
    );

    return Object.entries(this.data).reduce(
      (acc, [key, value]) =>
        Object.assign(acc, {
          [key]: unwrapTrackedPromise(value),
        }),
      {}
    );
  }

  get pendingKeys() {
    return Array.from(this.pendingKeysSet);
  }
}