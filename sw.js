/* Clarum Održavanje — minimalni service worker.
   Kešira statiku (ljuska aplikacije) da se app otvara brzo i da ikona na
   home screenu radi kao aplikacija. Podaci se NE keširaju — svježina ima
   prednost; bez mreže app jasno javi grešku (papirnati fallback u pogonu). */
var CACHE = 'odrzavanje-static-v40';
var STATIKA = ['./index.html', './manifest.json', './vendor/supabase-js.js',
               './assets/icon-192.png', './assets/icon-512.png'];

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

/* push obavijest — stiže i kad je aplikacija zatvorena */
self.addEventListener('push', function(e){
  var p = { naslov:'Održavanje', tekst:'', ruta:'' };
  try{ p = Object.assign(p, e.data ? e.data.json() : {}); }catch(err){ p.tekst = e.data ? e.data.text() : ''; }
  e.waitUntil(self.registration.showNotification(p.naslov, {
    body: p.tekst,
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png',
    tag: 'odrzavanje',
    renotify: true,
    vibrate: [120, 60, 120],
    data: { ruta: p.ruta || '' }
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var ruta = (e.notification.data && e.notification.data.ruta) || '';
  var cilj = './index.html' + (ruta ? ruta : '');
  e.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(function(lista){
    for(var i=0;i<lista.length;i++){
      if(lista[i].url.indexOf('index.html') > -1 && 'focus' in lista[i]){
        if(ruta && 'navigate' in lista[i]) lista[i].navigate(cilj);
        return lista[i].focus();
      }
    }
    return clients.openWindow(cilj);
  }));
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
