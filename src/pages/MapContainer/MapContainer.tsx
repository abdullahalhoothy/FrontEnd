import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import './MapContainer.css'

import { useRef, useState, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { useLayerContext } from '../../context/LayerContext'
import PolygonsProvider, {
  usePolygonsContext
} from '../../context/PolygonsContext'
import { useUIContext } from '../../context/UIContext'
import { useCatalogContext } from '../../context/CatalogContext'
import { useMapInitialization } from '../../hooks/map/useMapInitialization'
import { useMapBounds } from '../../hooks/map/useMapBounds'
import { useMapControls } from '../../hooks/map/useMapControls'
import { useMapLayers } from '../../hooks/map/useMapLayers'
import { usePolygonHandlers } from '../../hooks/map/usePolygonHandlers'
import { useLegendManager } from '../../hooks/map/useLegendManager'
import { useMapStyle } from '../../hooks/map/useMapStyle'
import StatisticsPopups from '../../components/Map/StatisticsPopups'
import BenchmarkControl from './BenchmarkControl'

// Main container component that handles map initialization and state
function Container () {
  // Refs for map container, map instance, and drawing tools
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  
  // State for map styling and layer colors
  const [currentStyle, setCurrentStyle] = useState(
    'mapbox://styles/mapbox/streets-v11'
  )

  const { geoPoints, setGeoPoints } = useCatalogContext()
  const { polygons, setPolygons } = usePolygonsContext()
  const { isMobile } = useUIContext()

  // Initialize map and features
  const isStyleLoaded = useMapInitialization(mapRef, mapContainerRef, currentStyle)

  // Add debug logs
  console.log('MapContainer: Current map instance:', mapRef.current)
  console.log('MapContainer: Style loaded:', isStyleLoaded)

  // Map instance for hooks
  const map = mapRef.current

  // Only use these hooks when map is initialized and style is loaded
  const shouldInitializeFeatures = isStyleLoaded && map;

  // Initialize map features conditionally
  useMapBounds(shouldInitializeFeatures ? map : null, geoPoints)
  useMapControls(shouldInitializeFeatures ? map : null, currentStyle, setCurrentStyle)
  useMapLayers(shouldInitializeFeatures ? map : null, geoPoints)
  usePolygonHandlers(shouldInitializeFeatures ? map : null, setPolygons)
  useLegendManager(shouldInitializeFeatures ? geoPoints : [])
  useMapStyle(shouldInitializeFeatures ? map : null, currentStyle, setGeoPoints)

  return (
    <div className='flex-1 relative' id='map-container'>
      <div
        className='lg:absolute w-full h-full overflow-hidden'
        ref={mapContainerRef}
      />
      <StatisticsPopups />
      {map && <BenchmarkControl />}
    </div>
  )
}

// Wrapper component that provides polygon context
export default function MapContainer () {
  return (
    <PolygonsProvider>
      <Container />
    </PolygonsProvider>
  )
}
