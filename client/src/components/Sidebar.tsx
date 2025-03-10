import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2, Layers, Calendar, Info, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  dateRange: {
    startDate: string;
    endDate: string;
    timeStep: 'daily' | 'weekly' | 'monthly';
  };
  setDateRange: React.Dispatch<React.SetStateAction<{
    startDate: string;
    endDate: string;
    timeStep: 'daily' | 'weekly' | 'monthly';
  }>>;
  layers: {
    soilMoisture: boolean;
    rainfall: boolean;
    adminBoundaries: boolean;
    landcover: boolean;
  };
  opacity: number;
  baseMap: string;
  selectedRegion: string;
  analysisType: string;
  onLayerChange: (layer: string, checked: boolean) => void;
  onOpacityChange: (value: number) => void;
  onBaseMapChange: (value: string) => void;
  onDateRangeApply: () => void;
  onRunAnalysis: () => void;
  setSelectedRegion: React.Dispatch<React.SetStateAction<string>>;
  setAnalysisType: React.Dispatch<React.SetStateAction<string>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  dateRange,
  setDateRange,
  layers,
  opacity,
  baseMap,
  selectedRegion,
  analysisType,
  onLayerChange,
  onOpacityChange,
  onBaseMapChange,
  onDateRangeApply,
  onRunAnalysis,
  setSelectedRegion,
  setAnalysisType
}) => {
  const [expandedSections, setExpandedSections] = useState({
    date: true,
    layer: true,
    analysis: true,
    about: false
  });
  
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(!isMobile);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="bg-white shadow-lg w-full md:w-72 flex-shrink-0 border-r border-gray-200 z-10 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="text-blue-600 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6m0 0c3.5 0 5 4 8 4a7.08 7.08 0 0 0 4-1.14M12 8c-3.5 0-5 4-8 4a7.09 7.09 0 0 1-4-1.14"></path>
              <path d="M12 19c-3.5 0-5-4-8-4a7.09 7.09 0 0 0-4 1.14"></path>
              <path d="M12 19c3.5 0 5-4 8-4a7.08 7.08 0 0 1 4 1.14M12 19v3"></path>
            </svg>
          </span>
          Soil Moisture WebGIS
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <div className={`p-4 ${isMobile && !mobileMenuOpen ? 'hidden' : ''}`}>
        {/* Date Range Section */}
        <div className="mb-6">
          <div 
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection('date')}
          >
            <h2 className="text-sm font-semibold text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              TIME FRAME
            </h2>
            {expandedSections.date ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
          
          {expandedSections.date && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600">Start Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">End Date</Label>
                <Input 
                  type="date" 
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Time Step</Label>
                <Select 
                  value={dateRange.timeStep} 
                  onValueChange={(value: any) => setDateRange(prev => ({ ...prev, timeStep: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time step" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={onDateRangeApply}
              >
                Apply Date Range
              </Button>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Layer Control Section */}
        <div className="py-4">
          <div 
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection('layer')}
          >
            <h2 className="text-sm font-semibold text-gray-700 flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              LAYERS
            </h2>
            {expandedSections.layer ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
          
          {expandedSections.layer && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label 
                    htmlFor="soil_moisture" 
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    Soil Moisture Index
                  </Label>
                  <Switch 
                    id="soil_moisture" 
                    checked={layers.soilMoisture}
                    onCheckedChange={(checked) => onLayerChange('soilMoisture', checked)}
                  />
                </div>
                
                {layers.soilMoisture && (
                  <div className="pl-6 space-y-1">
                    <Label className="text-xs text-gray-500">Opacity: {opacity}%</Label>
                    <Slider 
                      min={0} 
                      max={100} 
                      step={1}
                      value={[opacity]}
                      onValueChange={(value) => onOpacityChange(value[0])}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="rainfall" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Rainfall
                </Label>
                <Switch 
                  id="rainfall" 
                  checked={layers.rainfall}
                  onCheckedChange={(checked) => onLayerChange('rainfall', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="admin_boundaries" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Administrative Boundaries
                </Label>
                <Switch 
                  id="admin_boundaries" 
                  checked={layers.adminBoundaries}
                  onCheckedChange={(checked) => onLayerChange('adminBoundaries', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="landcover" 
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Land Cover
                </Label>
                <Switch 
                  id="landcover" 
                  checked={layers.landcover}
                  onCheckedChange={(checked) => onLayerChange('landcover', checked)}
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Base Map</Label>
                <Select 
                  value={baseMap} 
                  onValueChange={onBaseMapChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select base map" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="terrain">Terrain</SelectItem>
                    <SelectItem value="streets">Streets</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Analysis Section */}
        <div className="py-4">
          <div 
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection('analysis')}
          >
            <h2 className="text-sm font-semibold text-gray-700 flex items-center">
              <BarChart2 className="h-4 w-4 mr-1" />
              ANALYSIS
            </h2>
            {expandedSections.analysis ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
          
          {expandedSections.analysis && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-600">Region of Interest</Label>
                <Select 
                  value={selectedRegion} 
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entire">Entire Map</SelectItem>
                    <SelectItem value="custom">Custom Area</SelectItem>
                    <SelectItem value="region1">North Region</SelectItem>
                    <SelectItem value="region2">Central Plains</SelectItem>
                    <SelectItem value="region3">Eastern Basin</SelectItem>
                    <SelectItem value="region4">Southern Valley</SelectItem>
                    <SelectItem value="region5">Western Hills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Analysis Type</Label>
                <Select 
                  value={analysisType} 
                  onValueChange={setAnalysisType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="average">Average Moisture</SelectItem>
                    <SelectItem value="change">Change Detection</SelectItem>
                    <SelectItem value="anomaly">Anomaly Detection</SelectItem>
                    <SelectItem value="trend">Trend Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-teal-700 hover:bg-teal-800 text-white" 
                onClick={onRunAnalysis}
              >
                Run Analysis
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                Export Results
              </Button>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* About Section */}
        <div className="pt-4">
          <div 
            className="flex justify-between items-center cursor-pointer mb-2"
            onClick={() => toggleSection('about')}
          >
            <h2 className="text-sm font-semibold text-gray-700 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              ABOUT
            </h2>
            {expandedSections.about ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
          </div>
          
          {expandedSections.about && (
            <div className="space-y-2 text-sm text-gray-600">
              <p>This WebGIS application displays soil moisture data processed using Google Earth Engine with a Node.js backend.</p>
              <p>The soil moisture index is derived from satellite data and provides insights into agricultural and hydrological conditions.</p>
              <div className="text-xs text-gray-500 mt-2">Version 1.0</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
