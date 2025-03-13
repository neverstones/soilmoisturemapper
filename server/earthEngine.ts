import ee from '@google/earthengine';
import dotenv from 'dotenv';

dotenv.config();

const getPrivateKey = () => {
  const key = process.env.GOOGLE_EE_PRIVATE_KEY;
  if (!key) {
    throw new Error('Google Earth Engine private key not found');
  }
  return key.replace(/\n/g, '\n');
};

const initialize = async () => {
  try {
    const privateKey = getPrivateKey();
    const clientEmail = process.env.GOOGLE_EE_CLIENT_EMAIL;
    
    if (!clientEmail) {
      throw new Error('Google Earth Engine client email not found');
    }

    console.log('Initializing Earth Engine with client email:', clientEmail);

    await new Promise((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        { private_key: privateKey, client_email: clientEmail },
        () => {
          ee.initialize(null, null, resolve, reject);
        },
        reject
      );
    });
  } catch (error) {
    console.error('Error initializing Earth Engine:', error);
    throw error;
  }
};

const calculateNDVI = (image) => {
  return image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
};

const calculateLST = (image) => {
  const thermalBand = image.select('ST_B10'); 
  const brightnessTemp = thermalBand.multiply(0.00341802).add(149.0);

  const proportionVeg = image.select('NDVI')
      .subtract(0.2).divide(0.5 - 0.2).pow(2).rename('Pv');

  const emissivity = proportionVeg.multiply(0.004).add(0.986).rename('Emissivity');

  const lst = brightnessTemp.expression(
      '(Tb / (1 + (0.00115 * Tb / 14388) * log(e))) - 273.15', {
          'Tb': brightnessTemp,
          'e': emissivity
      }).rename('LST');

  return image.addBands(lst);
};

const calculateLSTMinMax = (image) => {
  const ndvi = image.select('NDVI');

  const lst_max = ndvi.multiply(5).add(40).rename('LSTmax');
  const lst_min = ndvi.multiply(3).add(20).rename('LSTmin');

  return image.addBands(lst_max).addBands(lst_min);
};

const calculateSMI = (image) => {
  const lst = image.select('LST');
  const lst_max = image.select('LSTmax');
  const lst_min = image.select('LSTmin');

  const smi = lst_max.subtract(lst).divide(lst_max.subtract(lst_min)).rename('SMI');
  return image.addBands(smi).copyProperties(image, ['system:time_start']);
};

export async function calculateSoilMoistureIndex(startDate, endDate, region) {
  await initialize();
  
  const landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .filterDate(startDate, endDate)
      .map(calculateNDVI)
      .map(calculateLST)
      .map(calculateLSTMinMax)
      .map(calculateSMI);

  const landsat9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
      .filterDate(startDate, endDate)
      .map(calculateNDVI)
      .map(calculateLST)
      .map(calculateLSTMinMax)
      .map(calculateSMI);

  const mergedCollection = landsat8.merge(landsat9);
  const meanSMI = mergedCollection.mean();

  const smiValue = await new Promise((resolve, reject) => {
    meanSMI.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: region,
      scale: 30,
      maxPixels: 1e13
    }).evaluate((result, error) => error ? reject(error) : resolve(result?.SMI || 0));
  });

  return { value: smiValue, status: `Soil Moisture Index: ${smiValue}` };
}
