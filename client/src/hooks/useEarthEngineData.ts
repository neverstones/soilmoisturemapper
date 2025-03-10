import { useQuery } from '@tanstack/react-query';
import { SoilMoistureQuery, SoilMoistureData } from '@shared/schema';

// Define interface for the API response
interface SoilMoistureResponse {
  data: SoilMoistureData[];
  regions: any[];
  trends?: any[];
}

const useEarthEngineData = (query: SoilMoistureQuery) => {
  // Construct query URL with parameters
  const queryUrl = `/api/soil-moisture?startDate=${query.startDate}&endDate=${query.endDate}&timeStep=${query.timeStep}${query.region ? `&region=${query.region}` : ''}`;
  
  return useQuery<SoilMoistureResponse>({
    queryKey: [queryUrl],
    // Only run the query if we have the required parameters
    enabled: !!query.startDate && !!query.endDate && !!query.timeStep,
  });
};

export default useEarthEngineData;
