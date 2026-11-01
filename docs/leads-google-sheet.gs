/**
 * Recibe los leads del formulario de stratafactory.cl y los guarda en una hoja de Google.
 *
 * Instalación (una sola vez):
 * 1. Crea una Google Sheet nueva (ej. "Leads Strata Factory").
 * 2. Extensiones > Apps Script. Pega este archivo completo y guarda.
 * 3. Implementar > Nueva implementación > tipo "Aplicación web".
 *      Ejecutar como: Yo
 *      Quién tiene acceso: Cualquier persona
 * 4. Copia la URL que termina en /exec y pégala en index.html, en
 *    <form id="leadForm" data-endpoint="AQUÍ">.
 * 5. Si cambias este código, debes crear una NUEVA versión de la implementación.
 *
 * Opcional: pon un correo en NOTIFY para recibir aviso por cada lead.
 */
var SHEET_NAME = 'Leads';
var NOTIFY = ''; // ej. 'contacto@stratafactory.cl'
var HEADERS = ['Fecha', 'Nombre', 'WhatsApp', 'Rubro', 'Email', 'Página de entrada', 'Referrer',
               'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var o = d.origen || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      new Date(d.fecha || Date.now()), d.nombre, "'" + d.whatsapp, d.rubro, d.email,
      o.landing, o.referrer, o.utm_source, o.utm_medium, o.utm_campaign, o.utm_term, o.utm_content
    ]);
    if (NOTIFY) {
      MailApp.sendEmail(NOTIFY, 'Nuevo lead: ' + d.nombre,
        'Nombre: ' + d.nombre + '\nWhatsApp: ' + d.whatsapp + '\nRubro: ' + d.rubro +
        '\nEmail: ' + (d.email || '-') + '\nOrigen: ' + (o.utm_source || o.referrer || o.landing || '-'));
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
