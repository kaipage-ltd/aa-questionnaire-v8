#!/usr/bin/env bash
# One-off: pull the site's own photos (per Brand/assets/imagery/CAPTIONS.md) and
# optimize them into assets/img/ so they serve same-origin (CSP img-src 'self').
set -u
cd "$(dirname "$0")/.." || exit 1
OUT=assets/img
STAGE=/private/tmp/claude-501/-Users-kaipage-Desktop-Projects-AA/4bbe61a1-5eaa-4fcc-80d9-50d0848e1c62/scratchpad/img_stage
mkdir -p "$OUT" "$STAGE"

CDN=https://cdn.prod.website-files.com
declare -a JOBS=(
  "fog-on-sea|$CDN/5dd04f36b8df8156cd2d5052/6a3bb832f49903906dc8cc2c_Fog%20on%20sea.png|1600|72"
  "sea-storm|$CDN/5dd04f36b8df8156cd2d5052/6a3bb84064384c3e2dc4343e_sea%20storm.png|1600|72"
  "quiet-after-storm|$CDN/5dd04f36b8df8156cd2d5052/6a3bb85039182129f5138f0d_quiet%20after%20the%20storm%20sunlight.png|1600|72"
  "sunny-sea|$CDN/5dd04f36b8df8156cd2d5052/6a3bb9a22e3e3da9745edefc_sunny%20day%20on%20the%20sea.png|1600|72"
  "marble-sphere|$CDN/5dadb4b50ae60a05eed3a447/6a3171e484d8708a0dc92a71_372cd49a62eddf682e032a6ba19ce64c_WhatsApp%20Image%202026-06-16%20at%2016.53.45.jpg|1600|74"
  "colonnade|$CDN/5dadb4b50ae60a05eed3a447/6a1dcd5c28a22afd9934c5d2_f72b68b9489e305967ca7826524f89f0_6a0ef596d29e0661dc26bc2a_bg_.jpg|1800|74"
  "earth|$CDN/69fc9060ceaa684027e6754b/6a0f1531b03359a0956410f5_realistic-3d-planet-earth-rotating-seamless-loop-2026-01-28-05-00-25-utc_poster.0000000.jpg|1400|72"
  "city-amsterdam|$CDN/5dadb4b50ae60a05eed3a447/6a3a935339bad46738f20106_Amsterdam.jpg|1200|72"
  "city-london|$CDN/5dadb4b50ae60a05eed3a447/6a3a93539e1797f1e062640c_London.jpg|1200|72"
  "city-paris|$CDN/5dadb4b50ae60a05eed3a447/6a3a9353edd091dd8456548c_Paris.jpg|1200|72"
)

for job in "${JOBS[@]}"; do
  IFS='|' read -r name url maxdim q <<< "$job"
  raw="$STAGE/$name.src"
  echo ">> $name"
  if curl -fsSL --max-time 60 "$url" -o "$raw"; then
    sips -s format jpeg -s formatOptions "$q" -Z "$maxdim" "$raw" --out "$OUT/$name.jpg" >/dev/null 2>&1 \
      && echo "   ok -> $OUT/$name.jpg ($(du -h "$OUT/$name.jpg" | cut -f1))" \
      || echo "   FAILED sips $name"
  else
    echo "   FAILED download $name"
  fi
done

# Hero archway: already stored locally in the brand system. Optimize a larger, higher-q version.
ARCH=/Users/kaipage/Desktop/Projects/AA/Brand/assets/imagery/hero-archway.png
if [ -f "$ARCH" ]; then
  sips -s format jpeg -s formatOptions 80 -Z 2000 "$ARCH" --out "$OUT/hero-archway.jpg" >/dev/null 2>&1 \
    && echo ">> hero-archway ok ($(du -h "$OUT/hero-archway.jpg" | cut -f1))"
fi

echo "=== DONE ==="
ls -la "$OUT"
