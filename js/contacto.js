/* Página de contacto: envío del formulario con estados */
(function () {
  'use strict';
  var form = document.querySelector('form.formulario');
  var boton = document.getElementById('form-enviar');
  var aviso = document.getElementById('form-aviso');
  if (!form || !boton) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    aviso.className = 'formulario__aviso';
    boton.disabled = true;
    boton.textContent = 'Enviando…';

    /* Netlify lo quiere urlencoded y a la raíz: con multipart no lo registra */
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('estado ' + r.status);
      form.closest('.tarjeta').innerHTML =
        '<div class="formulario__exito">' +
        '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M15 27l7 7 15-16"/></svg>' +
        '<h3>Mensaje enviado</h3>' +
        '<p>Gracias por escribirnos. Te responderemos muy pronto en el email que nos has dejado.</p>' +
        '</div>';
    }).catch(function () {
      boton.disabled = false;
      boton.textContent = 'Enviar mensaje';
      aviso.className = 'formulario__aviso error';
      aviso.textContent = 'No se ha podido enviar el mensaje. Inténtalo de nuevo o escríbenos directamente a info@oodimensions.com.';
    });
  });
})();
