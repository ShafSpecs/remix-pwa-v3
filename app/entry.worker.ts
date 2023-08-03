/// <reference lib="WebWorker" />

import { CacheFirst, NetworkFirst, PrecacheHandler, matchRequest } from "./sw";

// import createStorageRepository from "./database.js";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache";
const DATA = "data-cache";
const ASSETS = "assets-cache";

// create lru-cache stores here (custom ofc) and pass them instead to the handlers

const documentHandler = new NetworkFirst({
  cacheName: PAGES,
});

const loadersHandler = new NetworkFirst({
  cacheName: DATA,
  isLoader: true,
});

const assetsHandler = new CacheFirst({
  cacheName: ASSETS,
});

export const defaultFetchHandler = ({ context, request }: any) => {
  const type = matchRequest(request);

  if (type === "asset") {
    return assetsHandler.handle(request);
  }

  if (type === "loader") {
    return loadersHandler.handle(request);
  }

  if (type === "document") {
    return documentHandler.handle(request);
  }

  return context.fetchFromServer();
};

const messageHandler = new PrecacheHandler({
  dataCacheName: DATA,
  documentCacheName: PAGES,
  assetCacheName: ASSETS,
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let a = true;

self.addEventListener("message", (event) => {
  if (a) {
    a = false;
    event.waitUntil(messageHandler.handle(event));
  }
});
