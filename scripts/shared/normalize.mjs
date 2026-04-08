function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, digits = 2) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value.toFixed(digits));
}

export function normalizeAgsiRecord(record) {
  return {
    code: record.code,
    name: record.name,
    gasDayStart: record.gasDayStart,
    gasInStorageTWh: round(toNumber(record.gasInStorage)),
    workingGasVolumeTWh: round(toNumber(record.workingGasVolume)),
    fullPct: round(toNumber(record.full)),
    injectionGWhPerDay: round(toNumber(record.injection)),
    withdrawalGWhPerDay: round(toNumber(record.withdrawal)),
    netWithdrawalGWhPerDay: round(toNumber(record.netWithdrawal)),
    status: record.status ?? "N/A",
  };
}

export function buildLatestSnapshot(currentRows, previousRows = []) {
  const previousByCode = new Map(
    previousRows.map((row) => [row.code, normalizeAgsiRecord(row)]),
  );

  return currentRows.map((row) => {
    const current = normalizeAgsiRecord(row);
    const previous = previousByCode.get(current.code);
    const delta =
      previous?.fullPct !== null && previous?.fullPct !== undefined
        ? round(current.fullPct - previous.fullPct)
        : null;

    return {
      ...current,
      dayOverDayFullPctChange: delta,
    };
  });
}

export function buildHistorySeries(rows) {
  return rows
    .map((row) => ({
      date: row.gasDayStart,
      fullPct: round(toNumber(row.full)),
      gasInStorageTWh: round(toNumber(row.gasInStorage)),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}
