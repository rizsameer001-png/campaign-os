/**
 * Minimal CSV builder — no external dependency, mirrors the parser in
 * constituency-bulk-import.service.js. Good enough for admin exports of
 * flat row data; doesn't handle nested objects (flatten before calling).
 */
export function toCsv(rows, columns) {
  const escape = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}
