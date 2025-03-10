declare module '@google/earthengine' {
  namespace data {
    function authenticateViaPrivateKey(
      options: { private_key: string; client_email: string },
      success: () => void,
      error: (err: Error) => void
    ): void;
  }

  function initialize(
    opt_baseurl: string | null,
    opt_tileurl: string | null,
    success: () => void,
    error: (err: Error) => void
  ): void;

  const Geometry: {
    Rectangle(coords: number[]): any;
  };

  const ImageCollection: {
    (name: string): {
      filterDate(startDate: string, endDate: string): any;
      select(bands: string[]): any;
      map(callback: (image: any) => any): any;
      mean(): any;
    };
  };

  const Image: {
    (data: any): {
      select(band: string): any;
      subtract(other: any): any;
      divide(other: any): any;
      rename(name: string): any;
      reduceRegion(params: {
        reducer: any;
        geometry: any;
        scale: number;
        maxPixels: number;
      }): any;
    };
  };

  const Feature: {
    (geometry: null, properties: { [key: string]: any }): any;
  };

  const Date: {
    (date: string): {
      advance(value: number, unit: string): any;
    };
  };

  const Reducer: {
    mean(): any;
  };

  export default {
    data,
    initialize,
    Geometry,
    ImageCollection,
    Image,
    Feature,
    Date,
    Reducer
  };
}