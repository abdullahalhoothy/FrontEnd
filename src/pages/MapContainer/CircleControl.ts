import mapboxgl, { LngLat, MapMouseEvent } from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

function CircleControl(map, draw) {
  this._map = map;
  this.draw = draw;
  this.isDrawing = false;

  // Method to create the control button
  this._createButton = (text, title, clickHandler) => {
    const button = document.createElement("button");
    button.className =
      "mapboxgl-ctrl-icon !flex !items-center !justify-center ";
    button.type = "button";
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#000000" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
      </svg>`;
    button.title = title;
    button.style.width = "29px";
    button.style.height = "29px";
    button.addEventListener("click", clickHandler);
    return button;
  };

  // Start drawing the circles
  this.startDrawing = () => {
    if (this._map) {
      this._map.getCanvas().style.cursor = "crosshair";
      this._map.once("click", this.handleCenterClick.bind(this));
      this.isDrawing = true;
    }
  };

  // Handle center click to draw circles
  this.handleCenterClick = (e) => {
    if (e.lngLat && this._map) {
      const center = e.lngLat;
      this.createCircles(center);
      this._map.getCanvas().style.cursor = "";
      this.isDrawing = false;
    }
  };

  // Create the circles with the given center
  this.createCircles = (center) => {
    const radii = [1, 3, 5];
    const features = radii.map((radius) => {
      const circle = turf.circle([center.lng, center.lat], radius, {
        units: "kilometers",
      });
      return circle.geometry.coordinates;
    });
    const multiPolygon = {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: features,
      },
      properties: {
        shape: "circle",
      },
    };

    const featureIds = this.draw.add(multiPolygon);
    multiPolygon.id = featureIds[0];

    this._map.fire("draw.create", { features: [multiPolygon] });

    this.draw.changeMode("direct_select", { featureIds: featureIds });
  };

  // Delete the selected circle
  this.deleteSelected = () => {
    const selectedFeatures = this.draw.getSelected();
    if (selectedFeatures.features.length > 0) {
      this.draw.delete(selectedFeatures.features[0].id);
    }
  };
}

// Add control to the map
CircleControl.prototype.onAdd = function (map) {
  this._map = map;
  this._container = document.createElement("div");
  this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

  const drawCirclesButton = this._createButton(
    "",
    "Draw 1km, 3km, 5km Circles",
    this.startDrawing.bind(this)
  );

  this._container.appendChild(drawCirclesButton);
  return this._container;
};

// Remove control from the map
CircleControl.prototype.onRemove = function () {
  if (this._map) {
    this._map.getCanvas().style.cursor = "";
    this._map.off("click", this.handleCenterClick);
  }
  if (this._container.parentNode) {
    this._container.parentNode.removeChild(this._container);
  }
  this._map = undefined;
};

// Export the CircleControl function
export { CircleControl };
