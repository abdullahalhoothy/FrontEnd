import mapboxgl from 'mapbox-gl';

type SetCurrentStyle = (style: string) => void;

export class StylesControl implements mapboxgl.IControl {
  private map?: mapboxgl.Map;
  private container?: HTMLDivElement;
  private currentStyle: string;
  private setCurrentStyle: SetCurrentStyle;

  constructor(currentStyle: string, setCurrentStyle: SetCurrentStyle) {
    this.currentStyle = currentStyle;
    this.setCurrentStyle = setCurrentStyle;
  }

  private styles = [
    { name: "Light", url: "mapbox://styles/mapbox/streets-v11" },
    { name: "Satellite Streets", url: "mapbox://styles/mapbox/satellite-streets-v11" },
    { name: "Dark", url: "mapbox://styles/mapbox/dark-v10" }
  ];

  onAdd(map: mapboxgl.Map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group !shadow-none bg-transparent";
    this.container.dir = "rtl";

    const toggleButton = document.createElement("button");
    toggleButton.className = "!bg-white !w-[29px] !shadow !h-[29px] !rounded-md !flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm";
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="11" y="2" width="11" height="11" rx="2.5" />
        <path d="M11 6.50049C8.97247 6.50414 7.91075 6.55392 7.23223 7.23243C6.5 7.96467 6.5 9.14318 6.5 11.5002V12.5002C6.5 14.8572 6.5 16.0357 7.23223 16.768C7.96447 17.5002 9.14298 17.5002 11.5 17.5002H12.5C14.857 17.5002 16.0355 17.5002 16.7678 16.768C17.4463 16.0895 17.4961 15.0277 17.4997 13.0002" />
        <path d="M6.5 11.0005C4.47247 11.0041 3.41075 11.0539 2.73223 11.7324C2 12.4647 2 13.6432 2 16.0002V17.0002C2 19.3572 2 20.5357 2.73223 21.268C3.46447 22.0002 4.64298 22.0002 7 22.0002H8C10.357 22.0002 11.5355 22.0002 12.2678 21.268C12.9463 20.5895 12.9961 19.5277 12.9997 17.5002" />
      </svg>
    `;

    const stylesContainer = document.createElement("div");
    stylesContainer.className = "hidden mt-2 flex flex-col rounded-md !shadow-md bg-white p-2 gap-2";
    
    this.updateStylesContainer(stylesContainer);

    this.container.appendChild(toggleButton);
    this.container.appendChild(stylesContainer);

    toggleButton.addEventListener("click", () => {
      stylesContainer.classList.toggle("hidden");
      toggleButton.classList.toggle("text-primary");
    });

    stylesContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "BUTTON") {
        const selectedStyle = target.getAttribute("data-style");
        if (selectedStyle && selectedStyle !== this.currentStyle && this.map) {
          this.currentStyle = selectedStyle;
          this.map.setStyle(selectedStyle);
          this.setCurrentStyle(selectedStyle);
          this.updateStylesContainer(stylesContainer);
          stylesContainer.classList.add("hidden");
          toggleButton.classList.remove("text-primary");
        }
      }
    });

    return this.container;
  }

  onRemove() {
    this.container?.remove();
    this.map = undefined;
  }

  private updateStylesContainer(container: HTMLDivElement) {
    container.innerHTML = this.styles
      .map(
        (style) => `
          <button class="bg-gray-200 !rounded text-nowrap !w-auto !h-auto !px-4 !p-2 text-sm font-medium !border-none transition-colors
            ${style.url === this.currentStyle ? "!bg-primary !text-white" : ""}"
            data-style="${style.url}">
            ${style.name}
          </button>
        `
      )
      .join("");
  }
}