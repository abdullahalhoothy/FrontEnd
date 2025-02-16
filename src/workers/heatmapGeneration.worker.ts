import pMap from 'p-map';
import _ from 'lodash';

interface HeatmapProperties {
  density: number;
  [key: string]: any;
}

self.onmessage = async event => {
  const { featureCollection, basedon } = event.data;
  const concurrency = navigator.hardwareConcurrency || 4;

  try {
    console.time('Processing Features');
    const processedFeatures = await pMap(
      featureCollection.features,
      async (feature: any) => {
        let density = 1;

        if (basedon && feature.properties[basedon]) {
          const value = feature.properties[basedon];
          const originalValue = value;
          density =
            typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : 1;

          if (isNaN(density)) {
            console.warn('Invalid density value:', {
              original: originalValue,
              basedon,
              featureId: feature.id || 'unknown',
            });
            density = 1;
          }
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            density: density,
          } as HeatmapProperties,
        };
      },
      { concurrency }
    );
    console.timeEnd('Processing Features');

    // Find min/max for normalization
    const densityValues = processedFeatures.map(f => f.properties.density);
    const minDensity = Math.min(...densityValues);
    const maxDensity = Math.max(...densityValues);
    const densityRange = maxDensity - minDensity;

    // Normalize densities to a range
    const normalizedFeatures = processedFeatures.map(feature => ({
      ...feature,
      properties: {
        ...feature.properties,
        density:
          densityRange === 0 ? 1 : ((feature.properties.density - minDensity) / densityRange) * 5,
      },
    }));

    (self as any).postMessage({
      features: normalizedFeatures,
      stats: {
        originalRange: { min: minDensity, max: maxDensity },
        normalizedRange: { min: 0, max: 5 },
        featureCount: normalizedFeatures.length,
        processingStats: {
          uniqueValues: new Set(densityValues).size,
          average: densityValues.reduce((a, b) => a + b, 0) / densityValues.length,
        },
      },
    });
  } catch (error) {
    console.error('Error in heatmap worker:', error);
    console.error('Stack:', error.stack);
    console.error('Context:', {
      featureCount: featureCollection?.features?.length,
      basedon,
      concurrency,
    });
    (self as any).postMessage({ error: error.message });
  }
};
