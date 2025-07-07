import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

// Custom icons for user and services
const userIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const serviceIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
    iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle location detection, map events, and routing
function LocationMarker({ onLocationChange, services, currentLocation }) {
    const [position, setPosition] = useState(null);
    const [routingControl, setRoutingControl] = useState(null);
    const map = useMap();

    // Handle map click events
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            onLocationChange(e.latlng);
            
            // Remove existing route when changing location
            if (routingControl) {
                map.removeControl(routingControl);
                setRoutingControl(null);
            }
        },
    });

    // Get user's current location on component mount
    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            onLocationChange(e.latlng);
        });
    }, [map, onLocationChange]);

    // Function to create a route to a service
    const createRoute = (serviceLocation) => {
        // Remove existing route if any
        if (routingControl) {
            map.removeControl(routingControl);
        }

        // Create new routing control
        const newRoutingControl = L.Routing.control({
            waypoints: [
                L.latLng(currentLocation.lat, currentLocation.lng),
                L.latLng(serviceLocation.latitude, serviceLocation.longitude)
            ],
            routeWhileDragging: false,
            showAlternatives: false,
            fitSelectedRoutes: true,
            lineOptions: {
                styles: [{ color: '#ec4899', opacity: 0.7, weight: 5 }]
            },
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1',
                profile: 'walking'
            }),
            createMarker: function() { return null; } // Don't create default markers
        }).addTo(map);

        setRoutingControl(newRoutingControl);
    };

    // Add click handlers to service markers
    useEffect(() => {
        if (!services || !position) return;

        services.forEach(service => {
            const markerElement = document.querySelector(`[data-service-id="${service.id}"]`);
            if (markerElement) {
                markerElement.addEventListener('click', () => {
                    createRoute(service);
                });
            }
        });

        return () => {
            services.forEach(service => {
                const markerElement = document.querySelector(`[data-service-id="${service.id}"]`);
                if (markerElement) {
                    markerElement.removeEventListener('click', () => {});
                }
            });
        };
    }, [services, position, map]);

    return position === null ? null : (
        <Marker position={position} icon={userIcon}>
            <Popup>You are here</Popup>
        </Marker>
    );
}

// Calculate distance between two coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(1));
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const NearbyServices = () => {
    const [searchRadius, setSearchRadius] = useState(1); // in kilometers
    const [nearbyServices, setNearbyServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentLocation, setCurrentLocation] = useState({ lat: 28.6139, lng: 77.209 }); // Default: Delhi
    const mapRef = useRef(null);

    // Sample service data (in a real app, this would come from an API)
    const allServices = [
        { id: 1, name: "Central Hospital", latitude: 28.6129, longitude: 77.229 },
        { id: 2, name: "City Police Station", latitude: 28.6159, longitude: 77.219 },
        { id: 3, name: "Metro Station", latitude: 28.6149, longitude: 77.224 },
        { id: 4, name: "Fire Station", latitude: 28.6179, longitude: 77.217 },
        { id: 5, name: "Bus Terminal", latitude: 28.6119, longitude: 77.221 },
        { id: 6, name: "Community Center", latitude: 28.6189, longitude: 77.211 },
    ];

    // Handle location change from map
    const handleLocationChange = (latlng) => {
        setCurrentLocation(latlng);
        if (submitted) {
            fetchNearbyServices(latlng);
        }
    };

    const fetchNearbyServices = async (location = currentLocation) => {
        setLoading(true);
        setSubmitted(true);

        try {
            // In a real app, you would make an API call here
            // const res = await fetch(`/api/nearby-services?lat=${location.lat}&lng=${location.lng}&radius=${searchRadius}`);
            // const data = await res.json();
            // setNearbyServices(data);

            // For demo purposes, filter the sample data based on distance
            setTimeout(() => {
                const filteredServices = allServices
                    .map(service => {
                        const distance = calculateDistance(
                            location.lat,
                            location.lng,
                            service.latitude,
                            service.longitude
                        );
                        return { ...service, distance };
                    })
                    .filter(service => service.distance <= searchRadius)
                    .sort((a, b) => a.distance - b.distance);

                setNearbyServices(filteredServices);
                setLoading(false);
            }, 1000); // Simulate API delay
        } catch (error) {
            console.error("Error fetching services:", error);
            setNearbyServices([]);
            setLoading(false);
        }
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
                        <linearGradient id="orangePinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.8" />
                            <stop offset="30%" stopColor="#fdba74" stopOpacity="0.6" />
                            <stop offset="70%" stopColor="#fb923c" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,0 L1200,0 L1200,320 C900,380 700,420 500,360 C300,300 150,280 0,340 Z"
                        fill="url(#orangePinkGradient)"
                    />
                </svg>
            </div>

            {/* Floating elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Large floating circles */}
                <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 opacity-20 rounded-full animate-float-slow"></div>
                <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300 opacity-25 rounded-full animate-float-medium"></div>
                <div className="absolute top-60 left-1/3 w-16 h-16 bg-orange-400 opacity-30 rounded-full animate-float-fast"></div>
                
                {/* Small floating dots */}
                <div className="absolute top-32 right-1/3 w-8 h-8 bg-pink-500 opacity-40 rounded-full animate-float-reverse"></div>
                <div className="absolute top-80 left-1/4 w-6 h-6 bg-pink-600 opacity-35 rounded-full animate-float-slow"></div>
                <div className="absolute top-96 right-1/4 w-10 h-10 bg-orange-300 opacity-25 rounded-full animate-float-medium"></div>
                
                {/* Service-themed shapes */}
                <div className="absolute top-48 left-20 w-12 h-12 bg-orange-400 opacity-30 rotate-45 animate-float-fast"></div>
                <div className="absolute top-72 right-32 w-8 h-8 bg-pink-500 opacity-35 rounded animate-float-reverse"></div>
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Clean header section */}
                <div className="text-center mb-12 pt-8">
                    <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">
                        Nearby
                        <span className="font-medium text-orange-600 ml-3">Services</span>
                    </h1>
                    <p className="text-gray-600 text-lg font-light max-w-md mx-auto">
                        Find essential services around your location
                    </p>
                    <div className="mt-4 w-16 h-0.5 bg-pink-500 mx-auto"></div>
                </div>

                {/* Controls section */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-6 backdrop-blur-sm bg-white/90">
                        <div className="text-center space-y-4">
                            <label className="block text-gray-700 font-medium text-lg">
                                Search radius
                            </label>
                            
                            {/* Custom styled range input */}
                            <div className="space-y-3">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.5"
                                    value={searchRadius}
                                    onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="text-2xl font-light text-orange-600">
                                    {searchRadius} <span className="text-lg text-gray-500">kilometers</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => fetchNearbyServices()}
                                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                )}

                {/* Results section */}
                {submitted && !loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {/* Map section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 transition-all duration-300 hover:shadow-md backdrop-blur-sm bg-white/95">
                                <div className="h-[50vh] w-full rounded-lg overflow-hidden transition-transform duration-500 ease-out hover:scale-105">
                                    <MapContainer
                                        center={[currentLocation.lat, currentLocation.lng]}
                                        zoom={14}
                                        className="h-full w-full"
                                        ref={mapRef}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OpenStreetMap contributors'
                                        />
                                        <LocationMarker 
                                            onLocationChange={handleLocationChange} 
                                            services={nearbyServices}
                                            currentLocation={currentLocation}
                                        />
                                        {nearbyServices.map((service) => (
                                            <Marker
                                                key={service.id}
                                                position={[service.latitude, service.longitude]}
                                                icon={serviceIcon}
                                                eventHandlers={{
                                                    click: () => {
                                                        // This is handled in the LocationMarker component
                                                    }
                                                }}
                                            >
                                                <Popup>
                                                    <div className="font-medium">{service.name}</div>
                                                    <div className="text-sm text-gray-600">{service.distance} km away</div>
                                                    <button 
                                                        className="mt-2 px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                                                        data-service-id={service.id}
                                                    >
                                                        Show Route
                                                    </button>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                                <div className="mt-2 text-center text-sm text-gray-500">
                                    Click anywhere on the map to change your location or click on a service marker to see the route
                                </div>
                            </div>
                        </div>

                        {/* Services list */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 h-full backdrop-blur-sm bg-white/95">
                                <h2 className="text-xl font-medium text-gray-800 mb-4 border-b border-gray-100 pb-2">Nearby Services</h2>
                                
                                {nearbyServices.length > 0 ? (
                                    <div className="space-y-3 overflow-auto max-h-[45vh]">
                                        {nearbyServices.map((service) => (
                                            <div 
                                                key={service.id}
                                                className="p-3 border border-gray-100 rounded-lg hover:bg-orange-50 transition-colors duration-200 cursor-pointer"
                                                onClick={() => {
                                                    // Trigger click on the corresponding marker
                                                    const markerElement = document.querySelector(`[data-service-id="${service.id}"]`);
                                                    if (markerElement) {
                                                        markerElement.click();
                                                    }
                                                }}
                                            >
                                                <div className="font-medium text-gray-800">{service.name}</div>
                                                <div className="text-sm text-pink-600 font-medium">{service.distance} km away</div>
                                                <div className="mt-1 text-xs text-gray-500">Click to show route</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No services found within {searchRadius} km
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom styles for range slider and animations */}
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: linear-gradient(to right, #f97316, #ec4899);
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: linear-gradient(to right, #f97316, #ec4899);
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

export default NearbyServices;