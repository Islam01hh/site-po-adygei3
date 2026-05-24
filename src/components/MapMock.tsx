import { useState } from "react";
import { Sight } from "../types";
import { MapPin, Info, Compass, Award, ZoomIn, ZoomOut } from "lucide-react";

interface MapMockProps {
  sights: Sight[];
  selectedSight: Sight | null;
  onSelectSight: (sight: Sight) => void;
}

export default function MapMock({ sights, selectedSight, onSelectSight }: MapMockProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pannedCity, setPannedCity] = useState<string | null>(null);

  // Geographic boundaries of standard sights to plot onto a beautiful local map coord grid
  // Lat: ~43.9 to 44.6
  // Lng: ~39.8 to 40.4
  const minLat = 43.8;
  const maxLat = 44.6;
  const minLng = 39.7;
  const maxLng = 40.4;

  const getRelativeXY = (lat: number, lng: number) => {
    // Convert GPS coordinates into clean responsive layout percentage points (X for lng, Y for lat)
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    // Latitude decreases as you go down visually, so invert it
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    
    // Safety boundary constraints
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  const mapScaleClass = zoomLevel === 1 
    ? "scale-100" 
    : zoomLevel === 1.5 
      ? "scale-125 translate-x-3 -translate-y-3" 
      : "scale-150 translate-x-6 -translate-y-6";

  return (
    <div id="interactive_map_container" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl flex flex-col h-full relative overflow-hidden">
      {/* Map Header Controls */}
      <div className="flex items-center justify-between mb-4 z-10 bg-white/80 backdrop-blur-md p-1 rounded-2xl">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-teal-600 animate-spin-slow" />
          <span className="font-display font-semibold text-slate-800 text-sm md:text-base">
            Интерактивная карта Адыгеи
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Уменьшить"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.5))}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Увеличить"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
            {zoomLevel * 100}%
          </span>
        </div>
      </div>

      {/* Map canvas frame */}
      <div className="flex-1 bg-slate-50 rounded-2xl relative overflow-hidden border border-slate-100 min-h-[320px] lg:min-h-[400px]">
        {/* Scenic vector representation layer of Adygea topography */}
        <div className={`absolute inset-0 transition-transform duration-500 ease-out ${mapScaleClass} select-none`}>
          
          {/* Decorative Rivers (Река Белая и притоки) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
            {/* Main Belaya River winding from South to North */}
            <path 
              d="M 50 100 C 60 85, 30 70, 45 55 C 60 40, 50 25, 40 10" 
              fill="none" 
              stroke="#a5f3fc" 
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeDasharray="4 2" 
            />
            {/* Tributaries */}
            <path 
              d="M 12 60 C 25 55, 30 54, 45 55" 
              fill="none" 
              stroke="#e0f2fe" 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
            <path 
              d="M 85 45 C 70 42, 60 44, 48 40" 
              fill="none" 
              stroke="#e0f2fe" 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
          </svg>

          {/* Topographical Mountain Outlines */}
          <div className="absolute top-[80%] left-[20%] text-slate-200/50 flex flex-col items-center">
            <span className="text-[40px] leading-none">🏔️</span>
            <span className="text-[10px] font-mono tracking-wider">г. Фишт (2867 м)</span>
          </div>
          <div className="absolute top-[65%] left-[65%] text-slate-200/50 flex flex-col items-center">
            <span className="text-[32px] leading-none">⛰️</span>
            <span className="text-[10px] font-mono tracking-wider">г. Оштен</span>
          </div>
          <div className="absolute top-[35%] left-[30%] text-slate-200/50 flex flex-col items-center">
            <span className="text-[36px] leading-none">⛰️</span>
            <span className="text-[10px] font-mono tracking-wider">Каменное море</span>
          </div>

          {/* Regional Labels & Landmarks */}
          <div className="absolute top-[12%] left-[45%] text-[11px] font-semibold text-slate-400/80 bg-slate-200/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
            Майкоп (Столица)
          </div>
          <div className="absolute top-[48%] left-[70%] text-[10px] text-teal-700/60 font-semibold tracking-wider uppercase">
            МАЙКОПСКИЙ РАЙОН
          </div>
          <div className="absolute top-[75%] left-[38%] text-[10px] text-slate-400 font-medium bg-white/70 px-2 py-0.5 rounded shadow-sm border border-slate-100">
            Кавказский Заповедник
          </div>

          {/* Interactive Sight Pins plotted dynamically */}
          {sights.map(sight => {
            const { x, y } = getRelativeXY(sight.coordinates.lat, sight.coordinates.lng);
            const isSelected = selectedSight?.id === sight.id;

            return (
              <button
                key={sight.id}
                onClick={() => onSelectSight(sight)}
                className="absolute transition-all duration-300 z-20 group"
                style={{ top: `${y}%`, left: `${x}%`, transform: "translate(-50%, -50%)" }}
                id={`map_pin_${sight.id}`}
              >
                {/* Visual pulse for selection */}
                {isSelected && (
                  <span className="absolute -inset-2.5 rounded-full bg-teal-500/30 animate-ping" />
                )}

                {/* Pin pin marker */}
                <span className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform ${
                  isSelected 
                    ? "bg-teal-600 text-white scale-125 ring-4 ring-teal-100" 
                    : "bg-white text-teal-600 border border-teal-100 hover:scale-110 group-hover:bg-teal-50"
                }`}>
                  <MapPin className="w-4 h-4" />
                </span>

                {/* Floating label */}
                <span className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] font-medium rounded-lg shadow-sm border transition-opacity pointer-events-none ${
                  isSelected 
                    ? "bg-teal-950 text-teal-50 border-teal-800 opacity-100" 
                    : "bg-white/95 text-slate-700 border-slate-100 opacity-0 group-hover:opacity-100"
                }`}>
                  {sight.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected PIN panel dashboard at the bottom */}
      <div className="mt-4 border-t border-slate-100 pt-3 z-10">
        {selectedSight ? (
          <div className="flex items-start gap-3 p-3 bg-teal-50/50 rounded-2xl border border-teal-100/50 transition duration-300">
            <img 
              src={selectedSight.image} 
              alt={selectedSight.title} 
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <span className="px-2 py-0.5 bg-teal-600 text-white font-mono text-[9px] uppercase tracking-wider rounded-md font-semibold">
                {selectedSight.category}
              </span>
              <h4 className="font-display font-bold text-slate-800 text-sm mt-1 truncate">
                {selectedSight.title}
              </h4>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                {selectedSight.location}
              </p>
            </div>
            <button 
              onClick={() => {
                // Trigger detail scroll or view
                const el = document.getElementById(`sight_card_${selectedSight.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="text-white bg-teal-600 hover:bg-teal-700 p-2 rounded-xl transition shadow-sm hover:shadow self-center shrink-0"
              title="Открыть информацию"
              id={`map_view_sight_${selectedSight.id}`}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Compass className="w-6 h-6 text-slate-400 mx-auto mb-1 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">
              Выберите гео-метку на карте для просмотра деталей достопримечательности
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
