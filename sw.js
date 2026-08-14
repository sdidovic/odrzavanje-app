/* Clarum Održavanje — minimalni service worker.
   Kešira statiku (ljuska aplikacije) da se app otvara brzo i da ikona na
   home screenu radi kao aplikacija. Podaci se NE keširaju — svježina ima
   prednost; bez mreže app jasno javi grešku (papirnati fallback u pogonu). */
var CACHE = 'odrzavanje-static-v6';
var STATIKA = ['./index.html', './manifest.json', './assets/icon-192.png', './assets/icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(STATIKA); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; })
      .map(function(k){ return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  /* samo GET vlastite statike; API/Storage pozivi idu uvijek na mrežu */
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var kopija = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, kopija); });
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});
