/* Marca si hay WebGL antes del primer pintado, para que no parpadee la
   imagen de respaldo del hero mientras carga Three.js. Sin `defer` a propósito. */
    (function () {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var c = document.createElement('canvas');
        if (c.getContext('webgl2') || c.getContext('webgl')) {
          document.documentElement.classList.add('con-3d');
        }
      } catch (e) {}
    })();
