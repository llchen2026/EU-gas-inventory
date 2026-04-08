const BASE_URL = "https://agsi.gie.eu/api";

async function fetchJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      "x-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`AGSI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchAgsiPage(params, apiKey) {
  const search = new URLSearchParams(params);
  return fetchJson(`${BASE_URL}?${search.toString()}`, apiKey);
}

export async function fetchAgsiRange(params, apiKey) {
  const firstPage = await fetchAgsiPage({ ...params, page: "1", size: "300" }, apiKey);
  const rows = [...(firstPage.data ?? [])];
  const lastPage = Number(firstPage.last_page ?? 1);

  for (let page = 2; page <= lastPage; page += 1) {
    const result = await fetchAgsiPage(
      { ...params, page: String(page), size: "300" },
      apiKey,
    );
    rows.push(...(result.data ?? []));
  }

  return rows;
}
