// mapUtils.ts
import { SoilMoistureData } from '@shared/schema';

// Define window global to access Leaflet
declare global {
  interface Window {
    L: any;
  }
}

// Access Leaflet through window global
const getL = () => {
  if (typeof window !== 'undefined' && window.L) {
    return window.L;
  }
  console.error('Leaflet library is not loaded');
  return null;
};

// Create and initialize the map
export const createMap = (container: HTMLElement, baseMapType: string) => {
  // Get Leaflet instance
  const L = getL();
  if (!L) return null;
  
  // Initialize map
  const map = L.map(container).setView([40, -95], 4);
  
  // Add base map
  let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  switch (baseMapType) {
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
  
  L.tileLayer(tileUrl, {
    attribution,
    maxZoom: 19,
    id: 'baseMap'
  }).addTo(map);
  
  return map;
};

// Add soil moisture layer to the map
export const addSoilMoistureLayer = (map: any, data: SoilMoistureData[], opacity: number) => {
  // Get Leaflet instance
  const L = getL();
  if (!L) return null;
  
  // Create a color scale function
  const getColor = (value: number) => {
    if (value > 0.55) return '#2b83ff'; // Very Wet - Blue
    if (value > 0.45) return '#3bb543'; // Wet - Green
    if (value > 0.35) return '#edd832'; // Normal - Yellow
    if (value > 0.25) return '#ff5733'; // Dry - Orange
    return '#ff0000'; // Very Dry - Red
  };
  
  // Create a GeoJSON layer for soil moisture
  const soilMoistureLayer = L.geoJSON([], {
    style: (feature: any) => {
      return {
        fillColor: getColor(feature.properties.value),
        weight: 1,
        opacity: 0.7,
        color: 'white',
        fillOpacity: opacity
      };
    },
    onEachFeature: (feature: any, layer: any) => {
      const { region, value, status } = feature.properties;
      layer.bindPopup(`
        <div class="p-2">
          <div class="font-bold">${region}</div>
          <div>Soil Moisture Index: ${value.toFixed(2)}</div>
          <div>Status: ${status}</div>
        </div>
      `);
    }
  }).addTo(map);
  
  if (data && data.length > 0) {
    // Create a GeoJSON collection to hold our features
    const features = data.map(item => {
      // For each soil moisture data point, create a GeoJSON feature
      return {
        type: "Feature",
        properties: { 
          region: item.region, 
          value: item.value, 
          status: item.status 
        },
        // Use the geojson field directly if it's available in the data
        geometry: typeof item.geojson === 'object' ? item.geojson : {
          // Fallback polygon if geojson isn't available
          type: "Polygon",
          coordinates: [
            [
              [-95, 35], 
              [-90, 35], 
              [-90, 40], 
              [-95, 40], 
              [-95, 35]
            ]
          ]
        }
      };
    });

    soilMoistureLayer.addData({
      type: "FeatureCollection",
      features: features
    });
  }
  
  return soilMoistureLayer;
};

// Add administrative boundaries
export const addAdminBoundaries = (map: any, regions: any[]) => {
  // Get Leaflet instance
  const L = getL();
  if (!L) return null;
  
  // Define style for admin boundaries
  const adminStyle = {
    color: "#666",
    weight: 1,
    opacity: 0.5,
    fillOpacity: 0.05
  };
  
  // Add admin boundaries layer
  const adminLayer = L.geoJSON([], {
    style: adminStyle,
    onEachFeature: (feature: any, layer: any) => {
      if (feature.properties && feature.properties.name) {
        layer.bindTooltip(feature.properties.name, {
          permanent: false,
          direction: 'center'
        });
      }
    }
  }).addTo(map);
  
  // If regions data is available, use it
  if (regions && regions.length > 0) {
    adminLayer.addData({
      type: "FeatureCollection",
      features: regions
    });
  }
  
  return adminLayer;
};

// Add a legend to the map
export const setupLegend = (map: any) => {
  // Get Leaflet instance
  const L = getL();
  if (!L) return null;
  
  const legend = L.control({position: 'bottomright'});
  
  legend.onAdd = function(map: any) {
    const div = L.DomUtil.create('div', 'legend bg-white p-2 rounded-md shadow-md');
    const grades = [0.55, 0.45, 0.35, 0.25, 0.15];
    const labels = ['Very Wet', 'Wet', 'Normal', 'Dry', 'Very Dry'];
    const colors = ['#2b83ff', '#3bb543', '#edd832', '#ff5733', '#ff0000'];
    
    div.innerHTML = '<div class="text-xs font-medium mb-1">Soil Moisture Index</div>';
    
    for (let i = 0; i < grades.length; i++) {
      div.innerHTML +=
        '<div class="flex items-center mb-1">' +
        `<div style="background:${colors[i]}; width:18px; height:18px; margin-right:8px; opacity:0.7"></div>` +
        `<span class="text-xs">${labels[i]} (${grades[i]}+)</span>` +
        '</div>';
    }
    
    return div;
  };
  
  legend.addTo(map);
  return legend;
};
