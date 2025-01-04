import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import './MapContainer.css'

import PolygonsProvider from '../../context/PolygonsContext'
import { useMapInitialization } from '../../hooks/map/useMapInitialization'
import { useMapBounds } from '../../hooks/map/useMapBounds'
import { useMapControls } from '../../hooks/map/useMapControls'
import { useMapLayers } from '../../hooks/map/useMapLayers'
import { usePolygonHandlers } from '../../hooks/map/usePolygonHandlers'
import { useLegendManager } from '../../hooks/map/useLegendManager'
import { useMapStyle } from '../../hooks/map/useMapStyle'
import StatisticsPopups from '../../components/Map/StatisticsPopups'
import BenchmarkControl from './BenchmarkControl'
import { useMapContext, MapProvider } from '../../context/MapContext'


// Main container component that handles map initialization and state
function Container () {
  const { shouldInitializeFeatures, mapContainerRef} = useMapContext();

  useMapInitialization();
  useMapBounds();
  useMapControls();
  useMapLayers();
  usePolygonHandlers();
  useLegendManager();
  useMapStyle();

  return (
    <div className='flex-1 relative' id='map-container'>
      <div
        className='lg:absolute w-full h-full overflow-hidden'
        ref={mapContainerRef}
      />
      <StatisticsPopups />
      {shouldInitializeFeatures && <BenchmarkControl />}
    </div>
  )
}

// Wrapper component that provides polygon context
export default function MapContainer () {
  return (
    <MapProvider>
      <PolygonsProvider>
        <Container />
      </PolygonsProvider>
    </MapProvider>
  )
}
