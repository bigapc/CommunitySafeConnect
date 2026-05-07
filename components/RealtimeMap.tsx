'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMapStore, MapLocation } from '@/lib/mapStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import 'leaflet/dist/leaflet.css';

interface RealtimeMapProps {
  height?: string;
  onLocationSelect?: (location: MapLocation) => void;
}

const RealtimeMap: React.FC<RealtimeMapProps> = ({ 
  height = 'h-96',
  onLocationSelect 
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  
  const { locations, center, zoom, setCenter, setZoom, isLiveMode } = useMapStore();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [center[0], center[1]],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center[0], center[1]], zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers with real-time animation
    locations.forEach((location) => {
      const icon = getIconForLocation(location);
      const marker = L.marker([location.lat, location.lng], { icon })
        .bindPopup(getPopupContent(location))
        .addTo(mapRef.current!);

      marker.on('click', () => {
        onLocationSelect?.(location);
      });

      markersRef.current.set(location.id, marker);
    });
  }, [locations, onLocationSelect]);

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-elevation">
      <div 
        ref={containerRef} 
        className={`${height} w-full relative`}
      />
      {isLiveMode && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="info" className="animate-pulse">
            🔴 LIVE - Real-time Updates
          </Badge>
        </div>
      )}
    </div>
  );
};

function getIconForLocation(location: MapLocation): L.DivIcon {
  const iconMap: Record<string, { icon: string; color: string }> = {
    'safe-zone': { icon: '🛡️', color: '#10B981' },
    'incident': { icon: '⚠️', color: location.severity === 'critical' ? '#7C3AED' : '#EF4444' },
    'user': { icon: '📍', color: '#0066FF' },
    'patrol': { icon: '🚔', color: '#F59E0B' },
  };

  const config = iconMap[location.type] || iconMap['user'];

  const html = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full text-lg shadow-md" 
         style="background-color: ${config.color}; border: 3px solid white;">
      ${config.icon}
    </div>
  `;

  return L.divIcon({
    html,
    iconSize: [40, 40],
    className: 'custom-icon',
  });
}

function getPopupContent(location: MapLocation): string {
  const severityBadge = location.severity 
    ? `<span class="inline-block px-2 py-1 text-xs rounded-full font-semibold bg-red-100 text-red-800">${location.severity.toUpperCase()}</span>`
    : '';
  
  return `
    <div class="p-2 min-w-60">
      <h3 class="font-bold text-sm text-neutral-900">${location.name}</h3>
      <p class="text-xs text-neutral-600 mt-1">${location.type.toUpperCase()}</p>
      ${severityBadge ? `<div class="mt-2">${severityBadge}</div>` : ''}
      ${location.status ? `<p class="text-xs mt-2"><strong>Status:</strong> ${location.status}</p>` : ''}
      <p class="text-xs mt-2 text-neutral-500">${new Date(location.timestamp).toLocaleString()}</p>
    </div>
  `;
}

export { RealtimeMap };
