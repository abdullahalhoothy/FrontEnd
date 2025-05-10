import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import './MapContainer.css';

import PolygonsProvider from '../../context/PolygonsContext';
import { useMapInitialization } from '../../hooks/map/useMapInitialization';
import { useMapBounds } from '../../hooks/map/useMapBounds';
import { useMapControls } from '../../hooks/map/useMapControls';
import { useMapLayers } from '../../hooks/map/useMapLayers';
import { usePolygonHandlers } from '../../hooks/map/usePolygonHandlers';
import { useLegendManager } from '../../hooks/map/useLegendManager';
import { useMapStyle } from '../../hooks/map/useMapStyle';
import StatisticsPopups from '../../components/Map/StatisticsPopups';
import BenchmarkControl from '../../components/Map/BenchmarkControl';
import { PopulationControl } from '../../components/Map/PopulationControl';
import SavedLocations from '../../components/Map/SavedLocations';
import { useMapContext } from '../../context/MapContext';
import { CaseStudyPanel } from '../../components/CaseStudy/CaseStudyPanel';
import { CaseStudyProvider } from '../../components/CaseStudy/CaseStudyPanel';
import { CaseStudyToggle } from '../../components/CaseStudy/CaseStudyToggle';

function Container() {
  const { shouldInitializeFeatures, mapContainerRef } = useMapContext();

  useMapInitialization();
  useMapBounds();
  useMapControls();
  useMapLayers();
  usePolygonHandlers();
  useLegendManager();
  useMapStyle();

  return (
    <>
      <div className="flex-1 relative w-full h-full" id="map-container">
        <div className="w-full h-full overflow-hidden" ref={mapContainerRef} />
        <StatisticsPopups />
        {shouldInitializeFeatures && (
          <>
            <div className="absolute top-4 left-4 flex items-start gap-2 z-[1]">
              <BenchmarkControl />
              <PopulationControl />
            </div>
            <SavedLocations />
          </>
        )}
        <CaseStudyPanel />
      </div>
    </>
  );
}

export default function MapContainer() {
  return (
    <PolygonsProvider>
      <Container />
    </PolygonsProvider>
  );
}
