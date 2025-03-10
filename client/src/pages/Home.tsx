import React from 'react';
import Sidebar from '@/components/Sidebar';
import MapContainer from '@/components/MapContainer';
import DataVisualization from '@/components/DataVisualization';
import { SoilMoistureQuery } from '@shared/schema';
import useEarthEngineData from '@/hooks/useEarthEngineData';
import { useToast } from '@/hooks/use-toast';

const Home: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<{
    startDate: string;
    endDate: string;
    timeStep: 'daily' | 'weekly' | 'monthly';
  }>({
    startDate: '2023-01-01',
    endDate: '2023-11-30',
    timeStep: 'weekly'
  });

  const [selectedRegion, setSelectedRegion] = React.useState<string>('entire');
  const [analysisType, setAnalysisType] = React.useState<string>('average');
  const [layers, setLayers] = React.useState({
    soilMoisture: true,
    rainfall: false,
    adminBoundaries: true,
    landcover: false
  });
  const [opacity, setOpacity] = React.useState<number>(80);
  const [baseMap, setBaseMap] = React.useState<string>('terrain');

  const query: SoilMoistureQuery = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    timeStep: dateRange.timeStep,
    region: selectedRegion !== 'entire' ? selectedRegion : undefined
  };

  const { 
    data: soilMoistureData, 
    isLoading, 
    isError,
    refetch 
  } = useEarthEngineData(query);

  // Initial data fetch when component mounts
  React.useEffect(() => {
    refetch();
  }, []);

  const handleDateRangeApply = () => {
    refetch();
    toast({
      title: "Date range applied",
      description: `Data from ${dateRange.startDate} to ${dateRange.endDate} with ${dateRange.timeStep} time steps`,
    });
  };

  const handleRunAnalysis = () => {
    refetch();
    toast({
      title: "Analysis started",
      description: `Running ${analysisType} analysis for ${selectedRegion === 'entire' ? 'the entire map' : selectedRegion}`,
    });
  };

  const handleLayerChange = (layer: string, checked: boolean) => {
    setLayers(prev => ({
      ...prev,
      [layer]: checked
    }));
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
  };

  const handleBaseMapChange = (value: string) => {
    setBaseMap(value);
  };

  return (
    <div className="bg-gray-100 font-sans flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar 
        dateRange={dateRange}
        setDateRange={setDateRange}
        layers={layers}
        opacity={opacity}
        baseMap={baseMap}
        selectedRegion={selectedRegion}
        analysisType={analysisType}
        onLayerChange={handleLayerChange}
        onOpacityChange={handleOpacityChange}
        onBaseMapChange={handleBaseMapChange}
        onDateRangeApply={handleDateRangeApply}
        onRunAnalysis={handleRunAnalysis}
        setSelectedRegion={setSelectedRegion}
        setAnalysisType={setAnalysisType}
      />
      <div className="flex-grow overflow-y-auto">
        <MapContainer 
          soilMoistureData={soilMoistureData}
          layers={layers}
          opacity={opacity / 100}
          baseMap={baseMap}
          isLoading={isLoading}
        />
        <DataVisualization 
          soilMoistureData={soilMoistureData}
          isLoading={isLoading}
          isError={isError}
          timeStep={dateRange.timeStep}
        />
      </div>
    </div>
  );
};

export default Home;
