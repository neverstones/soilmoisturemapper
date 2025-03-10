import ee from '@google/earthengine';

type TimeStep = 'daily' | 'weekly' | 'monthly';

// Initialize Earth Engine with provided credentials
const getPrivateKey = () => {
  const key = process.env.GOOGLE_EARTH_ENGINE_PRIVATE_KEY;
  if (!key) {
    throw new Error('Google Earth Engine private key not found');
  }
  
  try {
    console.log('Processing private key...');
    
    // Use a simplified approach without PEM manipulation
    // This passes the key as-is to the API, maintaining its original format
    // For environment variables, the key might be stored with escaped newlines
    
    // First try with a simple newline replacement
    let privateKey = key;
    
    // Remove quotes if they exist
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Log some debug info without exposing the key
    console.log(`Key length after processing: ${privateKey.length}`);
    console.log(`Key contains PEM headers: ${privateKey.includes('BEGIN PRIVATE KEY')}`);
    
    return privateKey;
  } catch (error) {
    console.error('Error processing private key:', error);
    // Don't expose detailed error info that might contain sensitive data
    throw new Error('Failed to process private key correctly');
  }
};

const initialize = async () => {
  let privateKey: string;
  let clientEmail: string;
  
  try {
    privateKey = getPrivateKey();
    const envClientEmail = process.env.GOOGLE_EARTH_ENGINE_CLIENT_EMAIL;
    
    if (!envClientEmail) {
      throw new Error('Google Earth Engine client email not found');
    }

    clientEmail = envClientEmail;
    console.log('Initializing Earth Engine with client email:', clientEmail);
    
    await new Promise<void>((resolve, reject) => {
      try {
        console.log('Calling authenticateViaPrivateKey...');
        ee.data.authenticateViaPrivateKey(
          {
            private_key: privateKey,
            client_email: clientEmail as string
          },
          () => {
            console.log('Authentication successful, initializing Earth Engine');
            ee.initialize(null, null,
              () => {
                console.log('Earth Engine initialized successfully');
                resolve();
              },
              (err: Error) => {
                console.error('Earth Engine initialization error:', err);
                reject(err);
              }
            );
          },
          (err) => {
            const error = err as Error;
            console.error('Authentication error:', error);
            console.error('Error code:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            reject(error);
          }
        );
      } catch (initError) {
        console.error('Caught exception during Earth Engine authentication:', initError);
        reject(initError);
      }
    });

    return true;
  } catch (error) {
    console.error('Error initializing Earth Engine');
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    } else {
      console.error('Unknown error type:', error);
    }
    
    throw error;
  }
}

// Define region coordinates
const regionCoordinates = {
  "North Region": [-98, 40, -90, 45],
  "Central Plains": [-110, 35, -100, 42],
  "Eastern Basin": [-85, 38, -80, 42],
  "Southern Valley": [-95, 30, -85, 35],
  "Western Hills": [-120, 38, -115, 45]
};

// Function to create Earth Engine regions after initialization
const createRegions = () => {
  return Object.entries(regionCoordinates).reduce((acc, [name, coords]) => {
    acc[name] = ee.Geometry.Rectangle(coords);
    return acc;
  }, {} as { [key: string]: any });
};

// Calculate NDMI (Normalized Difference Moisture Index) from Landsat 8
const calculateNDMI = (image: any) => {
  const nir = image.select('SR_B5');  // NIR band
  const swir = image.select('SR_B6'); // SWIR band
  return nir.subtract(swir).divide(nir.add(swir)).rename('NDMI');
};

// Get soil moisture status based on NDMI value
const getSoilMoistureStatus = (ndmi: number): string => {
  if (ndmi > 0.2) return "Above Normal";
  if (ndmi > 0.1) return "Normal";
  if (ndmi > 0) return "Moderate Drought";
  return "Severe Drought";
};

export async function calculateSoilMoistureIndex(
  startDate: string,
  endDate: string,
  timeStep: TimeStep,
  region?: string
) {
  try {
    console.log(`Calculating soil moisture index from ${startDate} to ${endDate} with ${timeStep} time steps for region: ${region || 'all'}`);

    // Initialize Earth Engine
    await initialize();

    // Create Earth Engine regions
    const regions = createRegions();
    
    // Filter regions if needed
    const selectedRegions = region && region !== 'entire'
      ? { [region]: regions[region] }
      : regions;

    // Get Landsat 8 collection
    const landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterDate(startDate, endDate)
      .select(['SR_B5', 'SR_B6']); // NIR and SWIR bands

    // Calculate NDMI for each image
    const ndmiCollection = landsat.map(calculateNDMI);

    // Calculate average NDMI for each region
    const soilMoistureData = await Promise.all(
      Object.entries(selectedRegions).map(async ([regionName, geometry]) => {
        // Calculate current NDMI
        const currentNdmi = await new Promise((resolve, reject) => {
          const reducer = ee.Reducer.mean();
          const ndmiMean = ndmiCollection
            .mean()
            .reduceRegion({
              reducer: reducer,
              geometry: geometry,
              scale: 30, // Landsat resolution
              maxPixels: 1e9
            });
          
          ndmiMean.evaluate((result: any, error: any) => {
            if (error) reject(error);
            else resolve(result.NDMI || 0);
          });
        });

        // Calculate historical average
        const historicalStartDate = new Date(startDate);
        historicalStartDate.setFullYear(historicalStartDate.getFullYear() - 5);
        
        const historicalNdmi = await new Promise((resolve, reject) => {
          const historicalCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
            .filterDate(historicalStartDate.toISOString(), endDate)
            .select(['SR_B5', 'SR_B6'])
            .map(calculateNDMI)
            .mean()
            .reduceRegion({
              reducer: ee.Reducer.mean(),
              geometry: geometry,
              scale: 30,
              maxPixels: 1e9
            });

          historicalCollection.evaluate((result: any, error: any) => {
            if (error) reject(error);
            else resolve(result.NDMI || 0);
          });
        });

        const value = currentNdmi as number;
        const average = historicalNdmi as number;

        return {
          region: regionName,
          value,
          average,
          status: getSoilMoistureStatus(value - average),
          date: new Date().toISOString(),
          geometry: {
            type: "Polygon",
            coordinates: [geometry.coordinates().getInfo()]
          }
        };
      })
    );

    // Calculate temporal trends
    const trends = await calculateTemporalTrends(ndmiCollection, selectedRegions, timeStep);

    return {
      data: soilMoistureData,
      regions: getRegionBoundaries(selectedRegions),
      trends
    };

  } catch (error) {
    console.error("Error calculating soil moisture index:", error);
    if (error instanceof Error) {
      // Add more context to the error
      throw new Error(`Failed to calculate soil moisture index: ${error.message}`);
    } else {
      throw new Error("Failed to calculate soil moisture index: Unknown error");
    }
  }
}

async function calculateTemporalTrends(
  ndmiCollection: any,
  regions: { [key: string]: any },
  timeStep: TimeStep
) {
  const timeFilter = getTimeFilter(timeStep);
  const distinctDates = await ndmiCollection
    .map((image: any) => ee.Feature(null, { date: image.date().format('YYYY-MM-dd') }))
    .distinct('date')
    .aggregate_array('date')
    .getInfo();

  const trends = [];
  for (const date of distinctDates) {
    const dateImage = ndmiCollection
      .filterDate(date, ee.Date(date).advance(timeFilter.advance, timeFilter.unit))
      .mean();

    const regionValues: { [key: string]: number } = {};
    for (const [regionName, geometry] of Object.entries(regions)) {
      const meanNdmi = await new Promise((resolve, reject) => {
        dateImage
          .reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: geometry,
            scale: 30,
            maxPixels: 1e9
          })
          .evaluate((result: any, error: any) => {
            if (error) reject(error);
            else resolve(result.NDMI || 0);
          });
      });
      regionValues[regionName] = meanNdmi as number;
    }

    trends.push({
      name: new Date(date).toLocaleDateString('en-US', { month: 'short' }),
      date,
      ...regionValues
    });
  }

  return trends;
}

function getTimeFilter(timeStep: TimeStep) {
  switch (timeStep) {
    case 'daily':
      return { advance: 1, unit: 'day' };
    case 'weekly':
      return { advance: 1, unit: 'week' };
    case 'monthly':
      return { advance: 1, unit: 'month' };
    default:
      return { advance: 1, unit: 'week' };
  }
}

function getRegionBoundaries(selectedRegions: { [key: string]: any }) {
  return Object.entries(selectedRegions).map(([name, geometry]) => ({
    type: "Feature",
    properties: { name },
    geometry: {
      type: "Polygon",
      coordinates: [geometry.coordinates().getInfo()]
    }
  }));
}