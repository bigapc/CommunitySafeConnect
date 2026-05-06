"use client";

import { useMemo, useState } from "react";

type MapLayer = "safe_zones" | "incidents" | "patrol";

interface MapPin {
  id: string;
  label: string;
  type: MapLayer;
  lat: number;
  lng: number;
  status: "normal" | "warning" | "critical";
}

const pins: MapPin[] = [
  {
    id: "zone-1",
    label: "North Campus Security Office",
    type: "safe_zones",
    lat: 33.7769,
    lng: -84.3963,
    status: "normal",
  },
  {
    id: "zone-2",
    label: "Harbor Community Church Annex",
    type: "safe_zones",
    lat: 33.7688,
    lng: -84.3877,
    status: "normal",
  },
  {
    id: "inc-1",
    label: "Lighting outage escalation",
    type: "incidents",
    lat: 33.7729,
    lng: -84.3927,
    status: "critical",
  },
  {
    id: "inc-2",
    label: "Crowd bottleneck alert",
    type: "incidents",
    lat: 33.7814,
    lng: -84.3831,
    status: "warning",
  },
  {
    id: "patrol-1",
    label: "Patrol Unit Bravo",
    type: "patrol",
    lat: 33.7747,
    lng: -84.3899,
    status: "normal",
  },
];

const layerLabels: Record<MapLayer, string> = {
  safe_zones: "Safe Zones",
  incidents: "Incidents",
  patrol: "Patrol Units",
};

export default function LiveMapPanel() {
  const [activeLayers, setActiveLayers] = useState<Record<MapLayer, boolean>>({
    safe_zones: true,
    incidents: true,
    patrol: true,
  });
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString());

  const visiblePins = useMemo(() => {
    return pins.filter((pin) => activeLayers[pin.type]);
  }, [activeLayers]);

  function toggleLayer(layer: MapLayer) {
    setActiveLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  }

  return (
    <section>
      <article className="control-card" style={{ padding: "0.85rem" }}>
        <h3 style={{ marginTop: 0 }}>Live Safety Map</h3>
        <p className="control-meta" style={{ marginTop: "-0.2rem" }}>
          Real-time map canvas (OpenStreetMap) with operational overlays for safe zones, incidents, and patrol movement.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
          {(Object.keys(layerLabels) as MapLayer[]).map((layer) => (
            <label key={layer} className="incident-checkbox">
              <input
                type="checkbox"
                checked={activeLayers[layer]}
                onChange={() => toggleLayer(layer)}
              />
              {layerLabels[layer]}
            </label>
          ))}
          <button type="button" onClick={() => setLastRefresh(new Date().toLocaleTimeString())}>
            Refresh Intel
          </button>
          <small className="control-meta">Last refresh: {lastRefresh}</small>
        </div>

        <div className="map-embed-shell" style={{ marginTop: "0.7rem" }}>
          <iframe
            title="Community live map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-84.41%2C33.76%2C-84.37%2C33.79&layer=mapnik"
            style={{ width: "100%", height: "420px", border: "1px solid #3f5b75", borderRadius: "10px" }}
            loading="lazy"
          />
        </div>
      </article>

      <article className="control-card" style={{ marginTop: "0.8rem", padding: "0.85rem" }}>
        <h3 style={{ marginTop: 0 }}>Operational Pin Feed ({visiblePins.length})</h3>
        {visiblePins.length === 0 ? (
          <p>No layers selected.</p>
        ) : (
          <div className="control-list">
            {visiblePins.map((pin) => (
              <article key={pin.id} className="control-card" style={{ padding: "0.65rem" }}>
                <p style={{ margin: 0 }}>
                  <strong>{pin.label}</strong>
                </p>
                <small className="control-meta" style={{ display: "block" }}>
                  type={pin.type} | lat={pin.lat.toFixed(4)} | lng={pin.lng.toFixed(4)}
                </small>
                <span className={`status-pill ${pin.status === "critical" ? "flagged" : pin.status === "warning" ? "pending" : "clean"}`}>
                  {pin.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
