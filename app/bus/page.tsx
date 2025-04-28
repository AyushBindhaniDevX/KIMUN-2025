"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet'; // Import Leaflet to create custom icons

// Updated list of bus route coordinates (blue route)
const busRouteCoordinates: LatLngTuple[] = [
  [20.353510, 85.826806],
  [20.350317, 85.825669],
  [20.342653, 85.822990],
  [20.326268, 85.820755],
  [20.308049, 85.820303],
  [20.295519, 85.824883],
  [20.278911, 85.798081],
  [20.26445813238183, 85.79116513524033],
  [20.265651026581462, 85.78902833966248],
  [20.265784457689268, 85.78474488123047],
  [20.272599412725985, 85.78371504444407],
  [20.288004598012247, 85.78123513206205],
  [20.29524585894823, 85.78046423158575],
  [20.305679119888794, 85.7816307516967],
  [20.311288727961934, 85.78093816872632],
  [20.313707711298356, 85.78103679235456],
  [20.315433270109118, 85.77551849965364],
  [20.315668049154905, 85.7693203840387],
  [20.320369980638905, 85.76092593472856],
  [20.320166842881164, 85.75625254524054],
  [20.320944552017238, 85.75513614949433],
  [20.321584663527037, 85.75479804106833],
  [20.322027355919214, 85.75486183511097],
  [20.32194958575018, 85.75336905460237],
  [20.327711980880256, 85.73218991367344],
  [20.33154332889063, 85.73711332716243],
  [20.338344550307927, 85.74199786041378],
  [20.337942728906622, 85.74286846797669]
];

// Coordinates for the red route
const redRouteCoordinates: LatLngTuple[] = [
  [20.353510, 85.826806], // Shared starting point
  [20.355000, 85.825000],
  [20.357000, 85.823000],
  [20.360000, 85.820000],
  [20.362000, 85.818000],
  [20.365000, 85.815000],
  [20.367000, 85.813000],
  [20.370000, 85.810000],
  [20.337942728906622, 85.74286846797669] // Shared ending point
];

const busStops = [
  { name: 'Patia Bus Stop', coordinates: [20.353510, 85.826806] },
  { name: 'Nalco Square Bus Stop', coordinates: [20.308049, 85.820303] },
  { name: 'Burmunda Bus Stop', coordinates: [20.278911, 85.798081] },
  { name: 'ASBM University', coordinates: [20.337942728906622, 85.74286846797669] },
  { name: 'New Stop 1', coordinates: [20.355000, 85.825000] },
  { name: 'New Stop 2', coordinates: [20.365000, 85.815000] }
];

const BusRouteMap = () => {
  const [center, setCenter] = useState<LatLngTuple>([20.353510, 85.826806]);

  useEffect(() => {
    // Adjust the map's center or zoom if needed
  }, []);

  // Create a custom icon using Leaflet's L.icon
  const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Replace with your actual image path
    iconSize: [25, 25],  // Size of the icon
    iconAnchor: [12, 12], // Anchor point (center of the icon)
    popupAnchor: [0, -12] // Popup position
  });

  return (
    <div style={{ height: '100vh' }}>
      <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={busRouteCoordinates} color="blue" />
        <Polyline positions={redRouteCoordinates} color="red" />
        {busStops.map((stop, index) => (
          <Marker key={index} position={stop.coordinates} icon={customIcon}>
            <Popup>{stop.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BusRouteMap;