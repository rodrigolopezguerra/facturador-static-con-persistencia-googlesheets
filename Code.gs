// Configuración — cambiá estos valores
// Antes de deployar: reemplazá estos valores con los tuyos
var CONFIG = {
  SPREADSHEET_ID: 'TU_SPREADSHEET_ID',
  TOKEN: 'TU_TOKEN_SECRETO'
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    var params = e.parameter;
    var token = params.token;
    var action = params.action;
    var sheet = params.sheet || 'Facturas';

    if (token !== CONFIG.TOKEN) {
      return sendJson({ status: 'error', message: 'Token inválido' }, headers);
    }

    var spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var ws = spreadsheet.getSheetByName(sheet);

    if (!ws) {
      return sendJson({ status: 'error', message: 'Sheet "' + sheet + '" no encontrada. Creala primero.' }, headers);
    }

    if (action === 'read') {
      return handleRead(ws, headers);
    } else if (action === 'write') {
      return handleWrite(ws, params, headers);
    } else {
      return sendJson({ status: 'error', message: 'Action "' + action + '" no soportada' }, headers);
    }
  } catch (e) {
    return sendJson({ status: 'error', message: e.toString() }, headers);
  }
}

function handleRead(ws, headers) {
  var data = ws.getDataRange().getValues();
  if (data.length < 2) {
    return sendJson({ status: 'success', data: [] }, headers);
  }

  var keys = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < keys.length; j++) {
      row[keys[j]] = data[i][j];
    }
    rows.push(row);
  }

  return sendJson({ status: 'success', data: rows }, headers);
}

function handleWrite(ws, params, headers) {
  var lastRow = ws.getLastRow();

  if (lastRow === 0) {
    // Auto-detect column keys from params
    var keys = Object.keys(params).filter(function(k) { return k !== 'action' && k !== 'sheet' && k !== 'token'; });
    ws.appendRow(keys);
    ws.appendRow(keys.map(function(k) { return params[k]; }));
    return sendJson({ status: 'success', message: 'Sheet creada y datos guardados' }, headers);
  }

  var headerRange = ws.getRange(1, 1, 1, ws.getLastColumn());
  var headerRow = headerRange.getValues()[0];
  var row = [];

  for (var i = 0; i < headerRow.length; i++) {
    row.push(params[headerRow[i]] || '');
  }

  ws.appendRow(row);
  return sendJson({ status: 'success', message: 'Datos guardados' }, headers);
}

function sendJson(data, headers) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
