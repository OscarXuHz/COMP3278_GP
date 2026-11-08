# Campus Atlas map preview

Local Leaflet feasibility preview. No Flask/MySQL dependency.

Open `index.html` in a browser, or run `python3 -m http.server 8765 --bind 127.0.0.1` in this directory and visit http://127.0.0.1:8765.

## Assets

- `assets/hku-main-campus.pdf`: downloaded from https://www.estates.hku.hk/download_file/view_inline/674 on 2026-11-08; HKU Estates Office, Version 25.2 (April 2025). Original retained unchanged.
- `assets/hku-main-campus.svg`: full-page conversion using PyMuPDF with text converted to paths. Preserves vector drawing detail and original embedded raster images. Public redistribution permission has not been established; this is a local evaluation.
- `vendor/`: Leaflet 1.9.4 from unpkg.com; BSD-2-Clause license included. No remote runtime dependencies.

## Coordinates and scope

Uses `L.CRS.Simple` and `L.imageOverlay` with an 842 x 595 image coordinate space. Source coordinates are measured from the top-left. Leaflet marker positions are `[595 - y, x]`, not geographic latitude/longitude.

Three manually aligned, approximate building markers demonstrate selection, popups and zoom. No facility records, login, reports or API integrations are implemented. The full source map, legend, branding and date are retained.
