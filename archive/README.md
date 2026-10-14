# Archive

Files from the old WordPress site (tekomltd.com) that are Tekom's own but have no place on the new site: photos the
live pages did not show and old ISO certificates. They are kept here because WordPress will be shut down.

Nothing in this folder is published. It is outside `content/`, so the website build and `sync-media` never read it.

- `wordpress-media/<year>/<month>/` keeps the WordPress file names. Photos are downscaled to at most 2400 px and saved
  as JPEG quality 82; other files are kept as they were.
- `design/wordpress-snapshot/INVENTORY.md` lists every file of the old site and says where it went ("archived: …").
- `pnpm import:wp` rewrites this folder; theme demo images, document previews, old logos and byte-identical copies are
  left out.
