/* Detecta si el navegador puede con el infinito 3D y lo marca en el <html>
   ANTES del primer pintado, para que no se vea el parpadeo de la imagen de
   respaldo mientras carga Three.js. Por eso va sin `defer`: tiene que
   ejecutarse ya.

   Estaba escrito dentro del HTML. Se ha sacado aquí para poder prohibir los
   scripts en línea en la cabecera de seguridad: un script embebido es
   exactamente la vía por la que se inyectó el spam en el WordPress viejo. */

/* Oculta la imagen de respaldo del hero ANTES del primer pintado si el
       infinito 3D va a poder cargar, para que nunca se vea el flash de la
       ilustración detrás mientras carga Three.js. */
    (function () {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var c = document.createElement('canvas');
        if (c.getContext('webgl2') || c.getContext('webgl')) {
          document.documentElement.classList.add('con-3d');
        }
      } catch (e) {}
    })();
