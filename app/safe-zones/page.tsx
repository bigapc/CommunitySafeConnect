'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function SafeZonesPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zones = [
    {
      id: '1',
      name: 'Downtown Campus Safety Center',
      address: '123 Main Street, Downtown',
      type: 'Campus Center',
      hours: '24/7',
      services: ['First Aid', 'Security', 'Communications'],
      distance: '0.3 mi',
      rating: 4.8,
    },
    {
      id: '2',
      name: 'Central Hospital Emergency',
      address: '456 Health Ave, Medical District',
      type: 'Hospital',
      hours: '24/7',
      services: ['Emergency Room', 'Trauma Center', 'Ambulance'],
      distance: '1.2 mi',
      rating: 4.9,
    },
    {
      id: '3',
      name: 'Police Precinct 5',
      address: '789 Justice Ave, Downtown',
      type: 'Police Station',
      hours: '24/7',
      services: ['Police Response', 'Report Filing', 'Support'],
      distance: '0.8 mi',
      rating: 4.6,
    },
    {
      id: '4',
      name: 'Faith Community Center',
      address: '321 Hope Street, West Side',
      type: 'Community Center',
      hours: '6 AM - 10 PM',
      services: ['Safe Space', 'Counseling', 'Resources'],
      distance: '2.1 mi',
      rating: 4.7,
    },
  ];

  return (
    <main className="flex-1 bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="success" className="mb-4">🛡️ VERIFIED LOCATIONS</Badge>
          <h1 className="text-5xl font-bold text-neutral-900">Safe Zones Network</h1>
          <p className="text-xl text-neutral-600 mt-4">
            Verified safe locations where you can get immediate help and support. All partners are vetted and trusted.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search safe zones..."
            className="flex-1 min-w-48 px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select className="px-4 py-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>All Types</option>
            <option>Campus Centers</option>
            <option>Hospitals</option>
            <option>Police Stations</option>
            <option>Community Centers</option>
          </select>
        </div>

        {/* Zones Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {zones.map((zone) => (
            <Card
              key={zone.id}
              variant={selectedZone === zone.id ? 'outline' : 'elevated'}
              className="cursor-pointer hover:shadow-elevated transition-all"
              onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">{zone.name}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{zone.address}</p>
                </div>
                <Badge variant="success">{zone.type}</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>⏰</span>
                  <span className="text-neutral-700"><strong>Hours:</strong> {zone.hours}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>📍</span>
                  <span className="text-neutral-700"><strong>Distance:</strong> {zone.distance}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>⭐</span>
                  <span className="text-neutral-700"><strong>Rating:</strong> {zone.rating}/5.0</span>
                </div>
              </div>

              {selectedZone === zone.id && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <p className="text-sm font-semibold text-neutral-900 mb-3">Available Services:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {zone.services.map((service) => (
                      <Badge key={service} variant="info" size="md">
                        ✓ {service}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="primary" className="flex-1">Navigate</Button>
                    <Button variant="secondary" className="flex-1">Call</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="elevated">
            <div className="text-4xl mb-4">✓</div>
            <h4 className="font-bold text-neutral-900 mb-2">Verified Partners</h4>
            <p className="text-sm text-neutral-600">All safe zones are thoroughly vetted and verified for legitimate support services</p>
          </Card>

          <Card variant="elevated">
            <div className="text-4xl mb-4">🗺️</div>
            <h4 className="font-bold text-neutral-900 mb-2">Always Available</h4>
            <p className="text-sm text-neutral-600">Network of 100+ safe locations across the region open 24/7 or extended hours</p>
          </Card>

          <Card variant="elevated">
            <div className="text-4xl mb-4">📞</div>
            <h4 className="font-bold text-neutral-900 mb-2">Direct Support</h4>
            <p className="text-sm text-neutral-600">One-tap calling and navigation to the nearest safe zone in your moment of need</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
