// Define the StylesControl function (constructor)

type SetCurrentStyle = (style: string) => void;

type currentStyle = string;

function StylesControl(currentStyle: currentStyle, setCurrentStyle: SetCurrentStyle) {
  this.currentStyle = currentStyle;
  this.setCurrentStyle = setCurrentStyle;

  this.styles = [
    { name: 'Light', url: 'mapbox://styles/mapbox/streets-v11' },
    {
      name: 'Satellite Streets',
      url: 'mapbox://styles/mapbox/satellite-streets-v11',
    },
    { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v10' },
  ];
}

// Define the onAdd method
StylesControl.prototype.onAdd = function (map) {
  this._map = map;
  this._container = document.createElement('div');
  this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group !shadow-none bg-transparent  ';
  this._container.dir = 'rtl';

  // Create toggle button with SVG
  const toggleButton = document.createElement('button');
  toggleButton.className =
    '!bg-white !w-[29px] !shadow !h-[29px] !rounded-md !flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm ';
  toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="11" y="2" width="11" height="11" rx="2.5" />
        <path d="M11 6.50049C8.97247 6.50414 7.91075 6.55392 7.23223 7.23243C6.5 7.96467 6.5 9.14318 6.5 11.5002V12.5002C6.5 14.8572 6.5 16.0357 7.23223 16.768C7.96447 17.5002 9.14298 17.5002 11.5 17.5002H12.5C14.857 17.5002 16.0355 17.5002 16.7678 16.768C17.4463 16.0895 17.4961 15.0277 17.4997 13.0002" />
        <path d="M6.5 11.0005C4.47247 11.0041 3.41075 11.0539 2.73223 11.7324C2 12.4647 2 13.6432 2 16.0002V17.0002C2 19.3572 2 20.5357 2.73223 21.268C3.46447 22.0002 4.64298 22.0002 7 22.0002H8C10.357 22.0002 11.5355 22.0002 12.2678 21.268C12.9463 20.5895 12.9961 19.5277 12.9997 17.5002" />
      </svg>
    `;

  // Create styles container (hidden by default)
  const stylesContainer = document.createElement('div');
  stylesContainer.className = 'hidden mt-2 flex flex-col rounded-md !shadow-md bg-white p-2 gap-2';
  stylesContainer.innerHTML = this.styles
    .map(
      style => `
      <button class="bg-gray-200 !rounded text-nowrap !w-auto !h-auto !px-4 !p-2 text-sm font-medium !border-none transition-colors
     ${style.url === this.currentStyle ? '!bg-primary !text-white' : ''}"
         data-style="${style.url}">
        ${style.name}
      </button>
    `
    )
    .join('');

  this._container.appendChild(toggleButton);
  this._container.appendChild(stylesContainer);

  // Toggle visibility of styles container
  toggleButton.addEventListener('click', () => {
    stylesContainer.classList.toggle('hidden');
    toggleButton.classList.toggle('text-primary');
  });

  // Style selection
  // stylesContainer.addEventListener('click', e => {
  //   const target = e.target;
  //   if (target && target.tagName === 'BUTTON') {
  //     const selectedStyle = target.getAttribute('data-style');
  //     if (selectedStyle && selectedStyle !== this.currentStyle) {
  //       this._map.setStyle(selectedStyle);
  //       this._updateButtons(selectedStyle);
  //       this.setCurrentStyle(prev => selectedStyle);
  //       this.currentStyle = selectedStyle;
  //       stylesContainer.classList.add('hidden');
  //       toggleButton.classList.remove('text-primary');
  //     }
  //   }
  // });
  stylesContainer.addEventListener('click', e => {
    const target = e.target;
    if (target && target.tagName === 'BUTTON') {
      const selectedStyle = target.getAttribute('data-style');
      if (selectedStyle && selectedStyle !== this.currentStyle) {
        // Temporarily store the current controls
        const currentControls = [...this._map._controls];
  
        // Update the map style
        this._map.setStyle(selectedStyle);
  
        // Re-add controls after the style loads
        this._map.once('styledata', () => {
          currentControls.forEach(control => this._map.addControl(control));
        });
  
        // Update the UI
        this._updateButtons(selectedStyle);
        this.setCurrentStyle(selectedStyle);
        this.currentStyle = selectedStyle;
        stylesContainer.classList.add('hidden');
        toggleButton.classList.remove('text-primary');
      }
    }
  });
  

  return this._container;
};

// Define the onRemove method
StylesControl.prototype.onRemove = function () {
  if (this._container && this._container.parentNode) {
    this._container.parentNode.removeChild(this._container);
  }
  this._map = undefined;
};

// Define the _updateButtons method
StylesControl.prototype._updateButtons = function (selectedStyle) {
  const buttons = this._container.querySelectorAll('button[data-style]');
  buttons.forEach(button => {
    if (button.getAttribute('data-style') === selectedStyle) {
      button.classList.add('!bg-primary', '!text-white');
      button.classList.remove('text-gray-700', 'hover:text-gray-900');
    } else {
      button.classList.remove('!bg-primary', '!text-white');
      button.classList.add('text-gray-700', 'hover:text-gray-900');
    }
  });
};

// Export the StylesControl function
export { StylesControl };
