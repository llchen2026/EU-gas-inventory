const COLORS = {
  eu: "#0f6cbd",
  de: "#1f8f63",
  it: "#e67e22",
  fr: "#6b4bb6",
  nl: "#c94974",
  at: "#2d7d9a",
};

const RANGE_TO_DAYS = {
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 1095,
  ALL: Infinity,
};

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function createMetricCard(label, value, note = "") {
  const article = document.createElement("article");
  article.className = "metric-card";
  article.innerHTML = `
    <span class="metric-label">${label}</span>
    <strong class="metric-value">${value}</strong>
    <p class="metric-note">${note}</p>
  `;
  return article;
}

function createCountryCard(country) {
  const article = document.createElement("article");
  article.className = "country-card";
  const delta =
    country.dayOverDayFullPctChange === null || country.dayOverDayFullPctChange === undefined
      ? "No daily delta"
      : `${country.dayOverDayFullPctChange > 0 ? "+" : ""}${formatNumber(country.dayOverDayFullPctChange)} pct pts day/day`;

  article.innerHTML = `
    <span class="card-label">${country.name}</span>
    <strong class="card-value">${formatNumber(country.fullPct)}%</strong>
    <p class="card-note">${formatNumber(country.gasInStorageTWh)} TWh in storage</p>
    <p class="card-note">${delta}</p>
  `;
  return article;
}

function renderOverview(meta, latest) {
  document.querySelector("#latest-gas-day").textContent = meta.latestGasDay;
  document.querySelector("#last-updated").textContent = formatTimestamp(meta.lastUpdated);

  const grid = document.querySelector("#overview-grid");
  grid.replaceChildren(
    createMetricCard("EU storage", `${formatNumber(latest.eu.gasInStorageTWh)} TWh`),
    createMetricCard("EU fullness", `${formatNumber(latest.eu.fullPct)}%`),
    createMetricCard("Working volume", `${formatNumber(latest.eu.workingGasVolumeTWh)} TWh`),
    createMetricCard(
      "Net withdrawal",
      `${formatNumber(latest.eu.netWithdrawalGWhPerDay)} GWh/d`,
      "Negative means net injection into storage",
    ),
  );
}

function renderKeyCountries(latest, countriesConfig) {
  const byCode = new Map(latest.countries.map((row) => [row.code, row]));
  const grid = document.querySelector("#country-grid");
  const cards = countriesConfig.keyCountries
    .map((code) => byCode.get(code))
    .filter(Boolean)
    .map(createCountryCard);

  grid.replaceChildren(...cards);
}

function filterSeriesByRange(series, range) {
  if (range === "ALL") {
    return series;
  }

  const days = RANGE_TO_DAYS[range];
  const lastDate = new Date(series.at(-1).date);
  const cutoff = new Date(lastDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  return series.filter((point) => new Date(point.date) >= cutoff);
}

function renderLegend(seriesMap) {
  const legend = document.querySelector("#chart-legend");
  legend.replaceChildren(
    ...Object.entries(seriesMap).map(([code, info]) => {
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-swatch" style="background:${COLORS[code] ?? "#334"}"></span>${info.name}`;
      return item;
    }),
  );
}

function renderChart(seriesMap, range) {
  const svg = document.querySelector("#history-chart");
  const width = 960;
  const height = 360;
  const padding = { top: 24, right: 24, bottom: 36, left: 40 };

  const seriesEntries = Object.entries(seriesMap).map(([code, info]) => ({
    code,
    name: info.name,
    points: filterSeriesByRange(info.points, range),
  }));

  const allPoints = seriesEntries.flatMap((entry) => entry.points);
  const yValues = allPoints.map((point) => point.fullPct);
  const minY = Math.min(...yValues) - 2;
  const maxY = Math.max(...yValues) + 2;
  const xMax = Math.max(...seriesEntries.map((entry) => entry.points.length - 1));

  const lines = seriesEntries
    .map((entry) => {
      const d = entry.points
        .map((point, index) => {
          const x =
            padding.left +
            (index / Math.max(xMax, 1)) * (width - padding.left - padding.right);
          const y =
            height -
            padding.bottom -
            ((point.fullPct - minY) / Math.max(maxY - minY, 1)) *
              (height - padding.top - padding.bottom);
          return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");

      return `<path d="${d}" fill="none" stroke="${COLORS[entry.code] ?? "#334"}" stroke-width="3" stroke-linecap="round" />`;
    })
    .join("");

  const grid = [0, 1, 2, 3, 4]
    .map((tick) => {
      const y = padding.top + (tick / 4) * (height - padding.top - padding.bottom);
      const label = (maxY - ((maxY - minY) * tick) / 4).toFixed(0);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(17,32,49,0.08)" />
        <text x="8" y="${y + 4}" font-size="12" fill="#5f7387">${label}%</text>
      `;
    })
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent" rx="18" />
    ${grid}
    ${lines}
  `;
}

function renderTable(latest, filterText = "", sortKey = "fullPct", descending = true) {
  const tbody = document.querySelector("#country-table-body");
  const rows = [...latest.countries]
    .filter((row) => row.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const direction = descending ? -1 : 1;

      if (typeof leftValue === "string") {
        return leftValue.localeCompare(rightValue) * direction;
      }

      return (leftValue - rightValue) * direction;
    });

  tbody.replaceChildren(
    ...rows.map((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.name}</td>
        <td>${formatNumber(row.gasInStorageTWh)}</td>
        <td>${formatNumber(row.fullPct)}</td>
        <td>${formatNumber(row.workingGasVolumeTWh)}</td>
        <td>${formatNumber(row.netWithdrawalGWhPerDay)}</td>
        <td>${row.status}</td>
      `;
      return tr;
    }),
  );
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function bootstrap() {
  try {
    const [meta, countriesConfig, latest, history] = await Promise.all([
      loadJson("./data/meta.json"),
      loadJson("./data/countries.json"),
      loadJson("./data/latest.json"),
      loadJson("./data/history.json"),
    ]);

    renderOverview(meta, latest);
    renderKeyCountries(latest, countriesConfig);

    const seriesMap = {
      eu: { name: "EU", points: history.eu },
      ...Object.fromEntries(
        countriesConfig.keyCountries.map((code) => [
          code,
          {
            name: latest.countries.find((row) => row.code === code)?.name ?? code.toUpperCase(),
            points: history.countries[code] ?? [],
          },
        ]),
      ),
    };

    let currentRange = "3Y";
    let sortKey = "fullPct";
    let descending = true;

    renderLegend(seriesMap);
    renderChart(seriesMap, currentRange);
    renderTable(latest, "", sortKey, descending);

    document.querySelector("#range-switcher").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-range]");
      if (!button) {
        return;
      }

      currentRange = button.dataset.range;
      document
        .querySelectorAll("#range-switcher button")
        .forEach((item) => item.classList.toggle("is-active", item === button));
      renderChart(seriesMap, currentRange);
    });

    document.querySelector("#country-filter").addEventListener("input", (event) => {
      renderTable(latest, event.target.value, sortKey, descending);
    });

    document.querySelectorAll("th[data-sort]").forEach((header) => {
      header.addEventListener("click", () => {
        const nextSortKey = header.dataset.sort;
        descending = nextSortKey === sortKey ? !descending : nextSortKey !== "name";
        sortKey = nextSortKey;
        renderTable(latest, document.querySelector("#country-filter").value, sortKey, descending);
      });
    });
  } catch (error) {
    document.querySelector("#error-panel").classList.remove("hidden");
    document.querySelector("#error-message").textContent = error.message;
  }
}

bootstrap();
