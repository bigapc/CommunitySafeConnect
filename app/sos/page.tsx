'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function SOSPage() {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [silentMode, setSilentMode] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [checkInMinutes, setCheckInMinutes] = useState(10);
  const [checkInRemaining, setCheckInRemaining] = useState<number | null>(null);
  const [checkInExpired, setCheckInExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSOSClick = () => {
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          setIsActivated(true);
          return null;
        }

        return (prev ?? 3) - 1;
      });
    }, 1000);
  };

  const cancelEmergency = () => {
    setIsActivated(false);
    setCountdown(null);
    setCheckInExpired(false);
  };

  const startCheckInTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setCheckInExpired(false);
    setCheckInRemaining(checkInMinutes * 60);

    timerRef.current = setInterval(() => {
      setCheckInRemaining((prev) => {
        if (prev === null) {
          return null;
        }

        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setCheckInExpired(true);
          setIsActivated(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const confirmSafeCheckIn = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCheckInRemaining(null);
    setCheckInExpired(false);
  };

  const formatRemaining = (seconds: number | null) => {
    if (seconds === null) {
      return '--:--';
    }

    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <main className="flex-1 bg-gradient-to-br from-red-50 via-orange-50 to-red-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <Badge variant="danger" className="mb-4 mx-auto text-lg px-6 py-2">
            Emergency Activation System
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-red-900 mt-4 leading-tight">Emergency SOS Alert</h1>
          <p className="text-xl text-neutral-600 mt-6 max-w-2xl mx-auto">
            One-touch escalation to responders, trusted contacts, and command center operations.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card variant="elevated" className="space-y-3">
            <h3 className="text-lg font-bold text-neutral-900">Alert Mode</h3>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-sm font-semibold text-slate-700">Silent mode</span>
              <input type="checkbox" checked={silentMode} onChange={() => setSilentMode(!silentMode)} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
              <span className="text-sm font-semibold text-slate-700">Share live location</span>
              <input type="checkbox" checked={shareLocation} onChange={() => setShareLocation(!shareLocation)} />
            </label>
            <p className="text-xs text-slate-500">
              Mode: {silentMode ? 'Silent dispatch' : 'Audible alert'} | Location: {shareLocation ? 'Enabled' : 'Disabled'}
            </p>
          </Card>

          <Card variant="elevated" className="space-y-3">
            <h3 className="text-lg font-bold text-neutral-900">Guardian Check-In Timer</h3>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={checkInMinutes}
                onChange={(event) => setCheckInMinutes(Number(event.target.value))}
                className="w-full"
              />
              <span className="min-w-12 text-sm font-semibold text-slate-700">{checkInMinutes}m</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={startCheckInTimer}>Start Timer</Button>
              <Button variant="ghost" size="sm" onClick={confirmSafeCheckIn}>Confirm Safe</Button>
            </div>
            <p className="text-sm text-slate-700">Remaining: {formatRemaining(checkInRemaining)}</p>
          </Card>
        </div>

        <div className="flex justify-center mb-10">
          <div className={`relative w-64 h-64 rounded-full transition-all duration-300 ${isActivated ? 'ring-8 ring-red-500 animate-pulse' : 'hover:scale-105'}`}>
            <button
              onClick={handleSOSClick}
              disabled={countdown !== null}
              className={`w-full h-full rounded-full font-bold text-4xl transition-all duration-200 flex items-center justify-center shadow-2xl ${
                isActivated
                  ? 'bg-gradient-to-br from-red-600 to-red-800 text-white scale-100'
                  : countdown !== null
                  ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white scale-95'
                  : 'bg-gradient-to-br from-red-600 to-red-800 text-white hover:shadow-2xl hover:scale-105'
              }`}
            >
              {countdown !== null ? <span className="text-5xl">{countdown}</span> : isActivated ? <span>SENT</span> : <span>SOS</span>}
            </button>
          </div>
        </div>

        {isActivated && (
          <div className="text-center mb-8 p-6 bg-green-100 border-2 border-green-500 rounded-xl">
            <p className="text-lg font-bold text-green-900">Emergency alert sent</p>
            <p className="text-sm text-green-700 mt-2">
              {shareLocation ? 'Live location shared' : 'Location sharing disabled'} | {silentMode ? 'Silent dispatch enabled' : 'Audible mode enabled'}
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={cancelEmergency}>Cancel Alert</Button>
            </div>
          </div>
        )}

        {checkInExpired && (
          <div className="text-center mb-8 p-6 bg-amber-100 border-2 border-amber-500 rounded-xl">
            <p className="text-lg font-bold text-amber-900">Check-in timer expired</p>
            <p className="text-sm text-amber-700 mt-2">Automatic welfare check alert has been escalated to your safety circle.</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card variant="elevated">
            <div className="text-5xl mb-4">Live</div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Realtime Location</h3>
            <p className="text-neutral-600 text-sm">Continuously updates responder and guardian visibility during an active SOS window.</p>
          </Card>

          <Card variant="elevated">
            <div className="text-5xl mb-4">Secure</div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Discreet Operations</h3>
            <p className="text-neutral-600 text-sm">Silent mode helps in sensitive situations while keeping command center operators informed.</p>
          </Card>

          <Card variant="elevated">
            <div className="text-5xl mb-4">Fast</div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Auto Escalation</h3>
            <p className="text-neutral-600 text-sm">Guardian check-in fallback protects users when they cannot manually confirm safety.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
