<?php

/*
 | Renders product science text with the REFERENCE site's own ScienceRenderer.
 |
 | The renderer carries an assertNoLoss() guarantee the client's claims review
 | depends on (see ../website/app/Support/ScienceRenderer.php), so it is run as
 | is rather than re-implemented in JS. Called by scripts/export-reference-data.mjs.
 |
 | stdin:  {"ref": "<path to reference root>", "items": {"KOT001": {"name": "…", "science": "…"}, …}}
 | stdout: {"KOT001": "<html>", …}
 |
 | Needs PHP >= 8.2 with mbstring.
 */

declare(strict_types=1);

$input = json_decode((string) stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);

require rtrim((string) $input['ref'], '/\\').'/app/Support/ScienceRenderer.php';

$renderer = new App\Support\ScienceRenderer();
$out = [];

foreach ($input['items'] as $sku => $item) {
    $out[$sku] = $renderer->render($item['science'] ?? null, (string) ($item['name'] ?? $sku));
}

echo json_encode($out, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
