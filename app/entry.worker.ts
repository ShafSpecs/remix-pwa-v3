/// <reference lib="WebWorker" />

import { RemixNavigationHandler } from "./sw";

// import createStorageRepository from "./database.js";

export type {};
declare let self: ServiceWorkerGlobalScope;

const PAGES = "page-cache";
const DATA = "data-cache";
// const ASSETS = "assets-cache";

// create lru-cache stores here (custom ofc) and pass them instead to the handlers

const precacheHandler = new RemixNavigationHandler({
  dataCacheName: DATA,
  documentCacheName: PAGES
});

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  event.waitUntil(precacheHandler.handle(event));
});
