import React, { useState, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    Polyline
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper to update map center
function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);
    return null;
}

// Gradient color generator with refined colors
const getColor = (intensity) => {
    if (intensity < 0.3) return "#22c55e"; // green-500
    if (intensity < 0.5) return "#84cc16"; // lime-500
    if (intensity < 0.7) return "#eab308"; // yellow-500
    if (intensity < 0.9) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
};

// Render the polyline in segments with gradient
const GradientPolyline = ({ path }) => {
    if (path.length < 2) return null;

    const segments = [];
    for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        const intensity = start.intensity || 0.5;
        segments.push(
            <Polyline
                key={i}
                positions={[
                    [start.lat, start.lng],
                    [end.lat, end.lng],
                ]}
                color={getColor(intensity)}
                weight={4}
                opacity={0.8}
            />
        );
    }
    return <>{segments}</>;
};

const Travel = () => {
    const [source, setSource] = useState("");
    const [destination, setDestination] = useState("");
    const [path, setPath] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => {
                    console.error(err);
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }
        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const handleSubmit = async () => {
        if (!source || !destination) return;
        const res = await fetch("/api/get-path", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source, destination }),
        });
        const data = await res.json();
        const rawPath = data.path || [];

        const formattedPath = rawPath.map((point) => ({
            lat: point.lat || point[0],
            lng: point.lng || point[1],
            intensity: point.intensity ?? 0.5, // default intensity
        }));

        setPath(formattedPath);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header Section */}
            <div className="relative">
                <div 
                    className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 pt-16 pb-40"
                    style={{
                        borderBottomLeftRadius: "50% 60px",
                        borderBottomRightRadius: "50% 60px"
                    }}
                >
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h1 className="text-5xl font-light text-white mb-4 tracking-wide">
                            Safe Travel
                        </h1>
                        <p className="text-white/80 text-lg font-light">
                            Find the safest route to your destination
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
                
                {/* Floating Form */}
                <div className="absolute inset-x-0" style={{ top: "65%" }}>
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        From
                                    </label>
                                    <input
                                        type="text"
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="Enter starting point"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        To
                                    </label>
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        placeholder="Enter destination"
                                    />
                                </div>
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                                >
                                    Find Safest Route
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Map Section */}
            <div className="mt-30 pb-16">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transition-transform duration-500 ease-out hover:scale-105">
                        <MapContainer
                            center={userLocation || [28.6139, 77.209]}
                            zoom={13}
                            className="h-96 w-full"
                            style={{ height: "28rem" }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {userLocation && <Marker position={userLocation} />}
                            {path.length > 0 && (
                                <>
                                    <GradientPolyline path={path} />
                                    <Marker position={[path[0].lat, path[0].lng]} />
                                    <Marker position={[path[path.length - 1].lat, path[path.length - 1].lng]} />
                                </>
                            )}
                            <MapUpdater position={userLocation} />
                        </MapContainer>
                    </div>
                </div>
            </div>

                        {/* Route Legend */}
            <div className="pb-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Route Safety Levels</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">Very Safe</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 rounded-full bg-lime-500"></div>
                                <span className="text-sm text-gray-600">Safe</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600">Moderate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 rounded-full bg-orange-500"></div>
                                <span className="text-sm text-gray-600">Caution</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">High Risk</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Travel;