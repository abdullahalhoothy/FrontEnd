import mapboxgl, { Map, LngLat, MapMouseEvent } from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

class CircleControl implements mapboxgl.IControl {
  private _map: Map;
  private _container: HTMLDivElement;
  private draw: MapboxDraw;
  private isDrawing: boolean;

  constructor(map: Map, draw: MapboxDraw) {
    this._map = map;
    this.draw = draw;
    this.isDrawing = false;
  }

  onAdd(): HTMLElement {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

    const drawCirclesButton = this._createButton(
      "",
      "Draw 1km, 3km, 5km Circles",
      () => this.startDrawing()
    );

    this._container.appendChild(drawCirclesButton);

    return this._container;
  }

  onRemove(): void {
    if (this._map) {
      this._map.getCanvas().style.cursor = "";
      this._map.off("click", this.handleCenterClick);
    }
    this._container.parentNode?.removeChild(this._container);
  }

  private _createButton(
    text: string,
    title: string,
    clickHandler: () => void
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.className =
      "mapboxgl-ctrl-icon !flex !items-center !justify-center ";
    button.type = "button";
    button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#000000" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
</svg>
    `;
    button.title = title;
    button.style.width = "29px";
    button.style.height = "29px";
    button.addEventListener("click", clickHandler);
    return button;
  }

  private startDrawing(): void {
    if (this._map) {
      this._map.getCanvas().style.cursor = "crosshair";
      this._map.once("click", this.handleCenterClick);
      this.isDrawing = true;
    }
  }

  private handleCenterClick = (e: MapMouseEvent): void => {
    if (e.lngLat && this._map) {
      const center = e.lngLat;
      this.createCircles(center);
      this._map.getCanvas().style.cursor = "";
      this.isDrawing = false;
    }
  };

  private createCircles(center: LngLat): void {
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
  }

  private deleteSelected(): void {
    const selectedFeatures = this.draw.getSelected();
    if (selectedFeatures.features.length > 0) {
      this.draw.delete(selectedFeatures.features[0].id);
    }
  }
}

export default CircleControl;
