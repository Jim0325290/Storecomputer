const CACHE_NAME = 'shop-calc-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './print.css',
    './script.js',
    './manifest.json'
];

// 安裝 Service Worker 並快取檔案
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 攔截網路請求：有快取就用快取，沒快取才上網
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
