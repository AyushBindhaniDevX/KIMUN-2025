// components/BusRouteMap.tsx
'use client'
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';

// Fix for default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Bus route coordinates
const busRouteCoordinates: LatLngTuple[] = [
  [20.353510, 85.826806],
  [20.350317, 85.825669],
  [20.342653, 85.822990],
  [20.326268, 85.820755],
  [20.308049, 85.820303],
  [20.295519, 85.824883],
  [20.278911, 85.798081],
  [20.264458, 85.791165],
  [20.265651, 85.789028],
  [20.265784, 85.784744],
  [20.272599, 85.783715],
  [20.288004, 85.781235],
  [20.295245, 85.780464],
  [20.305679, 85.781630],
  [20.311288, 85.780938],
  [20.313707, 85.781036],
  [20.315433, 85.775518],
  [20.315668, 85.769320],
  [20.320369, 85.760925],
  [20.320166, 85.756252],
  [20.320944, 85.755136],
  [20.321584, 85.754798],
  [20.322027, 85.754861],
  [20.321949, 85.753369],
  [20.327711, 85.732189],
  [20.331543, 85.737113],
  [20.338344, 85.741997],
  [20.337942, 85.742868]
];

const redRouteCoordinates: LatLngTuple[] = [
  [20.353510, 85.826806],
  [20.355000, 85.825000],
  [20.357000, 85.823000],
  [20.360000, 85.820000],
  [20.362000, 85.818000],
  [20.365000, 85.815000],
  [20.367000, 85.813000],
  [20.370000, 85.810000],
  [20.337942, 85.742868]
];

const busStops = [
  { name: 'Patia Bus Stop', coordinates: [20.353510, 85.826806] as LatLngTuple },
  { name: 'Nalco Square Bus Stop', coordinates: [20.308049, 85.820303] as LatLngTuple },
  { name: 'Burmunda Bus Stop', coordinates: [20.278911, 85.798081] as LatLngTuple },
  { name: 'ASBM University', coordinates: [20.337942, 85.742868] as LatLngTuple },
  { name: 'New Stop 1', coordinates: [20.355000, 85.825000] as LatLngTuple },
  { name: 'New Stop 2', coordinates: [20.365000, 85.815000] as LatLngTuple }
];

interface BusRouteMapProps {
  routeId: string;
}

export function BusRouteMap({ routeId }: BusRouteMapProps) {
  const route = routeId === 'route1' ? busRouteCoordinates : redRouteCoordinates;
  const routeColor = routeId === 'route1' ? 'blue' : 'red';

  return (
    <MapContainer
      center={[20.3014, 85.8019]}
      zoom={13}
      style={{ height: '300px', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline 
        positions={route} 
        color={routeColor}
        weight={3}
        opacity={0.7}
      />
      {busStops.map((stop, index) => (
        <Marker 
          key={index} 
          position={stop.coordinates} 
          icon={defaultIcon}
        >
          <Popup>{stop.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}