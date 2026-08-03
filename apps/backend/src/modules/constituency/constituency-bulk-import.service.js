import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/responseFormatter.js';

const REQUIRED_COLUMNS = ['name', 'state', 'population', 'genderRatio', 'literacyRate', 'urbanPercent'];

/**
 * CI-D-004/AD-C-004: minimal CSV parser (no external dependency) — good
 * enough for well-formed exports from Excel/Google Sheets. Doesn't handle
 * quoted commas within fields; swap for a proper CSV library (papaparse on
 * the frontend already covers preview) if real-world files need that.
 */
export function parseConstituencyCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) throw new ApiError(400, 'CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) throw new ApiError(400, `CSV is missing required columns: ${missing.join(', ')}`);

  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));

    return {
      name: row.name,
      state: row.state,
      population: Number(row.population),
      genderRatio: Number(row.genderRatio),
      literacyRate: Number(row.literacyRate),
      urbanPercent: Number(row.urbanPercent),
      pastWinner: row.pastWinner || null,
      pastWinnerParty: row.pastWinnerParty || null,
      victoryMarginVotes: row.victoryMarginVotes ? Number(row.victoryMarginVotes) : null,
      victoryMarginPercent: row.victoryMarginPercent ? Number(row.victoryMarginPercent) : null,
      dataSource: row.dataSource || null,
      _rowNumber: idx + 2, // +2: 1-indexed, plus header row
    };
  });
}

// CI-D-005: validation before persisting
export function validateRow(row) {
  const errors = [];
  if (!row.name) errors.push('name is required');
  if (!row.state) errors.push('state is required');
  if (!(row.population > 0)) errors.push('population must be > 0');
  if (!(row.genderRatio >= 800 && row.genderRatio <= 1200)) errors.push('genderRatio must be between 800-1200');
  if (!(row.literacyRate >= 0 && row.literacyRate <= 100)) errors.push('literacyRate must be 0-100');
  return errors;
}

export async function bulkImport(csvText) {
  const rows = parseConstituencyCsv(csvText);
  const results = { created: 0, updated: 0, failed: [] };

  for (const row of rows) {
    const errors = validateRow(row);
    if (errors.length > 0) {
      results.failed.push({ row: row._rowNumber, errors });
      continue;
    }

    const { _rowNumber, ...data } = row;
    const existing = await prisma.constituency.findUnique({
      where: { name_state: { name: data.name, state: data.state } },
    });

    if (existing) {
      await prisma.constituency.update({ where: { id: existing.id }, data });
      results.updated += 1;
    } else {
      await prisma.constituency.create({ data });
      results.created += 1;
    }
  }

  return results;
}
