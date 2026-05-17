# OpenFolderSize Wings Notes

Installed docs path: `{root/data}/docs/MANUALWINGS.md`

OpenFolderSize does not require a custom Wings build. The panel extension calculates folder sizes on demand by recursively calling the normal Wings directory listing API, then caches results on the panel for five minutes.

## Config file

Edit `/etc/pterodactyl/config.yml` and restart Wings after changes.

## Recommended tuning

1. Leave `system.disk_check_interval` at `150` seconds or higher on large nodes.
   The official Wings config notes warn that setting this too low can create major I/O bottlenecks and high CPU usage.
2. If very large servers hang during startup, consider `system.check_permissions_on_boot: false`.
   The official configuration docs note that this check can delay startup when a server has a very large amount of files.
3. Keep OpenFolderSize as an on-demand tool.
   This extension already serializes one calculation per server in the browser and caches responses on the panel. Do not remove those guards unless you also add server-side rate limiting.

## Example

```yaml
system:
  disk_check_interval: 150
  check_permissions_on_boot: false
```

## Restart Wings

`sudo systemctl restart wings`

## Upstream references

- [Pterodactyl Wings additional configuration](https://pterodactyl.io/wings/1.0/configuration)
- [Pterodactyl Wings installation](https://pterodactyl.io/wings/1.0/installing.html)
- [Pterodactyl building Wings](https://pterodactyl.io/community/customization/wings.html)
