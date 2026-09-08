/* OO Dimensions — interacciones compartidas */
(function () {
  'use strict';

  /* Menú móvil */
  var hamburguesa = document.querySelector('.hamburguesa');
  var nav = document.querySelector('.nav');
  if (hamburguesa && nav) {
    hamburguesa.addEventListener('click', function () {
      var abierto = nav.classList.toggle('abierta');
      hamburguesa.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      document.body.style.overflow = abierto ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('abierta');
        hamburguesa.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* Sombra del header al hacer scroll */
  var header = document.querySelector('.header');
  if (header) {
    var alScroll = function () {
      header.classList.toggle('con-sombra', window.scrollY > 8);
    };
    window.addEventListener('scroll', alScroll, { passive: true });
    alScroll();
  }

  /* Revelado al entrar en pantalla */
  var revelables = document.querySelectorAll('.revelar');
  if ('IntersectionObserver' in window && revelables.length) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          /* Cascada por celdas en la rejilla de logos */
          if (en.target.classList.contains('logos-rejilla')) {
            Array.prototype.forEach.call(en.target.children, function (celda, i) {
              celda.style.transitionDelay = (i * 45) + 'ms';
            });
          }
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revelables.forEach(function (el) { obs.observe(el); });
  } else {
    revelables.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Contadores animados: <span class="metrica__numero" data-contar="105">0</span> */
  var contadores = document.querySelectorAll('[data-contar]');
  if ('IntersectionObserver' in window && contadores.length) {
    var obsNum = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obsNum.unobserve(en.target);
        var el = en.target;
        var fin = parseInt(el.getAttribute('data-contar'), 10) || 0;
        var sufijo = el.getAttribute('data-sufijo') || '';
        var t0 = null;
        var dur = 1600;
        var paso = function (t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var suavizado = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(fin * suavizado) + sufijo;
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.5 });
    contadores.forEach(function (el) { obsNum.observe(el); });
  } else {
    contadores.forEach(function (el) {
      el.textContent = el.getAttribute('data-contar') + (el.getAttribute('data-sufijo') || '');
    });
  }

  /* Filtros de proyectos: reordenación suave (fade + scale) en vez de corte seco */
  var filtros = document.querySelectorAll('.filtro[data-filtro]');
  if (filtros.length) {
    var tarjetasProy = document.querySelectorAll('[data-categoria]');
    filtros.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filtros.forEach(function (b) { b.classList.remove('activo'); });
        btn.classList.add('activo');
        var f = btn.getAttribute('data-filtro');
        tarjetasProy.forEach(function (t) {
          var cats = (t.getAttribute('data-categoria') || '').split(/\s+/);
          var mostrar = f === 'todos' || cats.indexOf(f) !== -1;
          if (mostrar) {
            t.style.display = '';
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { t.classList.remove('filtrada'); });
            });
          } else {
            t.classList.add('filtrada');
            setTimeout(function () {
              if (t.classList.contains('filtrada')) t.style.display = 'none';
            }, 280);
          }
        });
      });
    });
  }

  /* Año actual en el footer */
  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();

  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Barra de progreso de scroll */
  var progreso = document.createElement('div');
  progreso.className = 'progreso-scroll';
  document.body.appendChild(progreso);
  var pintarProgreso = function () {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progreso.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', pintarProgreso, { passive: true });
  pintarProgreso();

  /* Brillo de las tarjetas siguiendo al cursor */
  document.addEventListener('mousemove', function (e) {
    var tarjeta = e.target.closest && e.target.closest('.tarjeta');
    if (!tarjeta) return;
    var r = tarjeta.getBoundingClientRect();
    tarjeta.style.setProperty('--x', (e.clientX - r.left) + 'px');
    tarjeta.style.setProperty('--y', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* Cortina de salida al navegar entre páginas del sitio */
  if (!sinMovimiento) {
    var cortina = document.createElement('div');
    cortina.className = 'cortina';
    cortina.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cortina);

    document.addEventListener('click', function (e) {
      var enlace = e.target.closest && e.target.closest('a[href]');
      if (!enlace || enlace.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var href = enlace.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:)/.test(href)) return;
      e.preventDefault();
      cortina.classList.add('activa');
      setTimeout(function () { window.location.href = href; }, 250);
    });
    /* Al volver con el botón Atrás (bfcache), la cortina no puede quedarse echada */
    window.addEventListener('pageshow', function () {
      cortina.classList.remove('activa');
      document.body.classList.remove('saliendo');
    });
    /* Seguro: si la animación de entrada quedara congelada (pestaña en segundo
       plano, navegador raro), forzamos el final para no dejar la página invisible */
    setTimeout(function () {
      if (document.body.getAnimations && getComputedStyle(document.body).opacity !== '1' && !document.body.classList.contains('saliendo')) {
        document.body.getAnimations().forEach(function (a) { a.cancel(); });
      }
    }, 700);
  }

  /* Parallax de profundidad: los visuales se desplazan a velocidades distintas.
     Usa la propiedad `translate` (independiente de `transform`) para no pisar
     los reveals; desactivado en móvil y con reduced-motion. */
  if (!sinMovimiento && 'translate' in document.documentElement.style) {
    var OBJETIVOS_PARALLAX = [
      ['.partido__visual', 0.07],
      ['.seccion--navy .metricas', 0.05],
      ['.clash-anim', 0.05],
      ['.logos-rejilla', 0.04],
      ['.capitulo__visual', 0.06]
    ];
    var capas = [];
    OBJETIVOS_PARALLAX.forEach(function (par) {
      document.querySelectorAll(par[0]).forEach(function (el) {
        capas.push({ el: el, factor: par[1] });
      });
    });
    if (capas.length) {
      var parallaxPedido = false;
      var pintarParallax = function () {
        parallaxPedido = false;
        if (window.innerWidth < 860) {
          capas.forEach(function (c) { c.el.style.translate = ''; });
          return;
        }
        var centroVista = window.innerHeight / 2;
        capas.forEach(function (c) {
          var r = c.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > window.innerHeight + 80) return;
          var desvio = (centroVista - (r.top + r.height / 2)) * c.factor;
          c.el.style.translate = '0 ' + desvio.toFixed(1) + 'px';
        });
      };
      window.addEventListener('scroll', function () {
        if (!parallaxPedido) { parallaxPedido = true; requestAnimationFrame(pintarParallax); }
      }, { passive: true });
      pintarParallax();
    }
  }

  /* Hero interactivo: foco de luz y parallax de los chips */
  var hero = document.querySelector('.hero');
  if (hero && !sinMovimiento) {
    var chips = hero.querySelectorAll('.chip-dato');
    var visual = hero.querySelector('.hero__visual > img');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;   /* 0..1 */
      var py = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', (px * 100) + '%');
      hero.style.setProperty('--my', (py * 100) + '%');
      var dx = px - .5;
      chips.forEach(function (chip, i) {
        var prof = 14 + i * 10;
        chip.style.setProperty('--px', (dx * prof) + 'px');
      });
      if (visual) visual.style.setProperty('translate', (dx * -10) + 'px 0');
    }, { passive: true });
  }
})();
