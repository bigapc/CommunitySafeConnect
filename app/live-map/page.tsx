'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useMapStore } from '@/lib/mapStore';

const RealtimeMap = dynamic(
  () => import('@/components/RealtimeMap').then((mod) => mod.RealtimeMap),
  { ssr: false }
);

export default function LiveMapPage() {
  const {
    locations,
    selectedLocation,
    setSelectedLocation,
    addLocation,
    updateLocation,
    getCriticalIncidents,
    isLiveMode,
    setLiveMode,
  } = useMapStore();

  useEffect(() => {
    if (locations.length === 0) {
      addLocation({
        id: 'safe-1',
        name: 'Main Campus Safety Center',
        lat: 40.8075,
        lng: -73.9626,
        type: 'safe-zone',
        timestamp: Date.now(),
        status: 'active',
      });

      addLocation({
        id: 'safe-2',
        name: 'Hospital District',
        lat: 40.7614,
        lng: -73.9776,
        type: 'safe-zone',
        timestamp: Date.now(),
        status: 'active',
      });

      addLocation({
        id: 'incident-1',
        name: 'Active Incident - Downtown',
        lat: 40.758,
        lng: -73.9855,
        type: 'incident',
        severity: 'critical',
        timestamp: Date.now() - 120000,
        status: 'in-progress',
      });

      addLocation({
        id: 'incident-2',
        name: 'Reported Disturbance',
        lat: 40.7489,
        lng: -73.968,
        type: 'incident',
        severity: 'high',
        timestamp: Date.now() - 300000,
        status: 'in-progress',
      });

      addLocation({
        id: 'patrol-1',
        name: 'Patrol Unit 001',
        lat: 40.7549,
        lng: -73.984,
        type: 'patrol',
        timestamp: Date.now(),
        status: 'active',
      });
    }
  }, [addLocation, locations.length]);

  useEffect(() => {
    if (!isLiveMode) {
      return;
    }

    const interval = setInterval(() => {
      locations.forEach((location) => {
        if (location.type === 'patrol') {
          const driftLat = (Math.random() - 0.5) * 0.0018;
          const driftLng = (Math.random() - 0.5) * 0.0018;

          updateLocation(location.id, {
            lat: Number((location.lat + driftLat).toFixed(6)),
            lng: Number((location.lng + driftLng).toFixed(6)),
            timestamp: Date.now(),
            status: 'active',
          });
        }

        if (location.type === 'incident' && Math.random() > 0.72) {
          const severityPool = ['medium', 'high', 'critical'] as const;
          const nextSeverity = severityPool[Math.floor(Math.random() * severityPool.length)];
          const nextStatus = Math.random() > 0.35 ? 'in-progress' : 'active';

          updateLocation(location.id, {
            severity: nextSeverity,
            status: nextStatus,
            timestamp: Date.now(),
          });
        }
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [isLiveMode, locations, updateLocation]);

  const criticalCount = getCriticalIncidents().length;

  return (
    <main className="flex-1 bg-gradient-to-br from-neutral-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">Live Operational Map</h1>
              <p className="text-lg text-neutral-600 mt-2">Real-time incident, patrol, and safe zone visibility</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiveMode(!isLiveMode)}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${isLiveMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {isLiveMode ? 'Pause Feed' : 'Resume Feed'}
              </button>
              <Badge variant={isLiveMode ? 'danger' : 'default'} className="text-base">
                {isLiveMode ? '🔴 LIVE' : '⏸️ OFFLINE'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <RealtimeMap 
            height="h-96"
            onLocationSelect={setSelectedLocation}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="elevated" className="border-l-4 border-red-500">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Critical Incidents</h3>
            <p className="text-4xl font-bold text-red-600 mb-2">{criticalCount}</p>
            <p className="text-sm text-neutral-600">Active incidents requiring immediate response</p>
          </Card>

          <Card variant="elevated">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Active Locations</h3>
            <p className="text-4xl font-bold text-blue-600 mb-2">{locations.length}</p>
            <p className="text-sm text-neutral-600">Safe zones, patrols, and incidents on map</p>
          </Card>

          <Card variant="elevated" className="border-l-4 border-green-500">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">System Status</h3>
            <p className="text-4xl font-bold text-green-600 mb-2">✓ Active</p>
            <p className="text-sm text-neutral-600">All systems operational and monitoring</p>
          </Card>
        </div>

        {selectedLocation && (
          <div className="mt-12 bg-white rounded-xl p-8 border border-neutral-200 shadow-elevation">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-neutral-900">{selectedLocation.name}</h2>
                <p className="text-neutral-600 mt-2">
                  {selectedLocation.type === 'incident' ? '⚠️ Incident' : selectedLocation.type === 'patrol' ? '🚔 Patrol Unit' : '🛡️ Safe Zone'}
                </p>
              </div>
              {selectedLocation.severity && (
                <Badge variant={
                  selectedLocation.severity === 'critical' ? 'danger' :
                  selectedLocation.severity === 'high' ? 'warning' : 'default'
                }>
                  {selectedLocation.severity.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Coordinates</p>
                <p className="text-lg font-mono">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Last Updated</p>
                <p className="text-lg">{new Date(selectedLocation.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Type</p>
                <p className="text-lg capitalize">{selectedLocation.type}</p>
              </div>
              {selectedLocation.status && (
                <div>
                  <p className="text-sm text-neutral-600 mb-2">Status</p>
                  <p className="text-lg capitalize">{selectedLocation.status}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="primary">Respond</Button>
              <Button variant="outline" onClick={() => setLiveMode(true)}>Track Live</Button>
              <Button variant="ghost" onClick={() => setSelectedLocation(null)}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
