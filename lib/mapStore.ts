import { create } from 'zustand';

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'safe-zone' | 'incident' | 'user' | 'patrol';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  status?: 'active' | 'resolved' | 'in-progress';
}

export interface MapState {
  locations: MapLocation[];
  selectedLocation: MapLocation | null;
  isLiveMode: boolean;
  zoom: number;
  center: [number, number];
  
  // Actions
  addLocation: (location: MapLocation) => void;
  updateLocation: (id: string, updates: Partial<MapLocation>) => void;
  removeLocation: (id: string) => void;
  setSelectedLocation: (location: MapLocation | null) => void;
  setLiveMode: (enabled: boolean) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  getCriticalIncidents: () => MapLocation[];
}

export const useMapStore = create<MapState>((set, get) => ({
  locations: [],
  selectedLocation: null,
  isLiveMode: true,
  zoom: 15,
  center: [40.7128, -74.0060], // Default: NYC
  
  addLocation: (location) => set((state) => ({
    locations: [...state.locations, location]
  })),
  
  updateLocation: (id, updates) => set((state) => ({
    locations: state.locations.map((loc) =>
      loc.id === id ? { ...loc, ...updates } : loc
    )
  })),
  
  removeLocation: (id) => set((state) => ({
    locations: state.locations.filter((loc) => loc.id !== id)
  })),
  
  setSelectedLocation: (location) => set({ selectedLocation: location }),
  
  setLiveMode: (enabled) => set({ isLiveMode: enabled }),
  
  setCenter: (center) => set({ center }),
  
  setZoom: (zoom) => set({ zoom }),
  
  getCriticalIncidents: () => {
    const state = get();
    return state.locations.filter((loc) => 
      loc.severity === 'critical' && loc.type === 'incident'
    );
  },
}));
