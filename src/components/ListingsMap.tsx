import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import type { FeatureCollection } from "geojson";
import type { Listing } from "../api/services/listings";
import { resolveListingImageUrl } from "../api/services/listings";
import { PROVINCE_GEOJSON_URL, normalizeRegionText } from "../data/vietnamRegions";

// Custom pin so we don't depend on Leaflet's bundler-fragile default icon assets.
const pinIcon = L.divIcon({
  className: "roomie-map-pin",
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px 9999px 9999px 0;background:#ff8c00;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -16],
});

// Country-wide fallback view so we never default to a single city when the
// filtered listings live somewhere else (e.g. Hà Nội instead of HCMC).
const VIETNAM_CENTER: [number, number] = [16.0, 106.3];
const VIETNAM_ZOOM = 6;

export type MapFocus = {
  /** Focus centroid as [lat, lng]. */
  center: [number, number];
  zoom?: number;
  /** Optional bounding box [[south, west], [north, east]] to fit. */
  bounds?: [[number, number], [number, number]];
};

type MapListing = Listing & { latitude: number; longitude: number };

function FitBounds({
  points,
  focus,
}: {
  points: Array<[number, number]>;
  focus?: MapFocus | null;
}) {
  const map = useMap();

  useEffect(() => {
    // An explicit region focus + bounds wins so the map always matches the
    // active area filter.
    if (focus?.bounds) {
      map.fitBounds(L.latLngBounds(focus.bounds), { padding: [20, 20] });
      return;
    }
    if (points.length === 0) {
      if (focus?.center) map.setView(focus.center, focus.zoom ?? 10);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], focus?.zoom ?? 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points, focus]);

  return null;
}

/** Loads the simplified 34-province boundary GeoJSON once, lazily. */
let provinceGeoJsonPromise: Promise<FeatureCollection | null> | null = null;
function loadProvinceGeoJson(): Promise<FeatureCollection | null> {
  if (!provinceGeoJsonPromise) {
    provinceGeoJsonPromise = fetch(PROVINCE_GEOJSON_URL)
      .then((res) => (res.ok ? (res.json() as Promise<FeatureCollection>) : null))
      .catch(() => null);
  }
  return provinceGeoJsonPromise;
}

function formatPrice(price: number) {
  if (price >= 1_000_000) {
    const tr = price / 1_000_000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)}Tr`;
  }
  return price.toLocaleString("vi-VN");
}

function hasCoords(listing: Listing): listing is MapListing {
  return typeof listing.latitude === "number" && typeof listing.longitude === "number";
}

export default function ListingsMap({
  listings,
  onSelect,
  focus,
  focusProvinceName,
}: {
  listings: Listing[];
  onSelect?: (listing: Listing) => void;
  /** Region the map should frame (province selected in the filter). */
  focus?: MapFocus | null;
  /** Canonical province name to highlight in the boundaries overlay. */
  focusProvinceName?: string | null;
}) {
  const { t } = useTranslation();
  const [geo, setGeo] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadProvinceGeoJson().then((data) => {
      if (!cancelled && data) setGeo(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const located = useMemo(() => listings.filter(hasCoords), [listings]);
  const withoutCoords = useMemo(() => listings.filter((listing) => !hasCoords(listing)), [listings]);
  const points = useMemo(
    () => located.map((listing) => [listing.latitude, listing.longitude] as [number, number]),
    [located],
  );

  const activeName = focusProvinceName ? normalizeRegionText(focusProvinceName) : "";

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-[320px] flex-1">
        <MapContainer
          center={focus?.center ?? points[0] ?? VIETNAM_CENTER}
          zoom={focus?.zoom ?? (points.length > 0 ? 13 : VIETNAM_ZOOM)}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", minHeight: 320 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geo && (
            <GeoJSON
              data={geo}
              interactive={false}
              style={(feature) => {
                const isActive =
                  activeName.length > 0 &&
                  normalizeRegionText(String(feature?.properties?.name ?? "")) === activeName;
                return {
                  color: isActive ? "#ff8c00" : "#94a3b8",
                  weight: isActive ? 2 : 1,
                  fillColor: isActive ? "#ff8c00" : "#cbd5e1",
                  fillOpacity: isActive ? 0.22 : 0.06,
                };
              }}
            />
          )}
          <FitBounds points={points} focus={focus} />
          {located.map((listing) => (
            <Marker key={listing.id} position={[listing.latitude, listing.longitude]} icon={pinIcon}>
              <Popup>
                <div className="w-52">
                  {listing.images?.[0]?.imageUrl && (
                    <img
                      src={resolveListingImageUrl(listing.images[0].imageUrl)}
                      alt={listing.title}
                      referrerPolicy="no-referrer"
                      className="mb-2 h-24 w-full rounded-md object-cover"
                    />
                  )}
                  <p className="text-sm font-bold text-slate-800">{listing.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[listing.address, listing.ward, listing.district, listing.city].filter(Boolean).join(", ") ||
                      t("Chưa cập nhật")}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#ff8c00]">
                    {formatPrice(listing.rentPrice)}
                    <span className="ml-1 text-[10px] font-medium text-slate-400">{t("đ/tháng")}</span>
                  </p>
                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => onSelect(listing)}
                      className="mt-2 w-full rounded-full bg-[#ff8c00] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
                    >
                      {t("Xem chi tiết")}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        {located.length === 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg bg-white/95 px-3 py-2 text-center text-xs text-slate-500 shadow">
            {t("Chưa có bài đăng nào có tọa độ để hiển thị trên bản đồ.")}
          </div>
        )}
      </div>

      {withoutCoords.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("Bài đăng chưa có tọa độ")}
          </p>
          <ul className="space-y-1.5">
            {withoutCoords.map((listing) => {
              const address = [listing.address, listing.ward, listing.district, listing.city]
                .filter(Boolean)
                .join(", ");
              return (
                <li key={listing.id} className="flex items-start justify-between gap-3 text-xs">
                  <span className="min-w-0 flex-1 truncate text-slate-700">{listing.title}</span>
                  {address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-semibold text-[#ff8c00] hover:underline"
                    >
                      {t("Mở bản đồ")}
                    </a>
                  ) : (
                    <span className="shrink-0 text-slate-400">{t("Chưa cập nhật")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
