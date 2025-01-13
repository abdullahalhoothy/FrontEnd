import mapboxgl, { LngLat, MapMouseEvent } from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

type CircleControlProps = {
  draw: MapboxDraw;
  isMobile: boolean;
};

function CircleControl(props: CircleControlProps) {
  const { draw, isMobile } = props;
  let _map: mapboxgl.Map;
  let _container: HTMLDivElement;
  let _drawCirclesButton: HTMLButtonElement;
  let isDrawing = false;

  const createButton = (title: string, clickHandler: () => void): HTMLButtonElement => {
    const button = document.createElement("button");
    button.className = "mapboxgl-ctrl-icon !flex !items-center !justify-center";
    button.type = "button";
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#000000" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      </svg>`;
    button.title = title;
    button.style.width = "29px";
    button.style.height = "29px";
    
    if (isMobile) {
      button.addEventListener("touchend", clickHandler);
    } else {
      button.addEventListener("click", clickHandler);
    }
    return button;
  };

  const createCircles = (center: LngLat): void => {
    try {
      const radii = [1, 3, 5]; // kilometers
      const features = radii.map((radius) => {
        const circle = turf.circle([center.lng, center.lat], radius, {
          units: "kilometers",
        });
        return circle.geometry.coordinates;
      });

      const multiPolygon: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: features,
        },
        properties: {
          shape: "circle",
        },
      };

      const featureIds = draw.add(multiPolygon as any);
      if (featureIds && featureIds.length > 0) {
        (multiPolygon as any).id = featureIds[0];
        _map.fire("draw.create", { features: [multiPolygon] });
        
        draw.changeMode("simple_select");
        
        draw.changeMode("direct_select", { featureId: featureIds[0] });
      } else {
        console.error('Failed to add circle feature to draw control');
      }
    } catch (error) {
      console.error('Error creating circles:', error);
    }
  };

  const handleCenterClick = (e: MapMouseEvent): void => {
    const center = e.lngLat;
    _map.getCanvas().style.cursor = "";
    
    // Reset drawing state
    isDrawing = false;
    _drawCirclesButton.classList.remove('mapbox-gl-draw_ctrl-draw-btn', 'active');
    
    createCircles(center);
  };

  const startDrawing = (): void => {
    // Toggle drawing state
    isDrawing = !isDrawing;
    
    if (isDrawing) {
      // Activate button style
      _drawCirclesButton.classList.add('mapbox-gl-draw_ctrl-draw-btn', 'active');
      _map.getCanvas().style.cursor = "crosshair";
      
      const eventType = isMobile ? "touchend" : "click";
      _map.once(eventType, handleCenterClick);
    } else {
      // Deactivate button style
      _drawCirclesButton.classList.remove('mapbox-gl-draw_ctrl-draw-btn', 'active');
      _map.getCanvas().style.cursor = "";
      
      // Remove event listeners
      _map.off("click", handleCenterClick);
      _map.off("touchend", handleCenterClick);
    }
  };

  const deleteSelected = (): void => {
    const selectedFeatures = draw.getSelected();
    if (selectedFeatures.features.length > 0) {
      const featureId = selectedFeatures.features[0].id;
      if (featureId) {
        draw.delete(featureId);
      }
    }
  };

  return {
    onAdd(map: mapboxgl.Map): HTMLElement {
      _map = map;
      _container = document.createElement("div");
      _container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

      _drawCirclesButton = createButton(
        "Draw 1km, 3km, 5km Circles",
        startDrawing
      );
      _container.appendChild(_drawCirclesButton);

      return _container;
    },

    onRemove(): void {
      _map.getCanvas().style.cursor = "";
      _map.off("click", handleCenterClick);
      _map.off("touchend", handleCenterClick);
      _container?.parentNode?.removeChild(_container);
    },

    deleteSelected
  };
}

export { CircleControl };