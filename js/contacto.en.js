/* Comportamiento de la página de contacto, versión en inglés.

   Va aparte del español porque los mensajes de estado del formulario están
   traducidos dentro del código. Al sacar los scripts en línea a archivo se
   unificaron por error los dos y la página inglesa mostraba textos en
   español; de ahí que sean dos archivos.

   Lo suyo sería que los textos salieran del HTML con atributos `data-`, y
   entonces un único archivo valdría para los dos idiomas. Queda apuntado. */

/* Form submission with states: Sending… → animated success check / clear error */
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
    boton.textContent = 'Sending…';

    /* Netlify recoge el formulario en cualquier ruta del propio sitio. Se
       envia urlencoded, que es lo que espera: con multipart no lo registra.
       `form-name` viaja dentro del FormData y es lo que le dice cual es. */
    fetch(location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('estado ' + r.status);
      form.closest('.tarjeta').innerHTML =
        '<div class="formulario__exito">' +
        '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25"/><path d="M15 27l7 7 15-16"/></svg>' +
        '<h3>Message sent</h3>' +
        '<p>Thank you for reaching out. We will get back to you shortly.</p>' +
        '</div>';
    }).catch(function () {
      boton.disabled = false;
      boton.textContent = 'Send message';
      aviso.className = 'formulario__aviso error';
      aviso.textContent = 'Your message could not be sent. Please try again or email us directly at info@oodimensions.com.';
    });
  });
})();
