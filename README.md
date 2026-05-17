# OpenFolderSize

OpenFolderSize is a Blueprint extension for Pterodactyl Panel by choice21 ([choice21.site](https://choice21.site)).

It adds an on-demand folder size calculator to the client file manager. Directory calculations are queued per server in the browser and cached on the panel so repeat requests do not spam Wings.

## Layout

- `contents/` contains the Blueprint extension bundle.
- `contents/components/` contains the React file-manager enhancer.
- `contents/app/` contains the panel-side API request, controller, and recursive sizing service.
- `contents/data/docs/MANUALWINGS.md` is copied into the extension private data directory during install.

## Notes

- No custom Wings patch is required for the core feature.
- Optional Wings tuning guidance ships with the extension manual.
- `contents/conf.yml` targets Blueprint `beta-2026-01`.
