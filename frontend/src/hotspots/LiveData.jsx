import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);
    return null;
}

const Hotspot = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [hotspots, setHotspots] = useState([]);
    const watchIdRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    // Color based on severity
    const getSeverityColor = (level) => {
        switch (level) {
            case 3: return "#ef4444"; // red-500
            case 2: return "#f97316"; // orange-500
            case 1: return "#eab308"; // yellow-500
            default: return "#6b7280"; // gray-500
        }
    };

    // Fetch hotspots from server
    const fetchHotspots = async (lat, lng) => {
        try {
            const res = await fetch("/api/get-hotspots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat, lng }),
            });
            const data = await res.json();
            setHotspots(data.hotspots || []);
        } catch (error) {
            console.error("Error fetching hotspots:", error);
        }
    };

    // Track location + setup polling
    useEffect(() => {
        if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const location = [lat, lng];
                    setUserLocation(location);
                    fetchHotspots(lat, lng); // Fetch initially on position update

                    // Setup or refresh polling
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = setInterval(() => {
                        fetchHotspots(lat, lng);
                    }, 10000); // every 10 seconds
                },
                (err) => console.error("Location error:", err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header Section */}
            <div className="relative">
                <div 
                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 pt-16 pb-40"
                    style={{
                        borderBottomLeftRadius: "50% 60px",
                        borderBottomRightRadius: "50% 60px"
                    }}
                >
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h1 className="text-5xl font-light text-white mb-4 tracking-wide">
                            Live Tracker
                        </h1>
                        <p className="text-white/80 text-lg font-light">
                            Real-time updates every 10 seconds
                        </p>
                        <div className="mt-6 flex justify-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <span className="text-white/90 text-sm font-medium">
                                    {userLocation ? "Location Active" : "Locating..."}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Floating Map Container */}
                <div className="absolute inset-x-0" style={{ top: "65%" }}>
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-transform duration-500 ease-out hover:scale-105">
                            <MapContainer
                                center={userLocation || [28.6139, 77.2090]}
                                zoom={14}
                                className="h-96 w-full"
                                style={{ height: "24rem" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapUpdater position={userLocation} />
                                {userLocation && (
                                    <Marker position={userLocation}>
                                        <Popup>
                                            <div className="text-center">
                                                <strong className="text-gray-800">Your Location</strong>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                                {hotspots.map((spot, idx) => (
                                    <Circle
                                        key={idx}
                                        center={[spot.lat, spot.lng]}
                                        radius={spot.radius || 200}
                                        pathOptions={{
                                            color: getSeverityColor(spot.severity),
                                            fillColor: getSeverityColor(spot.severity),
                                            fillOpacity: 0.3,
                                            weight: 2,
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <h3 className="font-semibold text-gray-800 mb-1">
                                                    {spot.name || "Hotspot"}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: getSeverityColor(spot.severity) }}
                                                    ></div>
                                                    <span className="text-sm text-gray-600">
                                                        Level {spot.severity || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Circle>
                                ))}
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Bottom spacing */}
            <div className="pt-96 pb-16">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Legend */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Severity Levels</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">High (Level 3)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                <span className="text-sm text-gray-600">Medium (Level 2)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600">Low (Level 1)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hotspot;