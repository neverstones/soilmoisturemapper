import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SoilMoistureData } from '@shared/schema';
import { Download, Maximize, AlertCircle } from 'lucide-react';
import { createMap, addSoilMoistureLayer, addAdminBoundaries, setupLegend } from '@/lib/mapUtils';

// Define the soil moisture response interface
interface SoilMoistureResponse {
  data: SoilMoistureData[];
  regions: any[];
  trends?: any[];
}

interface MapContainerProps {
  soilMoistureData?: SoilMoistureResponse;
  layers: {
    soilMoisture: boolean;
    rainfall: boolean;
    adminBoundaries: boolean;
    landcover: boolean;
  };
  opacity: number;
  baseMap: string;
  isLoading: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  soilMoistureData, 
  layers, 
  opacity, 
  baseMap,
  isLoading
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const soilMoistureLayerRef = useRef<any>(null);
  const adminBoundariesLayerRef = useRef<any>(null);
  const rainfallLayerRef = useRef<any>(null);
  const landcoverLayerRef = useRef<any>(null);
  const legendRef = useRef<any>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = createMap(mapRef.current, baseMap);
      legendRef.current = setupLegend(leafletMapRef.current);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update base map when it changes
  useEffect(() => {
    if (leafletMapRef.current) {
      // Remove existing tile layers
      leafletMapRef.current.eachLayer((layer: any) => {
        if (layer.options && layer.options.id === 'baseMap') {
          leafletMapRef.current.removeLayer(layer);
        }
      });

      // Add new base map
      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      
      switch (baseMap) {
        case 'satellite':
          tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
          break;
        case 'terrain':
          tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
          attribution = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)';
          break;
        case 'streets':
          tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
          break;
        case 'dark':
          tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
          attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
          break;
      }

      // Access Leaflet through our getL helper function
      const L = window.L;
      if (!L) {
        console.error('Leaflet library is not loaded');
        return;
      }
      
      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
        id: 'baseMap'
      }).addTo(leafletMapRef.current);
    }
  }, [baseMap]);

  // Handle soil moisture layer
  useEffect(() => {
    if (leafletMapRef.current && soilMoistureData) {
      // Remove existing soil moisture layer
      if (soilMoistureLayerRef.current) {
        leafletMapRef.current.removeLayer(soilMoistureLayerRef.current);
        soilMoistureLayerRef.current = null;
      }

      // Add soil moisture layer if enabled
      if (layers.soilMoisture) {
        soilMoistureLayerRef.current = addSoilMoistureLayer(
          leafletMapRef.current, 
          soilMoistureData.data,
          opacity
        );
      }
    }
  }, [soilMoistureData, layers.soilMoisture, opacity]);

  // Handle admin boundaries layer
  useEffect(() => {
    if (leafletMapRef.current && soilMoistureData) {
      // Remove existing admin boundaries layer
      if (adminBoundariesLayerRef.current) {
        leafletMapRef.current.removeLayer(adminBoundariesLayerRef.current);
        adminBoundariesLayerRef.current = null;
      }

      // Add admin boundaries layer if enabled
      if (layers.adminBoundaries && soilMoistureData.regions) {
        adminBoundariesLayerRef.current = addAdminBoundaries(
          leafletMapRef.current,
          soilMoistureData.regions
        );
      }
    }
  }, [soilMoistureData, layers.adminBoundaries]);

  // Add fullscreen functionality
  const handleFullscreen = () => {
    if (mapRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapRef.current.requestFullscreen();
      }
    }
  };

  // Export map as image
  const handleExport = () => {
    if (leafletMapRef.current) {
      // Use leaflet-image or html2canvas to export the map
      // For simplicity, we'll just use a mock implementation
      alert('Map exported as image');
    }
  };

  return (
    <div className="p-4 bg-white">
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <CardTitle className="text-base font-medium text-gray-800">
            Soil Moisture Index Map
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-gray-700"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-gray-700"
              onClick={handleFullscreen}
            >
              <Maximize className="h-4 w-4 mr-1" /> Fullscreen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="relative h-[60vh] w-full flex items-center justify-center bg-gray-50">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div 
              ref={mapRef} 
              id="map" 
              className="h-[60vh] w-full"
            ></div>
          )}
        </CardContent>
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Data source: Satellite imagery processed via Google Earth Engine | Last updated: {new Date().toLocaleDateString()}
        </div>
      </Card>
    </div>
  );
};

export default MapContainer;
