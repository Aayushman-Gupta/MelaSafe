import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Shield, 
  Truck, 
  Flame, 
  MapPin, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  Users,
  ArrowRight,
  Navigation,
  RefreshCw,
  Route
} from 'lucide-react';
import policeIcon from '../assets/img/emergency/police.png';
import ambulanceIcon from '../assets/img/emergency/ambulance.png';
import fireIcon from '../assets/img/emergency/fire.png';

const EmergencyPersonell = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [recommendedPositions, setRecommendedPositions] = useState([]);
  const [crowdRedirectionPlan, setCrowdRedirectionPlan] = useState([]);
  const [predictionTime, setPredictionTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personnel'); // 'personnel' or 'crowd'

  // Custom icons for recommended positions
  const icons = {
    police: new L.Icon({
      iconUrl: policeIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
    ambulance: new L.Icon({
      iconUrl: ambulanceIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
    fire: new L.Icon({
      iconUrl: fireIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    }),
    // Safe zone marker
    safeZone: new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
          <path d="M9 12l2 2 4-4"/>
          <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
        </svg>
      `),
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  };

  // Backend API integration functions
  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      
      // Replace with your actual backend endpoints
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      
      // Parallel API calls for better performance
      const [heatmapResponse, personnelResponse, crowdResponse] = await Promise.allSettled([
        fetch(`${apiBaseUrl}/api/heatmap-predictions`),
        fetch(`${apiBaseUrl}/api/personnel-recommendations`),
        fetch(`${apiBaseUrl}/api/crowd-redirection-plan`)
      ]);

      // Handle heatmap data
      if (heatmapResponse.status === 'fulfilled' && heatmapResponse.value.ok) {
        const heatmapData = await heatmapResponse.value.json();
        setHeatmapData(heatmapData.zones || []);
      } else {
        // Fallback to mock data for development
        setHeatmapData(getMockHeatmapData());
      }

      // Handle personnel recommendations
      if (personnelResponse.status === 'fulfilled' && personnelResponse.value.ok) {
        const personnelData = await personnelResponse.value.json();
        setRecommendedPositions(personnelData.recommendations || []);
      } else {
        // Generate recommendations from heatmap data
        generateRecommendedPositions(heatmapData.zones || getMockHeatmapData());
      }

      // Handle crowd redirection plan
      if (crowdResponse.status === 'fulfilled' && crowdResponse.value.ok) {
        const crowdData = await crowdResponse.value.json();
        setCrowdRedirectionPlan(crowdData.redirections || []);
      } else {
        // Generate crowd redirection plan from heatmap data
        generateCrowdRedirectionPlan(heatmapData.zones || getMockHeatmapData());
      }
      
      setPredictionTime(new Date().toLocaleString());
      
    } catch (error) {
      console.error('Error fetching predictive data:', error);
      // Use mock data as fallback
      const mockData = getMockHeatmapData();
      setHeatmapData(mockData);
      generateRecommendedPositions(mockData);
      generateCrowdRedirectionPlan(mockData);
      setPredictionTime(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  };

  // Send deployment confirmation to backend
  const confirmDeployment = async (deploymentData) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/api/confirm-deployment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData)
      });
      
      if (response.ok) {
        console.log('Deployment confirmed successfully');
      }
    } catch (error) {
      console.error('Error confirming deployment:', error);
    }
  };

  // Send crowd redirection status to backend
  const updateRedirectionStatus = async (redirectionId, status) => {
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      await fetch(`${apiBaseUrl}/api/update-redirection-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectionId, status })
      });
    } catch (error) {
      console.error('Error updating redirection status:', error);
    }
  };

  const getMockHeatmapData = () => [
    { 
      id: 'zone_1',
      lat: 51.505, 
      lng: -0.09, 
      density: 85, 
      radius: 800, 
      risk_level: 'high', 
      area_name: 'Westminster',
      current_capacity: 2500,
      max_capacity: 3000,
      expected_peak_time: '16:30'
    },
    { 
      id: 'zone_2',
      lat: 51.515, 
      lng: -0.1, 
      density: 70, 
      radius: 600, 
      risk_level: 'medium', 
      area_name: 'Oxford Street',
      current_capacity: 1800,
      max_capacity: 2500,
      expected_peak_time: '17:00'
    },
    { 
      id: 'zone_3',
      lat: 51.52, 
      lng: -0.08, 
      density: 95, 
      radius: 900, 
      risk_level: 'critical', 
      area_name: 'King\'s Cross',
      current_capacity: 3200,
      max_capacity: 3500,
      expected_peak_time: '15:45'
    },
    { 
      id: 'zone_4',
      lat: 51.51, 
      lng: -0.12, 
      density: 60, 
      radius: 500, 
      risk_level: 'medium', 
      area_name: 'Hyde Park Corner',
      current_capacity: 1200,
      max_capacity: 2000,
      expected_peak_time: '16:15'
    },
    { 
      id: 'zone_5',
      lat: 51.500, 
      lng: -0.07, 
      density: 45, 
      radius: 400, 
      risk_level: 'low', 
      area_name: 'London Bridge',
      current_capacity: 800,
      max_capacity: 1800,
      expected_peak_time: '17:30'
    }
  ];

  const generateRecommendedPositions = (heatmapData) => {
    const positions = [];
    
    heatmapData.forEach((zone, index) => {
      if (zone.density > 60) {
        // Police positioning
        positions.push({
          id: `police_${zone.id}`,
          lat: zone.lat + 0.002,
          lng: zone.lng + 0.002,
          type: 'police',
          priority: zone.risk_level,
          coverage_area: zone.area_name,
          predicted_demand: Math.round(zone.density * 0.6),
          optimal_time: zone.expected_peak_time || '15:30',
          reason: `High crowd density predicted (${zone.density}%)`,
          status: 'pending'
        });
        
        // Ambulance positioning for critical zones
        if (zone.risk_level === 'critical' || zone.risk_level === 'high') {
          positions.push({
            id: `ambulance_${zone.id}`,
            lat: zone.lat - 0.002,
            lng: zone.lng - 0.002,
            type: 'ambulance',
            priority: zone.risk_level,
            coverage_area: zone.area_name,
            predicted_demand: Math.round(zone.density * 0.4),
            optimal_time: zone.expected_peak_time || '15:45',
            reason: `Medical emergency risk zone (${zone.density}% density)`,
            status: 'pending'
          });
        }
        
        // Fire department for very high density areas
        if (zone.density > 80) {
          positions.push({
            id: `fire_${zone.id}`,
            lat: zone.lat + 0.001,
            lng: zone.lng - 0.003,
            type: 'fire',
            priority: zone.risk_level,
            coverage_area: zone.area_name,
            predicted_demand: Math.round(zone.density * 0.3),
            optimal_time: zone.expected_peak_time || '16:00',
            reason: `Fire safety concern in dense area (${zone.density}%)`,
            status: 'pending'
          });
        }
      }
    });
    
    setRecommendedPositions(positions);
  };

  const generateCrowdRedirectionPlan = (heatmapData) => {
    const redirections = [];
    const highDensityZones = heatmapData.filter(zone => zone.density > 70);
    const lowDensityZones = heatmapData.filter(zone => zone.density < 60);
    
    highDensityZones.forEach(sourceZone => {
      // Find nearest low-density zones for redirection
      const nearbyLowDensityZones = lowDensityZones
        .map(targetZone => ({
          ...targetZone,
          distance: calculateDistance(sourceZone.lat, sourceZone.lng, targetZone.lat, targetZone.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2); // Top 2 nearest alternatives

      nearbyLowDensityZones.forEach(targetZone => {
        const crowdToRedirect = Math.min(
          sourceZone.current_capacity - sourceZone.max_capacity * 0.8, // Don't exceed 80% capacity in source
          targetZone.max_capacity - targetZone.current_capacity // Available space in target
        );

        if (crowdToRedirect > 0) {
          redirections.push({
            id: `redirect_${sourceZone.id}_${targetZone.id}`,
            from_zone: sourceZone,
            to_zone: targetZone,
            estimated_crowd_size: Math.round(crowdToRedirect),
            route_coords: [
              [sourceZone.lat, sourceZone.lng],
              [targetZone.lat, targetZone.lng]
            ],
            estimated_travel_time: Math.round(targetZone.distance * 2), // Rough estimate: 2 min per km
            redirection_method: crowdToRedirect > 500 ? 'guided_transport' : 'foot_guidance',
            priority: sourceZone.risk_level,
            status: 'planned',
            effectiveness_score: Math.round((crowdToRedirect / sourceZone.current_capacity) * 100),
            alternative_routes: generateAlternativeRoutes(sourceZone, targetZone)
          });
        }
      });
    });
    
    setCrowdRedirectionPlan(redirections);
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const generateAlternativeRoutes = (source, target) => {
    // Generate 2 alternative routes with slight variations
    const midLat = (source.lat + target.lat) / 2;
    const midLng = (source.lng + target.lng) / 2;
    
    return [
      {
        name: 'Main Route',
        coords: [[source.lat, source.lng], [target.lat, target.lng]],
        estimated_time: Math.round(calculateDistance(source.lat, source.lng, target.lat, target.lng) * 2)
      },
      {
        name: 'Alternative Route A',
        coords: [
          [source.lat, source.lng], 
          [midLat + 0.002, midLng - 0.002], 
          [target.lat, target.lng]
        ],
        estimated_time: Math.round(calculateDistance(source.lat, source.lng, target.lat, target.lng) * 2.3)
      },
      {
        name: 'Alternative Route B',
        coords: [
          [source.lat, source.lng], 
          [midLat - 0.002, midLng + 0.002], 
          [target.lat, target.lng]
        ],
        estimated_time: Math.round(calculateDistance(source.lat, source.lng, target.lat, target.lng) * 2.5)
      }
    ];
  };

  useEffect(() => {
    fetchPredictiveData();
    // Refresh predictions every 5 minutes for real-time updates
    const interval = setInterval(fetchPredictiveData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getRiskBgColor = (riskLevel) => {
    switch(riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (type) => {
    switch(type) {
      case 'police': return <Shield className="w-4 h-4" />;
      case 'ambulance': return <Truck className="w-4 h-4" />;
      case 'fire': return <Flame className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getRedirectionMethodColor = (method) => {
    switch(method) {
      case 'guided_transport': return 'bg-blue-100 text-blue-800';
      case 'foot_guidance': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRecommendations = recommendedPositions.length;
  const criticalZones = heatmapData.filter(zone => zone.risk_level === 'critical').length;
  const highRiskZones = heatmapData.filter(zone => zone.risk_level === 'high').length;
  const totalCrowdRedirections = crowdRedirectionPlan.length;
  const peopleToRedirect = crowdRedirectionPlan.reduce((sum, plan) => sum + plan.estimated_crowd_size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-indigo-800 bg-clip-text text-transparent">
              AI Emergency & Crowd Management System
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            AI-powered recommendations for optimal emergency deployment and intelligent crowd flow management
          </p>
          {predictionTime && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {predictionTime}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalRecommendations}</p>
                <p className="text-gray-600">Personnel Units</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{criticalZones}</p>
                <p className="text-gray-600">Critical Zones</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{highRiskZones}</p>
                <p className="text-gray-600">High Risk Areas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalCrowdRedirections}</p>
                <p className="text-gray-600">Redirection Plans</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{peopleToRedirect.toLocaleString()}</p>
                <p className="text-gray-600">People to Redirect</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('personnel')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'personnel'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Personnel Deployment
            </button>
            <button
              onClick={() => setActiveTab('crowd')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'crowd'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Crowd Management
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      {activeTab === 'personnel' ? 'Personnel Deployment Map' : 'Crowd Redirection Map'}
                    </h2>
                  </div>
                  <button 
                    onClick={fetchPredictiveData}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Updating...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <MapContainer
                  center={[51.505, -0.09]}
                  zoom={13}
                  className="h-96 w-full rounded-xl"
                  style={{ minHeight: '500px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Heatmap circles for crowd density */}
                  {heatmapData.map((zone, index) => (
                    <Circle
                      key={`heatmap-${index}`}
                      center={[zone.lat, zone.lng]}
                      radius={zone.radius || 500}
                      fillColor={getRiskColor(zone.risk_level)}
                      fillOpacity={0.2}
                      color={getRiskColor(zone.risk_level)}
                      weight={2}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-gray-800 mb-2">{zone.area_name}</h4>
                          <p className="text-sm text-gray-600 mb-1">Density: <span className="font-medium">{zone.density}%</span></p>
                          <p className="text-sm text-gray-600 mb-1">Capacity: <span className="font-medium">{zone.current_capacity?.toLocaleString()}/{zone.max_capacity?.toLocaleString()}</span></p>
                          <p className="text-sm text-gray-600 mb-1">Risk: <span className={`font-medium ${getRiskBgColor(zone.risk_level)} px-2 py-1 rounded`}>{zone.risk_level}</span></p>
                          <p className="text-sm text-gray-600">Peak: {zone.expected_peak_time}</p>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  
                  {/* Personnel deployment markers */}
                  {activeTab === 'personnel' && recommendedPositions.map((position, index) => (
                    <Marker
                      key={`position-${index}`}
                      position={[position.lat, position.lng]}
                      icon={icons[position.type]}
                    >
                      <Popup>
                        <div className="p-2 min-w-64">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="text-gray-700">
                              {getServiceIcon(position.type)}
                            </div>
                            <p className="font-bold text-gray-800 capitalize">{position.type} Unit</p>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Coverage: <span className="font-medium">{position.coverage_area}</span></p>
                          <p className="text-sm text-gray-600 mb-1">Priority: <span className={`font-medium ${getRiskBgColor(position.priority)} px-2 py-1 rounded`}>{position.priority}</span></p>
                          <p className="text-sm text-gray-600 mb-1">Deploy by: <span className="font-medium">{position.optimal_time}</span></p>
                          <p className="text-sm text-gray-600 mb-1">Expected demand: <span className="font-medium">{position.predicted_demand}%</span></p>
                          <p className="text-xs text-gray-500 mt-2 italic">{position.reason}</p>
                          <button 
                            onClick={() => confirmDeployment(position)}
                            className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Confirm Deployment
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Crowd redirection routes and safe zones */}
                  {activeTab === 'crowd' && crowdRedirectionPlan.map((plan, index) => (
                    <React.Fragment key={`redirection-${index}`}>
                      {/* Redirection route */}
                      <Polyline
                        positions={plan.route_coords}
                        color="#3B82F6"
                        weight={4}
                        opacity={0.8}
                        dashArray="10, 10"
                      />
                      
                      {/* Safe zone (destination) marker */}
                      <Marker
                        position={[plan.to_zone.lat, plan.to_zone.lng]}
                        icon={icons.safeZone}
                      >
                        <Popup>
                          <div className="p-2 min-w-64">
                            <h4 className="font-bold text-green-800 mb-2">Safe Zone: {plan.to_zone.area_name}</h4>
                            <p className="text-sm text-gray-600 mb-1">Available Capacity: <span className="font-medium">{(plan.to_zone.max_capacity - plan.to_zone.current_capacity)?.toLocaleString()}</span></p>
                            <p className="text-sm text-gray-600 mb-1">Current Density: <span className="font-medium">{plan.to_zone.density}%</span></p>
                            <p className="text-sm text-gray-600 mb-1">Travel Time: <span className="font-medium">{plan.estimated_travel_time} min</span></p>
                            <p className="text-sm text-gray-600">People to redirect: <span className="font-medium">{plan.estimated_crowd_size?.toLocaleString()}</span></p>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {activeTab === 'personnel' ? (
              <>
                {/* Deployment Recommendations */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Deployment Queue</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recommendedPositions
                      .sort((a, b) => a.optimal_time.localeCompare(b.optimal_time))
                      .map((position, index) => (
                      <div key={index} className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(position.type)}
                            <span className="font-medium text-gray-800 capitalize">{position.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{position.optimal_time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{position.coverage_area}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(position.priority)}`}>
                            {position.priority}
                          </span>
                          <span className="text-xs text-gray-500">{position.predicted_demand}% demand</span>
                        </div>
                        <button 
                          onClick={() => confirmDeployment(position)}
                          className="mt-2 w-full px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors"
                        >
                          Deploy Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Zones Summary */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Risk Assessment</h3>
                  <div className="space-y-3">
                    {heatmapData
                      .sort((a, b) => b.density - a.density)
                      .map((zone, index) => (
                      <div key={index} className="p-3 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800">{zone.area_name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(zone.risk_level)}`}>
                            {zone.risk_level}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Density: {zone.density}%</span>
                          <span>{zone.current_capacity?.toLocaleString()}/{zone.max_capacity?.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Peak expected: {zone.expected_peak_time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Crowd Redirection Plans */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Redirection Plans</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {crowdRedirectionPlan
                      .sort((a, b) => a.priority === 'critical' ? -1 : b.priority === 'critical' ? 1 : 0)
                      .map((plan, index) => (
                      <div key={index} className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-800">
                              {plan.from_zone.area_name} → {plan.to_zone.area_name}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(plan.priority)}`}>
                            {plan.priority}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 mb-2">
                          <div className="flex justify-between">
                            <span>People to redirect:</span>
                            <span className="font-medium">{plan.estimated_crowd_size?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Travel time:</span>
                            <span className="font-medium">{plan.estimated_travel_time} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effectiveness:</span>
                            <span className="font-medium">{plan.effectiveness_score}%</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRedirectionMethodColor(plan.redirection_method)}`}>
                            {plan.redirection_method.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">{plan.status}</span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateRedirectionStatus(plan.id, 'active')}
                            className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Activate
                          </button>
                          <button 
                            onClick={() => updateRedirectionStatus(plan.id, 'paused')}
                            className="flex-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                          >
                            Pause
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative Routes */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Route Options</h3>
                  <div className="space-y-4">
                    {crowdRedirectionPlan.slice(0, 2).map((plan, planIndex) => (
                      <div key={planIndex} className="p-3 rounded-xl bg-gray-50">
                        <h4 className="font-medium text-gray-800 mb-2">
                          {plan.from_zone.area_name} → {plan.to_zone.area_name}
                        </h4>
                        <div className="space-y-2">
                          {plan.alternative_routes?.map((route, routeIndex) => (
                            <div key={routeIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <Route className="w-3 h-3 text-gray-500" />
                                <span className="text-sm font-medium">{route.name}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {route.estimated_time} min
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redirection Statistics */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Redirection Impact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-800">Total People</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {peopleToRedirect.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-800">Avg. Effectiveness</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(crowdRedirectionPlan.reduce((sum, plan) => sum + plan.effectiveness_score, 0) / crowdRedirectionPlan.length) || 0}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-800">Avg. Travel Time</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {Math.round(crowdRedirectionPlan.reduce((sum, plan) => sum + plan.estimated_travel_time, 0) / crowdRedirectionPlan.length) || 0} min
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPersonell;