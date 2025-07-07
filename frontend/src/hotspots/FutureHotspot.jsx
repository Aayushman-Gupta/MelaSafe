import React, { useState } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const FutureHotspots = () => {
    const [futureTime, setFutureTime] = useState(30); // in minutes
    const [predictedHotspots, setPredictedHotspots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Sample crowd density data for New Delhi locations
    const sampleCrowdData = [
        // High density areas (red)
        { latitude: 28.6562, longitude: 77.2410, density: "high", location: "Connaught Place" },
        { latitude: 28.6507, longitude: 77.2334, density: "high", location: "Rajiv Chowk Metro" },
        { latitude: 28.6139, longitude: 77.2090, density: "high", location: "India Gate" },
        { latitude: 28.6169, longitude: 77.2295, density: "high", location: "Khan Market" },
        
        // Medium density areas (orange)
        { latitude: 28.5355, longitude: 77.3910, density: "medium", location: "Greater Noida" },
        { latitude: 28.4595, longitude: 77.0266, density: "medium", location: "Gurgaon Sector 29" },
        { latitude: 28.7041, longitude: 77.1025, density: "medium", location: "Delhi University" },
        { latitude: 28.5494, longitude: 77.2499, density: "medium", location: "Nehru Place" },
        { latitude: 28.6304, longitude: 77.2177, density: "medium", location: "Lajpat Nagar" },
        
        // Low density areas (yellow)
        { latitude: 28.6692, longitude: 77.4538, density: "low", location: "Noida Sector 18" },
        { latitude: 28.4089, longitude: 77.3178, density: "low", location: "Faridabad" },
        { latitude: 28.7196, longitude: 77.0369, density: "low", location: "Rohini" },
        { latitude: 28.5167, longitude: 77.0833, density: "low", location: "Dwarka" },
        { latitude: 28.6000, longitude: 77.3667, density: "low", location: "Mayur Vihar" },
        
        // Very low density areas (green)
        { latitude: 28.7500, longitude: 77.1167, density: "very-low", location: "Outer Delhi" },
        { latitude: 28.4744, longitude: 77.5040, density: "very-low", location: "Greater Noida West" },
        { latitude: 28.3974, longitude: 77.0728, density: "very-low", location: "Manesar" },
        { latitude: 28.8386, longitude: 77.0851, density: "very-low", location: "Narela" }
    ];

    const getDensityColor = (density) => {
        switch (density) {
            case "high": return { fill: "#dc2626", stroke: "#b91c1c" }; // Red
            case "medium": return { fill: "#ea580c", stroke: "#c2410c" }; // Orange
            case "low": return { fill: "#eab308", stroke: "#ca8a04" }; // Yellow
            case "very-low": return { fill: "#16a34a", stroke: "#15803d" }; // Green
            default: return { fill: "#6b7280", stroke: "#4b5563" }; // Gray
        }
    };

    const getDensityRadius = (density) => {
        switch (density) {
            case "high": return 500;
            case "medium": return 400;
            case "low": return 300;
            case "very-low": return 200;
            default: return 250;
        }
    };

    const fetchPredictions = async () => {
        setLoading(true);
        setSubmitted(true);
        try {
            // Simulate API call with sample data
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate some predicted hotspots based on time
            const predictions = [];
            if (futureTime >= 30) {
                predictions.push(
                    { latitude: 28.6328, longitude: 77.2197, intensity: "high" },
                    { latitude: 28.6745, longitude: 77.1200, intensity: "medium" }
                );
            }
            if (futureTime >= 60) {
                predictions.push(
                    { latitude: 28.5921, longitude: 77.0460, intensity: "medium" },
                    { latitude: 28.5672, longitude: 77.3507, intensity: "low" }
                );
            }
            
            setPredictedHotspots(predictions);
        } catch {
            setPredictedHotspots([]);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Asymmetric curved background */}
            <div className="absolute inset-0 pointer-events-none">
                <svg
                    viewBox="0 0 1200 800"
                    className="absolute top-0 left-0 w-full h-3/5"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
                            <stop offset="30%" stopColor="#fdba74" stopOpacity="0.6" />
                            <stop offset="70%" stopColor="#fb923c" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f97316" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,0 L1200,0 L1200,320 C900,380 700,420 500,360 C300,300 150,280 0,340 Z"
                        fill="url(#orangeGradient)"
                    />
                </svg>
            </div>

            {/* Floating elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 opacity-20 rounded-full animate-float-slow"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300 opacity-25 rounded-full animate-float-medium"></div>
                <div className="absolute top-60 left-1/3 w-16 h-16 bg-orange-400 opacity-30 rounded-full animate-float-fast"></div>
                <div className="absolute top-32 right-1/3 w-8 h-8 bg-orange-500 opacity-40 rounded-full animate-float-reverse"></div>
                <div className="absolute top-80 left-1/4 w-6 h-6 bg-orange-600 opacity-35 rounded-full animate-float-slow"></div>
                <div className="absolute top-96 right-1/4 w-10 h-10 bg-orange-300 opacity-25 rounded-full animate-float-medium"></div>
                <div className="absolute top-48 left-20 w-12 h-12 bg-orange-400 opacity-30 rotate-45 animate-float-fast"></div>
                <div className="absolute top-72 right-32 w-8 h-8 bg-orange-500 opacity-35 rounded animate-float-reverse"></div>
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Clean header section */}
                <div className="text-center mb-12 pt-8">
                    <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">
                        Future
                        <span className="font-medium text-orange-600 ml-3">Hotspots</span>
                    </h1>
                    <p className="text-gray-600 text-lg font-light max-w-md mx-auto">
                        Predict traffic patterns and analyze crowd density
                    </p>
                    <div className="mt-4 w-16 h-0.5 bg-orange-500 mx-auto"></div>
                </div>

                {/* Controls section */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 backdrop-blur-sm bg-white/90">
                        <div className="text-center space-y-4">
                            <label className="block text-gray-700 font-medium text-lg">
                                Prediction timeframe
                            </label>
                            
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    min="10"
                                    max="120"
                                    step="10"
                                    value={futureTime}
                                    onChange={(e) => setFutureTime(e.target.value)}
                                    className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="text-2xl font-light text-orange-600">
                                    {futureTime} <span className="text-lg text-gray-500">minutes</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={fetchPredictions}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Generate Predictions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                )}

                {/* Map section - Always visible with crowd data */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-white/95">
                        <div className="h-[60vh] w-full rounded-lg overflow-hidden transition-transform duration-500 ease-out hover:scale-105">
                            <MapContainer
                                center={[28.6139, 77.209]} // Delhi center
                                zoom={11}
                                className="h-full w-full"
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                
                                {/* Crowd density circles */}
                                {sampleCrowdData.map((spot, idx) => {
                                    const colors = getDensityColor(spot.density);
                                    return (
                                        <Circle
                                            key={`crowd-${idx}`}
                                            center={[spot.latitude, spot.longitude]}
                                            radius={getDensityRadius(spot.density)}
                                            pathOptions={{
                                                fillColor: colors.fill,
                                                fillOpacity: 0.3,
                                                color: colors.stroke,
                                                weight: 2,
                                                opacity: 0.7,
                                            }}
                                        />
                                    );
                                })}
                                
                                {/* Predicted hotspots (shown after prediction) */}
                                {submitted && predictedHotspots.map((spot, idx) => (
                                    <Circle
                                        key={`prediction-${idx}`}
                                        center={[spot.latitude, spot.longitude]}
                                        radius={400}
                                        pathOptions={{
                                            fillColor: "#8b5cf6",
                                            fillOpacity: 0.5,
                                            color: "#7c3aed",
                                            weight: 3,
                                            opacity: 0.9,
                                            dashArray: "10, 10"
                                        }}
                                    />
                                ))}
                            </MapContainer>
                        </div>
                        
                        {/* Enhanced map legend */}
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                {/* Crowd density legend */}
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-red-600 opacity-60 rounded-full"></div>
                                    <span className="text-gray-600">High Crowd Density</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-orange-600 opacity-60 rounded-full"></div>
                                    <span className="text-gray-600">Medium Density</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-yellow-500 opacity-60 rounded-full"></div>
                                    <span className="text-gray-600">Low Density</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-green-600 opacity-60 rounded-full"></div>
                                    <span className="text-gray-600">Very Low Density</span>
                                </div>
                                {submitted && predictedHotspots.length > 0 && (
                                    <div className="flex items-center space-x-2 md:col-span-2">
                                        <div className="w-4 h-4 bg-purple-600 opacity-70 rounded-full border-2 border-dashed border-purple-700"></div>
                                        <span className="text-gray-600">Predicted Future Hotspots</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results summary */}
                {submitted && !loading && (
                    <div className="max-w-4xl mx-auto mt-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 backdrop-blur-sm bg-white/95">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Current High Density Areas:</span>
                                    <p className="text-gray-600 mt-1">Connaught Place, Rajiv Chowk Metro, India Gate, Khan Market</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Predicted Hotspots ({futureTime} min):</span>
                                    <p className="text-gray-600 mt-1">
                                        {predictedHotspots.length > 0 
                                            ? `${predictedHotspots.length} new congestion areas identified`
                                            : "No significant changes predicted"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom styles */}
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #f97316;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #f97316;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }

                @keyframes float-medium {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-3deg); }
                }

                @keyframes float-fast {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(8deg); }
                }

                @keyframes float-reverse {
                    0%, 100% { transform: translateY(-10px) rotate(0deg); }
                    50% { transform: translateY(0px) rotate(-5deg); }
                }

                .animate-float-slow {
                    animation: float-slow 6s ease-in-out infinite;
                }

                .animate-float-medium {
                    animation: float-medium 4s ease-in-out infinite;
                    animation-delay: 1s;
                }

                .animate-float-fast {
                    animation: float-fast 3s ease-in-out infinite;
                    animation-delay: 2s;
                }

                .animate-float-reverse {
                    animation: float-reverse 5s ease-in-out infinite;
                    animation-delay: 0.5s;
                }
            `}</style>
        </div>
    );
};

export default FutureHotspots;