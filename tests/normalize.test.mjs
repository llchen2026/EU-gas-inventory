import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLatestSnapshot,
  buildHistorySeries,
  normalizeAgsiRecord,
} from "../scripts/shared/normalize.mjs";

test("normalizeAgsiRecord converts numeric AGSI fields into frontend-safe numbers", () => {
  const row = normalizeAgsiRecord({
    code: "de",
    name: "Germany",
    gasDayStart: "2026-04-07",
    gasInStorage: "180.2200",
    workingGasVolume: "245.1000",
    full: "73.52",
    injection: "95.4",
    withdrawal: "24.1",
    netWithdrawal: "-71.3",
    status: "C",
  });

  assert.deepEqual(row, {
    code: "de",
    name: "Germany",
    gasDayStart: "2026-04-07",
    gasInStorageTWh: 180.22,
    workingGasVolumeTWh: 245.1,
    fullPct: 73.52,
    injectionGWhPerDay: 95.4,
    withdrawalGWhPerDay: 24.1,
    netWithdrawalGWhPerDay: -71.3,
    status: "C",
  });
});

test("buildLatestSnapshot derives day-over-day fullness changes for countries", () => {
  const current = [
    {
      code: "de",
      name: "Germany",
      gasDayStart: "2026-04-07",
      gasInStorage: "180.2200",
      workingGasVolume: "245.1000",
      full: "73.52",
      injection: "95.4",
      withdrawal: "24.1",
      netWithdrawal: "-71.3",
      status: "C",
    },
  ];
  const previous = [
    {
      code: "de",
      name: "Germany",
      gasDayStart: "2026-04-06",
      gasInStorage: "179.9200",
      workingGasVolume: "245.1000",
      full: "73.30",
      injection: "91.2",
      withdrawal: "25.3",
      netWithdrawal: "-65.9",
      status: "C",
    },
  ];

  assert.deepEqual(buildLatestSnapshot(current, previous), [
    {
      code: "de",
      name: "Germany",
      gasDayStart: "2026-04-07",
      gasInStorageTWh: 180.22,
      workingGasVolumeTWh: 245.1,
      fullPct: 73.52,
      injectionGWhPerDay: 95.4,
      withdrawalGWhPerDay: 24.1,
      netWithdrawalGWhPerDay: -71.3,
      status: "C",
      dayOverDayFullPctChange: 0.22,
    },
  ]);
});

test("buildHistorySeries sorts rows ascending and keeps only chart fields", () => {
  const history = buildHistorySeries([
    {
      gasDayStart: "2026-04-07",
      gasInStorage: "180.2200",
      full: "73.52",
    },
    {
      gasDayStart: "2026-04-06",
      gasInStorage: "179.9200",
      full: "73.30",
    },
  ]);

  assert.deepEqual(history, [
    { date: "2026-04-06", fullPct: 73.3, gasInStorageTWh: 179.92 },
    { date: "2026-04-07", fullPct: 73.52, gasInStorageTWh: 180.22 },
  ]);
});
