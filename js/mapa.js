/* Mapa interactivo de proyectos — datos extraídos de la web original (hotspots Woodmart) */
(function () {
  'use strict';

  var lienzo = document.getElementById('mapa-lienzo');
  var popover = document.getElementById('mapa-popover');
  var titulo = document.getElementById('mapa-titulo');
  var num = document.getElementById('mapa-num');
  var lista = document.getElementById('mapa-lista');
  if (!lienzo || !popover || !titulo || !num || !lista) return;

  /* [nombre, left%, top%, proyectos["Tipo de trabajo · detalle"]] */
  var PAISES = [
    ['Madrid, España', 47.209, 44.927, [
      '18 Proyectos de Ejecución · Oficinas · 76.000 m² totales',
      'MEP y Coordinación · Residencial · 22.000 m²',
      'As-Built · Industrial · 20.000 m²',
      'As-Built · Oficinas · 18.000 m²',
      'Modelado y Coordinación MEP · Uso mixto · 12.000 m²',
      'Gemelo Digital · Hotel · 6.200 m²',
      'As-Built · Oficinas · 6.000 m²',
      'Proyecto de Ejecución · Rehabilitación · 4.750 m²',
      'As-Built · Oficinas · 3.050 m²',
      'MVP Gemelo Digital · Retail · 1.000 m²',
      'Proyecto de Ejecución · Restaurante · 700 m²',
      'Implantación BIM · Formación · 5 personas'
    ]],
    ['España — otras ciudades', 47.961, 43.397, [
      'Proyecto Básico · Residencial · Málaga · 6.000 m²',
      'Proyecto de Ejecución · Hotel · Canarias · 5.000 m²',
      'As-Built · Oficinas · Barcelona · 3.800 m²',
      'Proyecto Básico · Residencial · Lanzarote · 3.600 m²',
      'Proyecto de Ejecución · Oficinas · Barcelona · 1.400 m²',
      'Proyecto de Ejecución · Oficinas · Zaragoza · 1.200 m²',
      'Proyecto de Ejecución · Oficinas · Barcelona · 1.080 m²',
      'Proyecto de Ejecución · Oficinas · Barcelona · 800 m²',
      'Implantación BIM · Málaga · 3 personas'
    ]],
    ['Reino Unido', 47.752, 37.307, [
      'Nube de Puntos · Rehabilitación · Guildford · 16.000 m²',
      'Nube de Puntos · Retail · Londres · 500 m²',
      'Implantación BIM · Formación · Londres · 40 personas'
    ]],
    ['Países Bajos', 49.358, 37.497, [
      'Nube de Puntos · Retail · Róterdam · 8.800 m²'
    ]],
    ['Francia', 48.822, 40.923, [
      'As-Built · Retail · París · 4.000 m²',
      'Nube de Puntos · Retail · Caen · 3.340 m²',
      'Nube de Puntos · Retail · Baton Rouge · 2.300 m²'
    ]],
    ['Polonia', 52.677, 37.687, [
      'Nube de Puntos · Retail · Cracovia · 580 m²'
    ]],
    ['República Checa', 51.927, 39.4, [
      'Proyecto de Ejecución · Retail · Praga'
    ]],
    ['Italia', 50.964, 43.017, [
      'As-Built · Retail · Milán · 800 m²'
    ]],
    ['Grecia', 53.747, 46.253, [
      'Modelado y Coordinación · Residencial · Atenas · 1.200 m²',
      'Modelado y Coordinación · Residencial · Atenas · 800 m²',
      'Modelado y Coordinación · Residencial · Varzika · 800 m²'
    ]],
    ['Estados Unidos', 23.873, 44.353, [
      'Coordinación y Clash Detection · Houston · 28.000 m²',
      'Coordinación y Clash Detection · Dallas · 23.000 m²',
      'Modelado de Electricidad · Dallas · 5.000 m²'
    ]],
    ['Canadá', 23.34, 30.645, [
      'Nube de Puntos · Retail · Winnipeg · 1.200 m²'
    ]],
    ['México', 22.484, 54.247, [
      'Nube de Puntos · Retail · Tijuana · 500 m²'
    ]],
    ['República Dominicana', 30.621, 55.77, [
      'Modelado Paramétrico · Restaurante · 4.000 m²'
    ]],
    ['Senegal', 44.54, 57.863, [
      'Proyecto Básico · Hospital · Dakar · 70.000 m²'
    ]],
    ['Emiratos Árabes Unidos', 62.206, 52.915, [
      'Modelado · Retail · Dubái · 500.000 m²'
    ]],
    ['Arabia Saudí', 59.208, 53.486, [
      'Modelado de Anteproyecto · Masterplan · 392.000 m²',
      'Anteproyecto · Masterplan · Al Wajh · 40.000 m²'
    ]],
    ['India', 68.094, 55.199, [
      'Ejecución de Fachadas · Uso mixto · Hyderabad · 385.000 m²',
      'Anteproyecto · Masterplan · Bombay · 260.000 m²',
      'Proyecto Básico · Hotel · Bombay · 38.900 m²'
    ]],
    ['Japón', 82.976, 44.73, [
      'Nube de Puntos · Retail · Fukuoka · 2.500 m²'
    ]],
    ['Islas Mauricio', 61.563, 73.852, [
      'Proyecto Básico · Oficinas · Ebene · 27.700 m²'
    ]]
  ];

  /* [name, left%, top%, projects["Work type · detail"]] — English version, same coordinates as PAISES */
  var PAISES_EN = [
    ['Madrid, Spain', 47.209, 44.927, [
      '18 Construction Documents projects · Offices · 76,000 m² total',
      'MEP and Coordination · Residential · 22,000 m²',
      'As-Built · Industrial · 20,000 m²',
      'As-Built · Offices · 18,000 m²',
      'Modeling and MEP Coordination · Mixed use · 12,000 m²',
      'Digital Twin · Hotel · 6,200 m²',
      'As-Built · Offices · 6,000 m²',
      'Construction Documents · Refurbishment · 4,750 m²',
      'As-Built · Offices · 3,050 m²',
      'MVP Digital Twin · Retail · 1,000 m²',
      'Construction Documents · Restaurant · 700 m²',
      'BIM Implementation · Training · 5 people'
    ]],
    ['Spain — other cities', 47.961, 43.397, [
      'Schematic Design · Residential · Málaga · 6,000 m²',
      'Construction Documents · Hotel · Canary Islands · 5,000 m²',
      'As-Built · Offices · Barcelona · 3,800 m²',
      'Schematic Design · Residential · Lanzarote · 3,600 m²',
      'Construction Documents · Offices · Barcelona · 1,400 m²',
      'Construction Documents · Offices · Zaragoza · 1,200 m²',
      'Construction Documents · Offices · Barcelona · 1,080 m²',
      'Construction Documents · Offices · Barcelona · 800 m²',
      'BIM Implementation · Málaga · 3 people'
    ]],
    ['United Kingdom', 47.752, 37.307, [
      'Point Cloud · Refurbishment · Guildford · 16,000 m²',
      'Point Cloud · Retail · London · 500 m²',
      'BIM Implementation · Training · London · 40 people'
    ]],
    ['Netherlands', 49.358, 37.497, [
      'Point Cloud · Retail · Rotterdam · 8,800 m²'
    ]],
    ['France', 48.822, 40.923, [
      'As-Built · Retail · Paris · 4,000 m²',
      'Point Cloud · Retail · Caen · 3,340 m²',
      'Point Cloud · Retail · Baton Rouge · 2,300 m²'
    ]],
    ['Poland', 52.677, 37.687, [
      'Point Cloud · Retail · Krakow · 580 m²'
    ]],
    ['Czech Republic', 51.927, 39.4, [
      'Construction Documents · Retail · Prague'
    ]],
    ['Italy', 50.964, 43.017, [
      'As-Built · Retail · Milan · 800 m²'
    ]],
    ['Greece', 53.747, 46.253, [
      'Modeling and Coordination · Residential · Athens · 1,200 m²',
      'Modeling and Coordination · Residential · Athens · 800 m²',
      'Modeling and Coordination · Residential · Varzika · 800 m²'
    ]],
    ['United States', 23.873, 44.353, [
      'Coordination and Clash Detection · Houston · 28,000 m²',
      'Coordination and Clash Detection · Dallas · 23,000 m²',
      'Electrical Modeling · Dallas · 5,000 m²'
    ]],
    ['Canada', 23.34, 30.645, [
      'Point Cloud · Retail · Winnipeg · 1,200 m²'
    ]],
    ['Mexico', 22.484, 54.247, [
      'Point Cloud · Retail · Tijuana · 500 m²'
    ]],
    ['Dominican Republic', 30.621, 55.77, [
      'Parametric Modeling · Restaurant · 4,000 m²'
    ]],
    ['Senegal', 44.54, 57.863, [
      'Schematic Design · Hospital · Dakar · 70,000 m²'
    ]],
    ['United Arab Emirates', 62.206, 52.915, [
      'Modeling · Retail · Dubai · 500,000 m²'
    ]],
    ['Saudi Arabia', 59.208, 53.486, [
      'Concept Design Modeling · Masterplan · 392,000 m²',
      'Concept Design · Masterplan · Al Wajh · 40,000 m²'
    ]],
    ['India', 68.094, 55.199, [
      'Facade Delivery · Mixed use · Hyderabad · 385,000 m²',
      'Concept Design · Masterplan · Bombay · 260,000 m²',
      'Schematic Design · Hotel · Bombay · 38,900 m²'
    ]],
    ['Japan', 82.976, 44.73, [
      'Point Cloud · Retail · Fukuoka · 2,500 m²'
    ]],
    ['Mauritius', 61.563, 73.852, [
      'Schematic Design · Offices · Ebene · 27,700 m²'
    ]]
  ];

  var EN = document.documentElement.lang === 'en';
  var DATOS = EN ? PAISES_EN : PAISES;

  var activo = null;
  var temporizadorCierre = null;
  var esMovil = function () { return window.matchMedia('(max-width: 860px)').matches; };

  function rellenar(pais) {
    titulo.textContent = pais[0];
    var n = pais[3].length;
    num.textContent = n + (EN ? (n === 1 ? ' project' : ' projects') : (n === 1 ? ' proyecto' : ' proyectos'));
    lista.innerHTML = '';
    pais[3].forEach(function (p) {
      var li = document.createElement('li');
      var sep = p.indexOf(' · ');
      if (sep > -1) {
        var b = document.createElement('strong');
        b.textContent = p.slice(0, sep);
        li.appendChild(b);
        li.appendChild(document.createTextNode(' · ' + p.slice(sep + 3)));
      } else {
        li.textContent = p;
      }
      lista.appendChild(li);
    });
  }

  function abrir(pais, boton) {
    clearTimeout(temporizadorCierre);
    if (activo) activo.classList.remove('activo');
    activo = boton;
    boton.classList.add('activo');
    rellenar(pais);

    if (!esMovil()) {
      /* Ancla junto al marcador, volteando cerca de los bordes del mapa */
      var izquierda = pais[1] < 55;
      var arriba = pais[2] > 52;
      popover.style.left = izquierda ? 'calc(' + pais[1] + '% + 22px)' : 'auto';
      popover.style.right = izquierda ? 'auto' : 'calc(' + (100 - pais[1]) + '% + 22px)';
      if (arriba) {
        popover.style.top = 'auto';
        popover.style.bottom = (100 - pais[2] - 4) + '%';
      } else {
        popover.style.top = Math.max(pais[2] - 4, 0) + '%';
        popover.style.bottom = 'auto';
      }
    } else {
      popover.style.left = popover.style.right = popover.style.top = popover.style.bottom = '';
    }
    popover.classList.add('visible');
  }

  function programarCierre() {
    clearTimeout(temporizadorCierre);
    temporizadorCierre = setTimeout(function () {
      popover.classList.remove('visible');
      if (activo) { activo.classList.remove('activo'); activo = null; }
    }, 350);
  }

  /* El popover se mantiene abierto mientras el cursor esté sobre él */
  popover.addEventListener('mouseenter', function () { clearTimeout(temporizadorCierre); });
  popover.addEventListener('mouseleave', programarCierre);

  DATOS.forEach(function (pais) {
    var btn = document.createElement('button');
    btn.className = 'mapa-marcador';
    btn.type = 'button';
    btn.style.left = pais[1] + '%';
    btn.style.top = pais[2] + '%';
    btn.setAttribute('aria-label', pais[0] + (EN ? ': view projects' : ': ver proyectos'));
    btn.addEventListener('click', function () { abrir(pais, btn); });
    btn.addEventListener('mouseenter', function () { abrir(pais, btn); });
    btn.addEventListener('mouseleave', programarCierre);
    btn.addEventListener('focus', function () { abrir(pais, btn); });
    btn.addEventListener('blur', programarCierre);
    lienzo.appendChild(btn);
  });

  /* En móvil, tocar fuera cierra el panel */
  document.addEventListener('click', function (e) {
    if (!lienzo.contains(e.target)) {
      popover.classList.remove('visible');
      if (activo) { activo.classList.remove('activo'); activo = null; }
    }
  });
})();
