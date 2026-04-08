# Europe Gas Dashboard Design

## Goal

Build a standalone static website for European natural gas inventory monitoring, hosted on GitHub Pages and updated automatically from the GIE AGSI API. The site should focus on:

- EU aggregate storage overview
- Key-country summary cards
- Historical country comparison charts
- Full country table with latest values

The project must not expose the API key in client-side code. The API key will be stored in the GitHub repository Secrets configuration and used only inside GitHub Actions. Data fetching therefore runs in GitHub Actions, which writes versioned JSON artifacts into the repository. The frontend reads only static JSON files.

## Scope

### In scope

- A new standalone repository structure for `EU-gas-inventory`
- Static frontend suitable for GitHub Pages
- Scheduled GitHub Actions data refresh
- AGSI country-level latest snapshot
- AGSI country-level historical time series
- EU aggregate latest snapshot and historical series
- Key-country overview cards
- Country comparison line chart
- Full sortable country table

### Out of scope

- Live browser-side API calls to GIE
- Server-side backend other than GitHub Actions
- LNG, power, weather, import flow, or price modules in v1
- Authentication, user accounts, or admin UI
- Complex database storage

## External Constraints

- Hosting is GitHub Pages, so the frontend must be fully static.
- The GIE API requires `x-key` in request headers, so browser-side direct access is rejected as a design option because it would expose the credential.
- AGSI supports country-level and EU aggregate access through REST parameters such as `country=de` and `type=eu`.
- AGSI supports historical queries using `from`, `to`, `page`, and `size`, with `size` capped at `300`.
- The API documentation version referenced for this design is `v013`, dated `2025-03-06`.

Source:

- [GIE API documentation PDF](https://www.gie.eu/transparency-platform/GIE_API_documentation_v013.pdf)
