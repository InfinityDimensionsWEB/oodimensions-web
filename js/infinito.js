/* Infinito 3D — el logo de Infinity Dimensions en WebGL, construido como lo
   haría un modelador:

   1. GEOMETRÍA: cada pieza es una SILUETA 2D (la banda del infinito recortada
      con Sutherland–Hodgman por las líneas de corte exactas: vertical en el
      cruce central, horizontal en las puntas) extruida con BISEL redondeado.
      El grosor siempre es el eje Z → no puede retorcerse; los 4 huecos son
      idénticos por construcción; los bordes quedan redondeados como una pieza
      de plástico/metal lacado. Las 4 piezas salen por simetría de una sola.

   2. COREOGRAFÍA: las piezas llegan por separado y se ensamblan una tras otra;
      al tocarse todas, un brillo recorre las aristas marcando que ya es una
      superficie unida; en reposo respiran (micro-rotaciones individuales que
      se vuelven a asentar); al acercar el ratón se separan y giran más rápido,
      y al volver a unirse, otro brillo.

   Mejora progresiva: sin WebGL o con reduced-motion queda la ilustración. */
import * as THREE from './vendor/three.module.min.js';

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var visual = document.querySelector('.hero__visual');
  var imagen = visual && visual.querySelector('img');
  if (!visual || !imagen) { document.documentElement.classList.remove('con-3d'); return; }

  try {
    var prueba = document.createElement('canvas');
    if (!(prueba.getContext('webgl2') || prueba.getContext('webgl'))) {
      document.documentElement.classList.remove('con-3d'); return;
    }
  } catch (e) { document.documentElement.classList.remove('con-3d'); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { document.documentElement.classList.remove('con-3d'); return; }

  var hero = document.querySelector('.hero') || visual;
  var texto = document.querySelector('.hero__texto');

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'lienzo-infinito';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  /* cuelga del HERO (no de la columna, que se mueve con el revelado) y antes
     del contenido, para que el 3D nunca pinte por encima del texto */
  var contenidoHero = hero.querySelector('.hero__inner');
  if (contenidoHero) hero.insertBefore(renderer.domElement, contenidoHero);
  else hero.appendChild(renderer.domElement);

  var escena = new THREE.Scene();
  var camara = new THREE.PerspectiveCamera(35, 1.2, 0.1, 100);
  var CAM_Z = 20;
  camara.position.set(0, 0, CAM_Z);
  camara.lookAt(0, 0, 0);

  /* Lienzo a tamaño del HERO COMPLETO (como la retícula azul): el infinito no
     puede rebosar nunca. El objeto se centra y ESCALA a la zona libre — del
     borde derecho del texto al borde del hero — desplazando el grupo 3D. */
  var basePosX = 0, basePosY = 0;     /* desplazamiento del grupo en mundo */
  var escalaBase = 1;                 /* escala para caber en la zona libre */
  var MEDIO_EXT_X = 7.7;              /* semiextensión del infinito en mundo */
  var MEDIO_EXT_Y = 4.1;
  function encajar() {
    var h = hero.getBoundingClientRect();
    if (h.width < 60 || h.height < 60) return false;
    var cw = h.width, ch = h.height;
    renderer.setSize(cw, ch);
    renderer.domElement.style.left = '0px';
    renderer.domElement.style.top = '0px';
    camara.aspect = cw / ch;
    camara.updateProjectionMatrix();

    /* zona libre en píxeles de pantalla */
    var izq = h.left + 16, arriba = h.top + 12;
    if (texto) {
      var tr = texto.getBoundingClientRect();
      if (tr.width > 10) {
        var apilado = tr.bottom < h.top + h.height * 0.55 && tr.right > h.right * 0.7;
        if (apilado) arriba = Math.max(arriba, tr.bottom + 12);   /* una columna */
        else izq = Math.max(izq, tr.right + 24);                  /* dos columnas */
      }
    }
    var der = h.right - 16, abajo = h.bottom - 12;
    var cx = (izq + der) / 2, cy = (arriba + abajo) / 2;

    var mitadMundoY = Math.tan(camara.fov / 2 * Math.PI / 180) * CAM_Z;
    var pxPorUnidad = (ch / 2) / mitadMundoY;
    basePosX = (cx - (h.left + cw / 2)) / pxPorUnidad;
    basePosY = ((h.top + ch / 2) - cy) / pxPorUnidad;
    escalaBase = Math.min(1, ((der - izq) / 2 - 8) / (MEDIO_EXT_X * pxPorUnidad),
                             ((abajo - arriba) / 2 - 8) / (MEDIO_EXT_Y * pxPorUnidad));
    return true;
  }
  if (!encajar()) { renderer.setSize(1000, 760); camara.aspect = 1000 / 760; camara.updateProjectionMatrix(); }
  window.addEventListener('resize', encajar);
  /* remedir cuando el layout se asiente (revelados, fuentes) */
  setTimeout(encajar, 700);
  setTimeout(encajar, 2000);

  /* ================= 1. GEOMETRÍA ================= */

  var ESCALA = 6.2;          /* tamaño del infinito */
  var MEDIO_ANCHO = 1.15;    /* medio ancho de la banda */
  var GROSOR = 0.9;          /* profundidad de la extrusión (sin contar bisel) */
  var BISEL = 0.22;          /* redondeo de los bordes (más generoso) */
  var BISEL_LADO = 0.12;     /* cuánto sobresale el bisel del contorno */
  var HUECO = 0.16;          /* medio hueco: cada corte deja 2·(HUECO−BISEL_LADO) visibles */

  function lemniscata(ang) {
    var den = 1 + Math.sin(ang) * Math.sin(ang);
    return {
      x: (ESCALA * Math.cos(ang)) / den,
      y: (ESCALA * Math.sin(ang) * Math.cos(ang)) / den
    };
  }

  /* Silueta del cuarto superior-derecho: banda de la lemniscata para
     ang ∈ [0, π/2] (de la punta derecha al cruce central). */
  function siluetaCuarto() {
    var N = 150;
    var exterior = [], interior = [];
    for (var i = 0; i <= N; i++) {
      var ang = (i / N) * (Math.PI / 2);
      var p = lemniscata(ang);
      /* tangente por diferencias finitas → normal en el plano */
      var e = 0.0006;
      var p1 = lemniscata(ang - e), p2 = lemniscata(ang + e);
      var tx = p2.x - p1.x, ty = p2.y - p1.y;
      var L = Math.sqrt(tx * tx + ty * ty) || 1;
      var nx = -ty / L, ny = tx / L;
      exterior.push({ x: p.x + nx * MEDIO_ANCHO, y: p.y + ny * MEDIO_ANCHO });
      interior.push({ x: p.x - nx * MEDIO_ANCHO, y: p.y - ny * MEDIO_ANCHO });
    }
    var poligono = exterior.concat(interior.reverse());

    /* recorte por semiplanos (Sutherland–Hodgman): el corte central queda en
       la vertical x = HUECO y el de la punta en la horizontal y = HUECO */
    function recortar(pts, dentro, interseca) {
      var salida = [];
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], b = pts[(i + 1) % pts.length];
        var aIn = dentro(a), bIn = dentro(b);
        if (aIn) {
          salida.push(a);
          if (!bIn) salida.push(interseca(a, b));
        } else if (bIn) {
          salida.push(interseca(a, b));
        }
      }
      return salida;
    }
    function corteX(a, b) { var t = (HUECO - a.x) / (b.x - a.x); return { x: HUECO, y: a.y + (b.y - a.y) * t }; }
    function corteY(a, b) { var t = (HUECO - a.y) / (b.y - a.y); return { x: a.x + (b.x - a.x) * t, y: HUECO }; }
    poligono = recortar(poligono, function (p) { return p.x >= HUECO; }, corteX);
    poligono = recortar(poligono, function (p) { return p.y >= HUECO; }, corteY);
    return poligono;
  }

  /* degradado naranja → coral → violeta → azul, de izquierda a derecha */
  var PALETA = [
    new THREE.Color('#f5a028'),
    new THREE.Color('#ef7a5a'),
    new THREE.Color('#9a6bc0'),
    new THREE.Color('#4f6fd8')
  ];
  function colorEnX(x) {
    var t = Math.min(1, Math.max(0, x / (2 * ESCALA) + 0.5)) * (PALETA.length - 1);
    var i = Math.min(PALETA.length - 2, Math.floor(t));
    return PALETA[i].clone().lerp(PALETA[i + 1], t - i);
  }

  var material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.2,
    metalness: 0.08,
    clearcoat: 0.7,
    clearcoatRoughness: 0.22
  });
  /* una única instancia de material de aristas para poder pulsarlas a la vez */
  var materialAristas = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.14
  });

  var base = siluetaCuarto();
  var piezasG = new THREE.Group();
  var piezas = [];

  /* 4 piezas por simetría: [espejoX, espejoY, zHaciaCamara, balanceoInicial] */
  var VARIANTES = [
    [1, 1, 1, -0.55],    /* superior derecha  */
    [1, -1, -1, 0.55],   /* inferior derecha  */
    [-1, 1, -1, 0.55],   /* superior izquierda */
    [-1, -1, 1, -0.55]   /* inferior izquierda */
  ];

  VARIANTES.forEach(function (v) {
    var sx = v[0], sy = v[1];
    var pts = base.map(function (p) { return new THREE.Vector2(p.x * sx, p.y * sy); });
    if (sx * sy < 0) pts.reverse();   /* un solo espejo invierte el sentido */

    var forma = new THREE.Shape(pts);
    var geo = new THREE.ExtrudeGeometry(forma, {
      depth: GROSOR,
      bevelEnabled: true,
      bevelThickness: BISEL,
      bevelSize: BISEL_LADO,
      bevelSegments: 5,
      steps: 1
    });
    geo.translate(0, 0, -GROSOR / 2);

    /* colores por posición mundial ANTES de centrar la pieza en su centroide */
    var pos = geo.attributes.position;
    var colores = new Float32Array(pos.count * 3);
    for (var i = 0; i < pos.count; i++) {
      var c = colorEnX(pos.getX(i));
      colores[i * 3] = c.r; colores[i * 3 + 1] = c.g; colores[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));

    /* centrar la geometría en su centroide para que las rotaciones
       individuales pivoten sobre la propia pieza, no sobre el origen */
    geo.computeBoundingBox();
    var centro = new THREE.Vector3();
    geo.boundingBox.getCenter(centro);
    geo.translate(-centro.x, -centro.y, 0);
    geo.computeBoundingBox();          /* caja final, para el auto-encuadre */

    var pieza = new THREE.Mesh(geo, material);
    pieza.position.set(centro.x, centro.y, 0);
    pieza.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), materialAristas));

    /* dirección de despiece: sobre todo en profundidad, con matiz radial */
    var radial = new THREE.Vector3(centro.x, centro.y, 0).normalize();
    pieza.userData = {
      base: centro.clone(),
      dir: new THREE.Vector3().addScaledVector(radial, 0.3).addScaledVector(new THREE.Vector3(0, 0, 1), v[2]).normalize(),
      balanceo: v[3],
      fase: Math.random() * 6.283
    };

    piezas.push(pieza);
    piezasG.add(pieza);
  });

  var grupo = new THREE.Group();
  grupo.add(piezasG);
  escena.add(grupo);

  /* iluminación de estudio + luz viajera para el brillo de unión */
  escena.add(new THREE.AmbientLight(0xffffff, 0.55));
  var luzClave = new THREE.DirectionalLight(0xffffff, 2.1);
  luzClave.position.set(5, 7, 9);
  escena.add(luzClave);
  var luzRelleno = new THREE.DirectionalLight(0xffffff, 0.6);
  luzRelleno.position.set(-4, 2, 6);
  escena.add(luzRelleno);
  var luzBorde = new THREE.DirectionalLight(0x9fc8ff, 1.1);
  luzBorde.position.set(-6, -4, -7);
  escena.add(luzBorde);
  var luzBrillo = new THREE.PointLight(0xffffff, 0, 14, 2);
  luzBrillo.position.set(0, 2, 4);
  escena.add(luzBrillo);

  /* ================= 2. COREOGRAFÍA ================= */

  var INICIO = 3.2;        /* tras la secuencia del texto */
  var CADENCIA = 0.28;     /* retardo entre piezas */
  var DURACION = 1.15;     /* vuelo de cada pieza */

  var objRotX = 0, objRotY = 0;
  var objDespiece = 0, despiece = 0, despiecePrev = 0;
  var ensamblado = false;
  var brilloT0 = -10, ultimoBrillo = -10;

  /* juego: cada pocos segundos, una pieza se aleja y hace una travesura antes
     de volver a encajar — cada vez un movimiento distinto, elegido al azar */
  var JUEGO_CADA = 6.5;
  var juegoPieza = -1, juegoT0 = 0, juegoDur = 2.4, juegoEstilo = 0, ultimoJuego = 0;

  /* Física de las travesuras, pensada para que nunca haya trompicones ni
     choques con las piezas vecinas:
     - la SALIDA es una meseta (sale → se mantiene fuera → vuelve), y los giros
       solo ocurren DENTRO de la meseta, cuando ya hay holgura con las vecinas;
     - toda rotación termina exactamente en 0 o en vueltas completas, así el
       re-encaje es continuo (nada de recolocarse de golpe);
     - además, mientras una pieza juega, las otras tres se apartan un poco
       ("le hacen sitio"), lo que añade margen y se lee como complicidad. */
  function suave01(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
  function meseta(js) { return suave01(js / 0.28) * (1 - suave01((js - 0.72) / 0.28)); }
  function faseGiro(js) { return suave01((js - 0.22) / 0.56); }   /* 0→1 dentro de la meseta */

  var ESTILOS_JUEGO = [
    /* 0. voltereta: vuelta completa sobre su eje horizontal */
    { dur: 2.4, mover: function (js) {
        return { salida: meseta(js) * 2.8, rx: faseGiro(js) * Math.PI * 2, ry: 0, rz: 0 };
      } },
    /* 1. peonza: gira como una moneda sobre su eje vertical */
    { dur: 2.2, mover: function (js) {
        return { salida: meseta(js) * 1.9, rx: 0, ry: faseGiro(js) * Math.PI * 2, rz: 0 };
      } },
    /* 2. doble tirabuzón: dos vueltas seguidas, más nerviosa */
    { dur: 2.0, mover: function (js) {
        return { salida: meseta(js) * 2.8, rx: faseGiro(js) * Math.PI * 4, ry: 0, rz: 0 };
      } },
    /* 3. bamboleo: se asoma y menea de lado a lado, sin girar del todo */
    { dur: 2.6, mover: function (js) {
        var m = meseta(js);
        return { salida: m * 2.2, rx: 0, ry: 0, rz: Math.sin(js * Math.PI * 5) * 0.4 * m };
      } },
    /* 4. voltereta ladeada: vuelta completa con una inclinación que va y vuelve */
    { dur: 2.3, mover: function (js) {
        var m = meseta(js);
        return { salida: m * 2.9, rx: faseGiro(js) * Math.PI * 2, ry: 0, rz: Math.sin(Math.PI * js) * 0.55 };
      } },
    /* 5. asomo curioso: sale poco y rápido, se inclina apenas, y vuelve */
    { dur: 1.3, mover: function (js) {
        var m = meseta(js);
        return { salida: m * 1.7, rx: m * 0.25, ry: m * 0.35, rz: 0 };
      } }
  ];

  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    objRotY = ((e.clientX - r.left) / r.width - 0.5) * 0.55;
    objRotX = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    var v = visual.getBoundingClientRect();
    var dx = e.clientX - (v.left + v.width / 2);
    var dy = e.clientY - (v.top + v.height / 2);
    objDespiece = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (v.width * 0.7));
  }, { passive: true });
  hero.addEventListener('mouseleave', function () { objRotX = 0; objRotY = 0; objDespiece = 0; });

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { visible = en.isIntersecting; });
    }, { threshold: 0 }).observe(visual);
  }

  imagen.style.transition = 'opacity .8s ease';
  renderer.domElement.style.opacity = '0';
  renderer.domElement.style.transition = 'opacity .9s ease';
  setTimeout(function () { renderer.domElement.style.opacity = '1'; }, 2900);

  function lanzarBrillo(t) {
    if (t - ultimoBrillo < 2.5) return;
    brilloT0 = t;
    ultimoBrillo = t;
  }

  function suavizar(x) { return 1 - Math.pow(1 - x, 3); }

  var reloj = new THREE.Clock();
  (function animar() {
    requestAnimationFrame(animar);
    if (!visible) return;
    reloj.getDelta();
    var t = reloj.elapsedTime;
    var k, p, u;

    if (!ensamblado) {
      /* --- fase 1: las piezas llegan por separado y se ensamblan --- */
      var completas = 0;
      for (k = 0; k < piezas.length; k++) {
        p = piezas[k]; u = p.userData;
        var prog = Math.min(1, Math.max(0, (t - INICIO - k * CADENCIA) / DURACION));
        var e = suavizar(prog);
        p.position.copy(u.base).addScaledVector(u.dir, (1 - e) * 7);
        p.rotation.z = (1 - e) * u.balanceo;
        p.rotation.x = (1 - e) * u.balanceo * 0.5;
        if (prog >= 1) completas++;
      }
      grupo.rotation.y = (1 - suavizar(Math.min(1, Math.max(0, (t - INICIO) / (INICIO * 0.6))))) * -0.9;
      if (completas === piezas.length) {
        ensamblado = true;
        lanzarBrillo(t);              /* ¡se tocan todas: brillo de unión! */
      }
    } else {
      /* --- fase 2: reposo con respiración, juego y despiece por proximidad --- */
      despiece += (objDespiece - despiece) * 0.07;

      /* al volver a encajar tras una separación clara, otro brillo */
      if (despiecePrev > 0.3 && despiece < 0.06) lanzarBrillo(t);
      despiecePrev = despiece;

      /* girando más rápido mientras está abierto */
      grupo.rotation.y += 0.0022 + despiece * 0.02;

      /* juego: si llevamos un rato tranquilos, una pieza sale con una travesura
         distinta cada vez (movimiento y duración elegidos al azar) */
      if (juegoPieza < 0 && despiece < 0.1 && t - ultimoJuego > JUEGO_CADA) {
        juegoPieza = Math.floor(Math.random() * piezas.length);
        juegoEstilo = Math.floor(Math.random() * ESTILOS_JUEGO.length);
        juegoDur = ESTILOS_JUEGO[juegoEstilo].dur * (0.9 + Math.random() * 0.25);
        juegoT0 = t;
      }

      var calma = 1 - Math.min(1, despiece * 4);
      /* cuánto se apartan las demás mientras una juega ("le hacen sitio") */
      var js = juegoPieza >= 0 ? Math.min(1, (t - juegoT0) / juegoDur) : 0;
      var sitio = juegoPieza >= 0 ? meseta(js) * 0.35 : 0;

      for (k = 0; k < piezas.length; k++) {
        p = piezas[k]; u = p.userData;

        if (k === juegoPieza) {
          /* travesura del estilo elegido; siempre vuelve exactamente a su sitio */
          var mov = ESTILOS_JUEGO[juegoEstilo].mover(js);
          p.position.copy(u.base).addScaledVector(u.dir, mov.salida + despiece * 0.85);
          p.rotation.x = mov.rx;
          p.rotation.y = mov.ry;
          p.rotation.z = mov.rz + despiece * 0.1 * u.balanceo;
          if (js >= 1) {
            p.rotation.set(0, 0, 0);
            juegoPieza = -1;
            ultimoJuego = t;
            lanzarBrillo(t);                                        /* re-encaja: brillo */
          }
          continue;
        }

        /* respiración: de vez en cuando una pieza rota un poco y se re-asienta */
        var s = Math.sin(t * 0.25 + u.fase);
        var respiro = s * s * s * calma;
        p.position.copy(u.base)
          .addScaledVector(u.dir, despiece * 0.85 + respiro * 0.05 + sitio);
        p.rotation.z = respiro * 0.03 + despiece * 0.1 * u.balanceo;
        p.rotation.x = respiro * 0.015;
      }
      piezasG.rotation.y += (objRotY - piezasG.rotation.y) * 0.06;
      var inclinacion = Math.max(-0.35, Math.min(0.35, objRotX + window.scrollY * 0.0009));
      piezasG.rotation.x += (inclinacion - piezasG.rotation.x) * 0.06;
    }

    /* --- brillo que recorre las aristas de la geometría --- */
    var bs = (t - brilloT0) / 1.1;
    if (bs >= 0 && bs <= 1) {
      var onda = Math.sin(Math.PI * bs);
      luzBrillo.position.set(-9 + 18 * bs, 2.2, 3.6);
      luzBrillo.intensity = onda * 55;
      materialAristas.opacity = 0.14 + onda * 0.5;
    } else {
      luzBrillo.intensity = 0;
      materialAristas.opacity = 0.14;
    }

    /* posición y escala del grupo: centrado en la zona libre + flotación */
    grupo.scale.setScalar(escalaBase);
    grupo.position.x = basePosX;
    grupo.position.y = basePosY + Math.sin(t * 0.7) * 0.35 * escalaBase;

    renderer.render(escena, camara);
  })();
})();
