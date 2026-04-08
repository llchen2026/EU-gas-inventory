import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { fetchAgsiPage, fetchAgsiRange } from "./shared/agsi-client.mjs";
import { COUNTRIES, KEY_COUNTRIES } from "./shared/countries.mjs";
import { buildHistorySeries, buildLatestSnapshot, normalizeAgsiRecord } from "./shared/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "data");

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function sampleHistory(startFull, endFull, startStorage, endStorage) {
  const dates = ["2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07"];
  return dates.map((date, index) => {
    const ratio = index / (dates.length - 1);
    return {
      date,
      fullPct: Number((startFull + (endFull - startFull) * ratio).toFixed(2)),
      gasInStorageTWh: Number(
        (startStorage + (endStorage - startStorage) * ratio).toFixed(2),
      ),
    };
  });
}

function buildSampleData() {
  const countries = [
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
    {
      code: "it",
      name: "Italy",
      gasDayStart: "2026-04-07",
      gasInStorageTWh: 141.33,
      workingGasVolumeTWh: 193.4,
      fullPct: 73.08,
      injectionGWhPerDay: 72.9,
      withdrawalGWhPerDay: 18.5,
      netWithdrawalGWhPerDay: -54.4,
      status: "C",
      dayOverDayFullPctChange: 0.18,
    },
    {
      code: "fr",
      name: "France",
      gasDayStart: "2026-04-07",
      gasInStorageTWh: 96.42,
      workingGasVolumeTWh: 132.6,
      fullPct: 72.71,
      injectionGWhPerDay: 45.7,
      withdrawalGWhPerDay: 13.9,
      netWithdrawalGWhPerDay: -31.8,
      status: "C",
      dayOverDayFullPctChange: 0.16,
    },
    {
      code: "nl",
      name: "Netherlands",
      gasDayStart: "2026-04-07",
      gasInStorageTWh: 82.11,
      workingGasVolumeTWh: 121.3,
      fullPct: 67.69,
      injectionGWhPerDay: 31.4,
      withdrawalGWhPerDay: 12.7,
      netWithdrawalGWhPerDay: -18.7,
      status: "C",
      dayOverDayFullPctChange: 0.11,
    },
    {
      code: "at",
      name: "Austria",
      gasDayStart: "2026-04-07",
      gasInStorageTWh: 74.05,
      workingGasVolumeTWh: 97.9,
      fullPct: 75.64,
      injectionGWhPerDay: 22.8,
      withdrawalGWhPerDay: 8.1,
      netWithdrawalGWhPerDay: -14.7,
      status: "C",
      dayOverDayFullPctChange: 0.19,
    },
  ];

  return {
    meta: {
      lastUpdated: new Date().toISOString(),
      latestGasDay: "2026-04-07",
      source: "GIE AGSI",
      mode: "sample",
      version: 1,
    },
    countries: {
      keyCountries: KEY_COUNTRIES,
      countries: COUNTRIES,
    },
    latest: {
      eu: {
        code: "eu",
        name: "EU",
        gasDayStart: "2026-04-07",
        gasInStorageTWh: 700.12,
        workingGasVolumeTWh: 1145.3,
        fullPct: 61.13,
        injectionGWhPerDay: 420.5,
        withdrawalGWhPerDay: 210.1,
        netWithdrawalGWhPerDay: -210.4,
        status: "C",
      },
      countries,
    },
    history: {
      eu: sampleHistory(60.21, 61.13, 689.6, 700.12),
      countries: {
        de: sampleHistory(72.81, 73.52, 178.8, 180.22),
        it: sampleHistory(72.3, 73.08, 139.6, 141.33),
        fr: sampleHistory(72.01, 72.71, 95.2, 96.42),
        nl: sampleHistory(67.12, 67.69, 81.3, 82.11),
        at: sampleHistory(75.01, 75.64, 72.9, 74.05),
      },
    },
  };
}

async function buildLiveData() {
  const apiKey = process.env.GIE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GIE_API_KEY");
  }

  const latestEuResponse = await fetchAgsiPage({ type: "eu" }, apiKey);
  const latestEuRow = normalizeAgsiRecord(latestEuResponse.data[0]);
  const euHistoryRows = await fetchAgsiRange(
    { type: "eu", from: daysAgo(365 * 3), to: isoToday() },
    apiKey,
  );

  const countryResults = [];
  const historyResults = {};

  for (const country of COUNTRIES) {
    const latestResponse = await fetchAgsiPage({ country: country.code }, apiKey);
    const rows = latestResponse.data ?? [];
    const currentRow = rows[0];
    const previousRow = rows[1] ? [rows[1]] : [];

    if (!currentRow) {
      continue;
    }

    const latest = buildLatestSnapshot([currentRow], previousRow)[0];
    countryResults.push(latest);

    const historyRows = await fetchAgsiRange(
      { country: country.code, from: daysAgo(365 * 3), to: isoToday() },
      apiKey,
    );
    historyResults[country.code] = buildHistorySeries(historyRows);
  }

  return {
    meta: {
      lastUpdated: new Date().toISOString(),
      latestGasDay: latestEuRow.gasDayStart,
      source: "GIE AGSI",
      mode: "live",
      version: 1,
    },
    countries: {
      keyCountries: KEY_COUNTRIES,
      countries: COUNTRIES,
    },
    latest: {
      eu: latestEuRow,
      countries: countryResults,
    },
    history: {
      eu: buildHistorySeries(euHistoryRows),
      countries: historyResults,
    },
  };
}

async function writeJson(filename, payload) {
  await writeFile(path.join(dataDir, filename), `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  await mkdir(dataDir, { recursive: true });
  const useSample = process.argv.includes("--sample");
  const payload = useSample ? buildSampleData() : await buildLiveData();

  await writeJson("meta.json", payload.meta);
  await writeJson("countries.json", payload.countries);
  await writeJson("latest.json", payload.latest);
  await writeJson("history.json", payload.history);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
