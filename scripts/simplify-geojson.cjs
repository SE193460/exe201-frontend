/* One-off build helper for the 34-province Vietnam GeoJSON overlay.
 *
 * Usage:
 *   node scripts/simplify-geojson.cjs <inPath> <outPath>
 *
 * Optional env:
 *   TOLERANCE  Douglas-Peucker tolerance in degrees (default 0.01 ≈ 1.1 km)
 *   DECIMALS   coordinate decimal places (default 4)
 */
const fs = require("fs");

const [, , inPath, outPath] = process.argv;
const tolerance = Number(process.env.TOLERANCE || 0.01);
const decimals = Number(process.env.DECIMALS || 4);

function sqSegDist(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

// Iterative Douglas-Peucker (avoids deep recursion on long coastlines).
function simplify(points, sqTol) {
  if (points.length <= 2) return points;
  const markers = new Uint8Array(points.length);
  markers[0] = 1;
  markers[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxSq = 0;
    let index = -1;
    for (let i = a + 1; i < b; i++) {
      const d = sqSegDist(points[i], points[a], points[b]);
      if (d > maxSq) {
        maxSq = d;
        index = i;
      }
    }
    if (maxSq > sqTol && index !== -1) {
      markers[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (markers[i]) out.push(points[i]);
  return out;
}

function roundRing(ring) {
  const out = [];
  let prevX;
  let prevY;
  for (const [x, y] of ring) {
    const rx = Number(x.toFixed(decimals));
    const ry = Number(y.toFixed(decimals));
    if (rx === prevX && ry === prevY) continue;
    out.push([rx, ry]);
    prevX = rx;
    prevY = ry;
  }
  return out;
}

function simplifyPolygon(rings) {
  const sqTol = tolerance * tolerance;
  const out = [];
  for (const ring of rings) {
    const r = roundRing(simplify(ring, sqTol));
    if (r.length >= 4) out.push(r);
  }
  return out;
}

const geo = JSON.parse(fs.readFileSync(inPath, "utf8"));
const features = [];
for (const f of geo.features) {
  const props = f.properties || {};
  const g = f.geometry || {};
  let geometry = null;
  if (g.type === "Polygon") {
    const rings = simplifyPolygon(g.coordinates);
    if (rings.length) geometry = { type: "Polygon", coordinates: rings };
  } else if (g.type === "MultiPolygon") {
    const polys = [];
    for (const poly of g.coordinates) {
      const rings = simplifyPolygon(poly);
      if (rings.length) polys.push(rings);
    }
    if (polys.length) geometry = { type: "MultiPolygon", coordinates: polys };
  }
  if (!geometry) continue;
  features.push({
    type: "Feature",
    properties: {
      name: props.name,
      name_en: props.name_en,
      full_name: props.full_name,
      code: props.code,
    },
    geometry,
  });
}

const out = { type: "FeatureCollection", features };
const json = JSON.stringify(out);
fs.writeFileSync(outPath, json);
console.log(
  `wrote ${outPath} (${(json.length / 1024).toFixed(0)} KB, ${features.length} features, tol=${tolerance})`,
);
