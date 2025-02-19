import { useEffect, useState } from 'react';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLayerContext } from '../../context/LayerContext';
import { useMapContext } from '../../context/MapContext';
import { defaultMapConfig } from '../../hooks/map/useMapInitialization';
import { isIntelligentLayer } from '../../utils/layerUtils';

const jeddahCenter = {
  centerLng: 39.338754846938805,
  centerLat: 21.48137806122448,
};
const meccaCenter = {
  centerLng: 39.808084925,
  centerLat: 21.374926824999996,
};
const riyadhCenter = {
  centerLng: 46.715234200000005,
  centerLat: 24.680283985000003,
};

export function useMapBounds() {
  const { mapRef, shouldInitializeFeatures } = useMapContext();
  const { geoPoints } = useCatalogContext();
  const { selectedCity } = useLayerContext();

  const [fallbackCenter, setFallbackCenter] = useState(jeddahCenter);

  useEffect(() => {
    const city = selectedCity.trim().toLowerCase();

    if (city === 'mecca') setFallbackCenter(meccaCenter);
    else if (city === 'riyadh') setFallbackCenter(riyadhCenter);
  }, [selectedCity]);

  useEffect(() => {
    if (!shouldInitializeFeatures) return;

    const map = mapRef.current;
    if (!map || !geoPoints.length) return;

    let noFly = false;
    // Calculate center point of all features
    let sumLng = 0;
    let sumLat = 0;
    let pointCount = 0;

    geoPoints.forEach(point => {
      if (isIntelligentLayer(point) && point.is_refetch) {
        noFly = true;
        return;
      }
      if (point.display && point.features) {
        point.features.forEach(feature => {
          const coords = feature.geometry.coordinates as [number, number];
          sumLng += coords[0];
          sumLat += coords[1];
          pointCount++;
        });
      }
    });

    if (pointCount > 0 && !noFly) {
      const centerLng = sumLng / pointCount;
      const centerLat = sumLat / pointCount;

      map.flyTo({
        center: [
          isNaN(centerLng) ? fallbackCenter.centerLng : centerLng,
          isNaN(centerLat) ? fallbackCenter.centerLat : centerLat,
        ],
        speed: defaultMapConfig.speed,
        curve: 1,
        essential: true,
        maxDuration: 1000,
      });
    }
  }, [mapRef, geoPoints, shouldInitializeFeatures]);
}
