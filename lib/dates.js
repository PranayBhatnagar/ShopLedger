// Date utilities for ShopLedger (Indian DD/MM/YYYY format)

function pad2(n) {
  return ('0' + n).slice(-2);
}

exports.today = function () {
  var d = new Date();
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
};

// Convert stored dates to the same sortable format as the date picker.
exports.normalizeDateKey = function (str) {
  if (!str) return '';
  var value = String(str).trim();
  var stored = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return stored ? stored[3] + '-' + pad2(stored[2]) + '-' + pad2(stored[1]) : value;
};

exports.getFiscalYear = function (dateStr) {
  var key = exports.normalizeDateKey(dateStr);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return 'FY21-22';
  var parts = key.split('-');
  var year = Number(parts[0]);
  var month = Number(parts[1]);
  if (month >= 4) {
    return 'FY' + String(year).slice(-2) + '-' + String(year + 1).slice(-2);
  }
  return 'FY' + String(year - 1).slice(-2) + '-' + String(year).slice(-2);
};
