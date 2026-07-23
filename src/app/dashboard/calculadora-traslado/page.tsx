"use client";

import { useState, useEffect, useRef } from "react";
import { CHILE_REGIONS } from "@/data/chileData";
import { 
  Calculator, MapPin, RotateCcw, Copy, Trash2, ArrowRightLeft, Check, FileText 
} from "lucide-react";

interface CalculationHistoryItem {
  id: string;
  regionIda: string;
  comunaIda: string;
  regionVuelta: string;
  comunaVuelta: string;
  km: number;
  total: number;
  date: string;
}

export default function CalculadoraTrasladoPage() {
  // Input states
  const [regionIda, setRegionIda] = useState("");
  const [comunaIda, setComunaIda] = useState("");
  const [regionVuelta, setRegionVuelta] = useState("");
  const [comunaVuelta, setComunaVuelta] = useState("");
  const [km, setKm] = useState<number | "">("");

  // UI state
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);
  const [historyCopiedId, setHistoryCopiedId] = useState<string | null>(null);

  // Load history from localStorage on client side
  useEffect(() => {
    const saved = localStorage.getItem("opsatm_calc_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [loadingDistance, setLoadingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState("");
  const [coordsIda, setCoordsIda] = useState<{ lat: number; lon: number } | null>(null);
  const [coordsVuelta, setCoordsVuelta] = useState<{ lat: number; lon: number } | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [routeDuration, setRouteDuration] = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Auto calculate distance between selected comunas
  useEffect(() => {
    if (!regionIda || !comunaIda || !regionVuelta || !comunaVuelta) {
      // Clear coordinates if inputs are incomplete
      setCoordsIda(null);
      setCoordsVuelta(null);
      setRoutePath([]);
      setRouteDuration("");
      return;
    }

    async function calculateAutoDistance() {
      setLoadingDistance(true);
      setDistanceError("");
      try {
        // 1. Get coordinates for Ida
        const qIda = encodeURIComponent(`${comunaIda}, ${regionIda}, Chile`);
        const resIda = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${qIda}&limit=1`, {
          headers: { 'User-Agent': 'OpsATM-Calculator-Agent' }
        });
        const dataIda = await resIda.json();
        
        if (!dataIda || dataIda.length === 0) {
          throw new Error(`No se encontró el origen: ${comunaIda}`);
        }
        
        const cIda = { lat: Number(dataIda[0].lat), lon: Number(dataIda[0].lon) };
        setCoordsIda(cIda);

        // 2. Get coordinates for Vuelta
        const qVuelta = encodeURIComponent(`${comunaVuelta}, ${regionVuelta}, Chile`);
        const resVuelta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${qVuelta}&limit=1`, {
          headers: { 'User-Agent': 'OpsATM-Calculator-Agent' }
        });
        const dataVuelta = await resVuelta.json();
        
        if (!dataVuelta || dataVuelta.length === 0) {
          throw new Error(`No se encontró el destino: ${comunaVuelta}`);
        }

        const cVuelta = { lat: Number(dataVuelta[0].lat), lon: Number(dataVuelta[0].lon) };
        setCoordsVuelta(cVuelta);

        // 3. Get routing distance from OSRM with full geometries
        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${cIda.lon},${cIda.lat};${cVuelta.lon},${cVuelta.lat}?overview=full&geometries=geojson`;
        const routeRes = await fetch(routeUrl);
        const routeData = await routeRes.json();
        
        if (!routeData.routes || routeData.routes.length === 0) {
          throw new Error("No se pudo trazar una ruta terrestre.");
        }

        const routeObj = routeData.routes[0];
        const distKm = Math.round(routeObj.distance / 1000);
        setKm(distKm);

        // Save path coordinates and duration
        const coords = routeObj.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
        setRoutePath(coords);

        const durationSeconds = routeObj.duration;
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.round((durationSeconds % 3600) / 60);
        const durationText = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
        setRouteDuration(durationText);
      } catch (e: any) {
        console.error(e);
        setDistanceError("No se pudo calcular la ruta automáticamente. Por favor ingresa el kilometraje manual.");
      } finally {
        setLoadingDistance(false);
      }
    }

    calculateAutoDistance();
  }, [regionIda, comunaIda, regionVuelta, comunaVuelta]);

  // Leaflet map rendering effect
  useEffect(() => {
    if (!leafletLoaded || !(window as any).L) return;
    const L = (window as any).L;

    const mapContainer = document.getElementById("map-element");
    if (!mapContainer) return;

    // Clear previous map instance if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Default center in Chile (Santiago area)
    const centerLat = coordsIda ? coordsIda.lat : -33.4489;
    const centerLon = coordsIda ? coordsIda.lon : -70.6693;
    const zoom = coordsIda && coordsVuelta ? 8 : 11;

    // Initialize map
    const map = L.map("map-element", {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([centerLat, centerLon], zoom);

    mapRef.current = map;

    // CartoDB Dark Matter layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Glowing Neon Markers
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #72b01d; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px #72b01d; animation: pulse 2s infinite;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const destIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #a78bfa; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px #a78bfa; animation: pulse 2s infinite;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    if (coordsIda) {
      L.marker([coordsIda.lat, coordsIda.lon], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<b>Origen:</b> ${comunaIda}`)
        .openPopup();
    }

    if (coordsVuelta) {
      L.marker([coordsVuelta.lat, coordsVuelta.lon], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destino:</b> ${comunaVuelta}`);
      
      if (!coordsIda) {
        map.setView([coordsVuelta.lat, coordsVuelta.lon], 11);
      }
    }

    if (routePath && routePath.length > 0) {
      const line = L.polyline(routePath, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.85
      }).addTo(map);

      const midIndex = Math.floor(routePath.length / 2);
      const midPoint = routePath[midIndex];

      if (midPoint) {
        L.popup({
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: false,
          closeOnClick: false,
          className: 'route-info-popup'
        })
        .setLatLng(midPoint)
        .setContent(`
          <div style="background-color: #1e293b; color: #f1f5f9; padding: 6px 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-weight: 700; font-size: 11px; text-align: center; border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 2px; min-width: 90px;">
            <div style="color: #93c947; font-size: 12px;">🚗 ${km} Km</div>
            <div style="color: #94a3b8; font-weight: 500; font-size: 10px;">⏱️ ${routeDuration}</div>
          </div>
        `)
        .addTo(map);
      }

      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    } else if (coordsIda && coordsVuelta) {
      const points = [
        [coordsIda.lat, coordsIda.lon],
        [coordsVuelta.lat, coordsVuelta.lon]
      ];
      
      const line = L.polyline(points, {
        color: '#93c947',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 6'
      }).addTo(map);

      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, coordsIda, coordsVuelta, routePath, routeDuration, comunaIda, comunaVuelta]);

  // Filter comunas for selected regions
  const comunasIdaList = CHILE_REGIONS.find(r => r.region === regionIda)?.comunas || [];
  const comunasVueltaList = CHILE_REGIONS.find(r => r.region === regionVuelta)?.comunas || [];

  // Reset comuna when region changes
  const handleRegionIdaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionIda(e.target.value);
    setComunaIda("");
  };

  const handleRegionVueltaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionVuelta(e.target.value);
    setComunaVuelta("");
  };

  // Math
  const kmValue = Number(km) || 0;
  const precioKm = 390;
  const total = kmValue * precioKm * 2;

  // Formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0
    }).format(val);
  };

  // Generate text summary
  const getSummaryText = (rIda: string, cIda: string, rVuelta: string, cVuelta: string, k: number, tot: number) => {
    return `--- COTIZACIÓN DE TRASLADO ---
Origen: ${rIda} - ${cIda}
Destino: ${rVuelta} - ${cVuelta}
Distancia: ${k} Km
Valor por Km: $${precioKm} (Ida y Vuelta x2)
Total a Pagar: ${formatCurrency(tot)}
------------------------------`;
  };

  const handleCopySummary = () => {
    if (!regionIda || !comunaIda || !regionVuelta || !comunaVuelta || !km) {
      alert("Por favor rellena todos los campos antes de copiar el resumen.");
      return;
    }
    const text = getSummaryText(regionIda, comunaIda, regionVuelta, comunaVuelta, kmValue, total);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Save to history automatically
    const newItem: CalculationHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      regionIda,
      comunaIda,
      regionVuelta,
      comunaVuelta,
      km: kmValue,
      total,
      date: new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem("opsatm_calc_history", JSON.stringify(updatedHistory));
  };

  const handleCopyHistoryItem = (item: CalculationHistoryItem) => {
    const text = getSummaryText(item.regionIda, item.comunaIda, item.regionVuelta, item.comunaVuelta, item.km, item.total);
    navigator.clipboard.writeText(text);
    setHistoryCopiedId(item.id);
    setTimeout(() => setHistoryCopiedId(null), 2000);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem("opsatm_calc_history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Seguro que deseas borrar el historial de cotizaciones?")) {
      setHistory([]);
      localStorage.removeItem("opsatm_calc_history");
    }
  };

  const handleResetForm = () => {
    setRegionIda("");
    setComunaIda("");
    setRegionVuelta("");
    setComunaVuelta("");
    setKm("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="section-title">Calculadora de Traslado</h2>
        <p className="section-subtitle">Cotizador rápido de kilómetros recorridos (Ida y Vuelta)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6 relative overflow-hidden">
            {/* Background design glow */}
            <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-[100px]" style={{ background: "rgba(114,176,29,0.15)" }} />

            <div className="flex items-center gap-2 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Calculator className="text-[#93c947]" size={20} />
              <h3 className="text-md font-bold text-slate-100">Nueva Cotización</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origen */}
              <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2 text-xs font-bold text-[#93c947] tracking-wider uppercase">
                  <MapPin size={14} />
                  <span>Punto de Origen (Ida)</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Región</label>
                    <select className="ops-select text-sm w-full" value={regionIda} onChange={handleRegionIdaChange}>
                      <option value="">Selecciona región...</option>
                      {CHILE_REGIONS.map(r => (
                        <option key={r.region} value={r.region}>{r.region}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Comuna</label>
                    <select className="ops-select text-sm w-full" value={comunaIda} onChange={(e) => setComunaIda(e.target.value)} disabled={!regionIda}>
                      <option value="">Selecciona comuna...</option>
                      {comunasIdaList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2 text-xs font-bold text-[#a78bfa] tracking-wider uppercase">
                  <MapPin size={14} />
                  <span>Punto de Destino (Vuelta)</span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Región</label>
                    <select className="ops-select text-sm w-full" value={regionVuelta} onChange={handleRegionVueltaChange}>
                      <option value="">Selecciona región...</option>
                      {CHILE_REGIONS.map(r => (
                        <option key={r.region} value={r.region}>{r.region}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Comuna</label>
                    <select className="ops-select text-sm w-full" value={comunaVuelta} onChange={(e) => setComunaVuelta(e.target.value)} disabled={!regionVuelta}>
                      <option value="">Selecciona comuna...</option>
                      {comunasVueltaList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Input */}
            <div className="p-4 rounded-xl space-y-4" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.02)" }}>
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Distancia Unilateral (Kilómetros)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder={loadingDistance ? "Calculando..." : "Ej: 120"}
                    className="ops-input pr-10"
                    value={km}
                    onChange={(e) => setKm(e.target.value === "" ? "" : Number(e.target.value))}
                    disabled={loadingDistance}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                    {loadingDistance ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent rounded-full" style={{ borderTopColor: "transparent", borderColor: "#72b01d" }} />
                    ) : (
                      "Km"
                    )}
                  </span>
                </div>
              </div>

              {loadingDistance && (
                <p className="text-xs text-[#93c947] font-semibold">
                  🔄 Buscando coordenadas y trazando la ruta terrestre...
                </p>
              )}

              {distanceError && (
                <p className="text-xs text-amber-400 font-semibold">
                  ⚠️ {distanceError}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button 
                onClick={handleResetForm} 
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                <RotateCcw size={14} />
                Limpiar datos
              </button>

              <button 
                onClick={handleCopySummary}
                className="btn-primary flex items-center gap-2"
                style={{ padding: "8px 16px" }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "¡Copiado al Portapapeles!" : "Copiar Resumen y Guardar"}
              </button>
            </div>
          </div>
        </div>

        {/* Results / Live Quote Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6 relative overflow-hidden" style={{ minHeight: "330px" }}>
            <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full blur-[100px]" style={{ background: "rgba(167,139,250,0.1)" }} />

            <div className="flex items-center gap-2 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <FileText className="text-[#a78bfa]" size={20} />
              <h3 className="text-md font-bold text-slate-100">Desglose de Tarifas</h3>
            </div>

            {/* Calculations metrics */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-400 font-medium">Distancia de Ida:</span>
                <span className="text-slate-200 font-bold">{kmValue} Km</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-400 font-medium">Distancia Total (Ida/Vuelta):</span>
                <span className="text-slate-200 font-bold">{kmValue * 2} Km</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-slate-400 font-medium">Tarifa por Kilómetro:</span>
                <span className="text-slate-200 font-bold">$390 / Km</span>
              </div>

              <div className="pt-6 mt-4" style={{ borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Cotizado</div>
                <div className="text-3xl font-extrabold text-[#93c947]">
                  {formatCurrency(total)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Cálculo realizado: {kmValue} Km × $390/Km × 2 (Ida/Vuelta)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <MapPin className="text-[#93c947]" size={18} />
          <h3 className="text-sm font-bold text-slate-100">Visualización de Ruta Terrestre</h3>
        </div>
        <div 
          id="map-element" 
          className="w-full rounded-xl overflow-hidden relative z-10 animate-fade-in" 
          style={{ height: "400px", border: "1px solid rgba(255,255,255,0.08)", background: "#121418" }}
        />
      </div>

      {/* History Panel */}
      {history.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-[#93c947]" />
              <h3 className="text-sm font-bold text-slate-100">Historial Reciente (Últimas 20)</h3>
            </div>
            <button 
              onClick={handleClearHistory} 
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} />
              Borrar Historial
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="text-slate-400 font-bold" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Origen (Ida)</th>
                  <th className="py-2.5 px-3">Destino (Vuelta)</th>
                  <th className="py-2.5 px-3 text-center">Distancia</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="py-2.5 px-3 text-slate-500">{item.date}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">
                      {item.comunaIda} <span className="text-slate-500 font-normal">({item.regionIda})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-medium">
                      {item.comunaVuelta} <span className="text-slate-500 font-normal">({item.regionVuelta})</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300 font-semibold">{item.km} Km</td>
                    <td className="py-2.5 px-3 text-right text-[#93c947] font-bold">{formatCurrency(item.total)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyHistoryItem(item)}
                          className="p-1.5 rounded bg-white/[0.04] text-slate-400 hover:text-white transition-colors"
                          title="Copiar cotización"
                        >
                          {historyCopiedId === item.id ? <Check size={12} className="text-[#93c947]" /> : <Copy size={12} />}
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="p-1.5 rounded bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
