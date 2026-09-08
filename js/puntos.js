/* Nube de puntos — motor compartido de los tres efectos de partículas.
   Narrativa: escaneo (hero) → modelo (edificio de puntos) → datos conectados (constelación).
   Se pausa fuera de pantalla y se desactiva con prefers-reduced-motion. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var AZUL = '24,99,220';
  var CLARO = '109,179,255';

  function crearCanvas(contenedor, clase) {
    var c = document.createElement('canvas');
    c.className = clase;
    c.setAttribute('aria-hidden', 'true');
    contenedor.insertBefore(c, contenedor.firstChild);
    return c;
  }

  function ajustar(canvas, contenedor) {
    var r = contenedor.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, r.width * dpr);
    canvas.height = Math.max(1, r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function observarVisibilidad(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { cb(e.isIntersecting); });
    }, { threshold: 0 }).observe(el);
  }

  function seguirRaton(zona, canvas, estado) {
    zona.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      estado.mx = e.clientX - r.left;
      estado.my = e.clientY - r.top;
    }, { passive: true });
    zona.addEventListener('mouseleave', function () {
      estado.mx = -9999; estado.my = -9999;
    });
  }

  /* ---------- 1) Malla de puntos que se imanta al cursor ----------
     Se monta en el hero (intensa) y en las cabeceras interiores (tenue). */
  function montarMalla(hero, INTENSIDAD) {
    var canvas = crearCanvas(hero, 'nube-puntos');
    var ctx = canvas.getContext('2d');
    var dims = { w: 0, h: 0 };
    var puntos = [];
    var columnas = 0;
    var raton = { mx: -9999, my: -9999 };
    var RADIO = 170, FUERZA = 0.38;

    function malla() {
      dims = ajustar(canvas, hero);
      puntos = [];
      var sep = dims.w < 700 ? 56 : 46;
      columnas = 0;
      for (var y = sep / 2; y < dims.h; y += sep) {
        var cols = 0;
        for (var x = sep / 2; x < dims.w; x += sep) {
          puntos.push({ hx: x, hy: y, x: x, y: y, fase: Math.random() * 6.283, cerca: 0 });
          cols++;
        }
        columnas = cols;
      }
    }
    malla();
    window.addEventListener('resize', malla);
    seguirRaton(hero, canvas, raton);

    var visible = true;
    observarVisibilidad(hero, function (v) {
      visible = v;
      if (v && puntos.length === 0) malla();
    });

    (function marco(t) {
      requestAnimationFrame(marco);
      if (!visible || !puntos.length) return;
      ctx.clearRect(0, 0, dims.w, dims.h);
      var tt = (t || 0) / 1000;
      var i, p;

      /* 1º: actualizar posiciones */
      for (i = 0; i < puntos.length; i++) {
        p = puntos[i];
        /* deriva lenta en reposo */
        var ox = p.hx + Math.sin(tt * 0.5 + p.fase) * 2.2;
        var oy = p.hy + Math.cos(tt * 0.4 + p.fase) * 2.2;
        var dx = raton.mx - ox, dy = raton.my - oy;
        var d = Math.sqrt(dx * dx + dy * dy);
        var cerca = 0, destX = ox, destY = oy;
        if (d < RADIO) {
          cerca = 1 - d / RADIO;
          destX = ox + dx * cerca * FUERZA;
          destY = oy + dy * cerca * FUERZA;
        }
        p.cerca = cerca;
        p.x += (destX - p.x) * 0.14;
        p.y += (destY - p.y) * 0.14;
      }

      /* 2º: la retícula son los propios puntos — líneas a vecinos derecho e inferior */
      ctx.lineWidth = 1;
      for (i = 0; i < puntos.length; i++) {
        p = puntos[i];
        var col = i % columnas;
        var der = (col < columnas - 1) ? puntos[i + 1] : null;
        var abajo = (i + columnas < puntos.length) ? puntos[i + columnas] : null;
        if (der) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(der.x, der.y);
          ctx.strokeStyle = 'rgba(' + AZUL + ',' + ((0.06 + Math.max(p.cerca, der.cerca) * 0.22) * INTENSIDAD) + ')';
          ctx.stroke();
        }
        if (abajo) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(abajo.x, abajo.y);
          ctx.strokeStyle = 'rgba(' + AZUL + ',' + ((0.06 + Math.max(p.cerca, abajo.cerca) * 0.22) * INTENSIDAD) + ')';
          ctx.stroke();
        }
      }

      /* 3º: los puntos encima de la malla */
      for (i = 0; i < puntos.length; i++) {
        p = puntos[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4 + p.cerca * 1.4, 0, 6.283);
        ctx.fillStyle = 'rgba(' + AZUL + ',' + ((0.2 + p.cerca * 0.5) * INTENSIDAD) + ')';
        ctx.fill();
      }
    })();
  }

  var hero = document.querySelector('.hero');
  if (hero) montarMalla(hero, 1);
  /* cabeceras interiores: la misma malla, más tenue */
  var cabecera = document.querySelector('.cabecera-pagina');
  if (cabecera) montarMalla(cabecera, 0.7);

  /* ---------- 2) Muros 3D de puntos en la banda CTA final ----------
     Dos muros en isométrico que se encuentran en una arista central, como la
     esquina de un edificio escaneado. El cursor empuja los puntos a lo largo de
     la normal de su muro (más cuanto más cerca), creando una protuberancia. */
  var cta = document.querySelector('.cta-final');
  if (cta) (function () {
    var canvas = crearCanvas(cta, 'nube-puntos');
    var ctx = canvas.getContext('2d');
    var dims = { w: 0, h: 0 };
    var muros = [];                      /* [muroIzq, muroDer]; cada muro: array de columnas */
    var raton = { mx: -9999, my: -9999 };
    var COS = 0.866, SEN = 0.5;
    var RADIO = 150, MAXD = 30;

    function construir() {
      dims = ajustar(canvas, cta);
      muros = [];
      var s = dims.w < 700 ? 30 : 36;    /* paso de la malla */
      var cx = dims.w / 2;
      var cy = dims.h + 20;              /* la arista nace bajo el borde inferior */
      var nCols = Math.ceil((dims.w / 2) / (s * COS)) + 1;
      var nFilas = Math.ceil((dims.h + 60 + (dims.w / 2) * (SEN / COS)) / s) + 1;

      for (var lado = 0; lado < 2; lado++) {          /* 0 = derecha, 1 = izquierda */
        var signo = lado === 0 ? 1 : -1;
        var muro = [];
        /* ambos muros incluyen la arista (i=0): la malla queda conectada y el canto se realza */
        for (var i = 0; i < nCols; i++) {
          var colArr = [];
          for (var j = 0; j < nFilas; j++) {
            var bx = cx + signo * i * s * COS;
            var by = cy + i * s * SEN - j * s;
            if (by < -50 || by > dims.h + 60) { colArr.push(null); continue; }
            colArr.push({
              bx: bx, by: by, x: bx, y: by, d: 0,
              /* normal del muro proyectada a pantalla (hacia el espectador) */
              nx: -signo * COS, ny: SEN
            });
          }
          muro.push(colArr);
        }
        muros.push(muro);
      }
    }
    construir();
    window.addEventListener('resize', construir);
    seguirRaton(cta, canvas, raton);

    var visible = true;
    observarVisibilidad(cta, function (v) {
      visible = v;
      if (v && muros.length === 0) construir();
    });

    function linea(a, b) {
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(' + CLARO + ',' + (0.05 + Math.max(a.d, b.d) / MAXD * 0.2) + ')';
      ctx.stroke();
    }

    (function marco() {
      requestAnimationFrame(marco);
      if (!visible || !muros.length) return;
      ctx.clearRect(0, 0, dims.w, dims.h);
      var m, i, j, muro, col, p;

      /* 1º: protuberancia — desplazar cada punto según cercanía del cursor a su base */
      for (m = 0; m < muros.length; m++) {
        muro = muros[m];
        for (i = 0; i < muro.length; i++) {
          col = muro[i];
          for (j = 0; j < col.length; j++) {
            p = col[j];
            if (!p) continue;
            var dx = raton.mx - p.bx, dy = raton.my - p.by;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var objetivo = 0;
            if (dist < RADIO) {
              var k = 1 - dist / RADIO;
              objetivo = k * k * MAXD;
            }
            p.d += (objetivo - p.d) * 0.12;
            p.x = p.bx + p.nx * p.d;
            p.y = p.by + p.ny * p.d;
          }
        }
      }

      /* 2º: malla del muro (líneas tenues entre vecinos) */
      ctx.lineWidth = 1;
      for (m = 0; m < muros.length; m++) {
        muro = muros[m];
        for (i = 0; i < muro.length; i++) {
          col = muro[i];
          for (j = 0; j < col.length; j++) {
            p = col[j];
            if (!p) continue;
            if (j + 1 < col.length) linea(p, col[j + 1]);            /* vertical */
            if (i + 1 < muro.length) linea(p, muro[i + 1][j]);       /* horizontal del muro */
          }
        }
      }

      /* 3º: puntos — los elevados, más grandes y brillantes (más cerca del espectador) */
      for (m = 0; m < muros.length; m++) {
        muro = muros[m];
        for (i = 0; i < muro.length; i++) {
          col = muro[i];
          for (j = 0; j < col.length; j++) {
            p = col[j];
            if (!p) continue;
            var alza = p.d / MAXD;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5 + alza * 1.8, 0, 6.283);
            ctx.fillStyle = 'rgba(' + CLARO + ',' + (0.3 + alza * 0.55) + ')';
            ctx.fill();
          }
        }
      }
    })();
  })();

  /* ---------- 3) Edificio que se recompone desde puntos (Digital Twins) ---------- */
  var imgEdificio = document.getElementById('nube-edificio');
  if (imgEdificio) (function () {
    function iniciar() {
      var cont = imgEdificio.parentElement;
      cont.classList.add('lienzo-edificio');
      var canvas = document.createElement('canvas');
      canvas.className = 'puntos-edificio';
      canvas.setAttribute('aria-hidden', 'true');
      cont.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      var dims = ajustar(canvas, cont);
      if (dims.w < 10) { setTimeout(iniciar2, 300); return; } else { iniciar2(); }

      function iniciar2() {
        dims = ajustar(canvas, cont);
        /* muestrear la silueta de la ilustración */
        var off = document.createElement('canvas');
        off.width = dims.w; off.height = dims.h;
        var octx = off.getContext('2d');
        octx.drawImage(imgEdificio, 0, 0, dims.w, dims.h);
        var datos;
        try { datos = octx.getImageData(0, 0, dims.w, dims.h).data; }
        catch (e) { return; /* canvas contaminado: dejamos la imagen normal */ }

        var anchoDatos = off.width;
        var paso = Math.max(4, Math.round(Math.sqrt((dims.w * dims.h) / 2600)));
        var puntos = [];
        for (var y = 0; y < dims.h; y += paso) {
          for (var x = 0; x < dims.w; x += paso) {
            var idx = (Math.round(y) * anchoDatos + Math.round(x)) * 4;
            var alfa = datos[idx + 3];
            /* solo los tejados y aristas brillantes de los "edificios" que
               sobresalen del teléfono: el cuerpo oscuro se queda fuera */
            var luminancia = 0.299 * datos[idx] + 0.587 * datos[idx + 1] + 0.114 * datos[idx + 2];
            if (alfa > 120 && luminancia > 150) {
              puntos.push({
                tx: x, ty: y,
                x: Math.random() * dims.w,
                y: dims.h + Math.random() * 120,
                retardo: Math.random() * 0.55,
                t: 0
              });
            }
          }
        }
        if (!puntos.length) return;

        imgEdificio.style.opacity = '0';
        var raton = { mx: -9999, my: -9999 };
        seguirRaton(cont, canvas, raton);

        var montando = true, visible = false, arrancado = false;
        var mezcla = 1; /* 1 = solo puntos; 0 = solo imagen (fundido tras el montaje) */
        observarVisibilidad(cont, function (v) {
          visible = v;
          if (v) arrancado = true;
        });

        var RADIO = 130, FUERZA = 0.45;
        (function marco() {
          requestAnimationFrame(marco);
          if (!visible && montando && !arrancado) return;
          if (!visible && !montando) return;
          ctx.clearRect(0, 0, dims.w, dims.h);
          var terminados = 0;
          var i, p;

          if (!montando && mezcla > 0) mezcla = Math.max(0, mezcla - 0.02);

          for (i = 0; i < puntos.length; i++) {
            p = puntos[i];
            var alfaPunto = 0;

            if (montando) {
              /* fase 1: los puntos vuelan y ensamblan la silueta */
              p.t = Math.min(1, p.t + 0.012);
              var f = Math.max(0, (p.t - p.retardo) / (1 - p.retardo));
              f = 1 - Math.pow(1 - f, 3); /* easeOutCubic */
              p.x += (p.tx - p.x) * f * 0.2;
              p.y += (p.ty - p.y) * f * 0.2;
              if (p.t >= 1) terminados++;
              alfaPunto = 0.3 + p.t * 0.35;
            } else {
              /* fase 2: la imagen real toma el relevo; los puntos solo asoman,
                 sutiles, alrededor del cursor — como si los edificios que
                 sobresalen reaccionaran al pasar cerca */
              var dx = raton.mx - p.tx, dy = raton.my - p.ty;
              var d = Math.sqrt(dx * dx + dy * dy);
              var destX = p.tx, destY = p.ty, cerca = 0;
              if (d < RADIO) {
                cerca = 1 - d / RADIO;
                destX = p.tx + dx * cerca * FUERZA;
                destY = p.ty + dy * cerca * FUERZA;
              }
              p.x += (destX - p.x) * 0.16;
              p.y += (destY - p.y) * 0.16;
              alfaPunto = Math.max(mezcla * 0.4, cerca * 0.55);
            }

            if (alfaPunto > 0.02) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 1.3, 0, 6.283);
              ctx.fillStyle = 'rgba(255,255,255,' + alfaPunto + ')';
              ctx.fill();
            }
          }

          if (montando && terminados === puntos.length) {
            montando = false;
            imgEdificio.style.opacity = '1'; /* la ilustración vuelve en fundido */
          }
        })();
      }
    }
    if (imgEdificio.complete && imgEdificio.naturalWidth > 0) iniciar();
    else imgEdificio.addEventListener('load', iniciar);
  })();
})();
