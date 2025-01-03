import ColorSelect from "../ColorSelect/ColorSelect";
import { LayerCustomizationItemProps } from "../../types/allTypesAndInterfaces";
import { HiCheck, HiExclamation } from "react-icons/hi";


function LayerCustomizationItem({
    layer,
    isCollapsed,
    error,
    onToggleCollapse,
    onLayerChange,
    onDiscard,
    onSave,
    isSaving,
    isSaved,
}: LayerCustomizationItemProps) {

    const getHeaderStyle = (hexColor: string) => ({
        backgroundColor: `${hexColor || '#28A745'}10`,
        borderLeft: `4px solid ${hexColor || '#28A745'}`
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div
                onClick={() => onToggleCollapse(layer.layerId)}
                className="flex justify-between items-center cursor-pointer"
                style={getHeaderStyle(layer.color)}
            >
                <div className="flex items-center space-x-3 p-4">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                    />
                    <h3 className="font-medium text-gray-900">
                        {layer.name || `Layer ${layer.layerId}`}
                    </h3>
                </div>
                <div className="pr-4">
                    <svg
                        className={`w-5 h-5 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div
                className={`
          transform transition-all duration-200 ease-in-out origin-top overflow-scroll
          ${isCollapsed
                        ? 'scale-y-0 h-0 opacity-0'
                        : 'scale-y-100 opacity-100'
                    }
        `}
            >
                <div className="p-4 space-y-4 bg-gray-50">
                    {error && (
                        <div className="text-red-500 text-sm rounded-md bg-red-50 p-2">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={layer.name}
                                onChange={(e) => onLayerChange(layer.layerId, 'name', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-green-500 focus:ring-green-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Point Color</label>
                            <ColorSelect
                                layerId={layer.layerId}
                                onColorChange={(color) => onLayerChange(layer.layerId, 'color', color)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Legend</label>
                            <textarea
                                value={layer.legend}
                                onChange={(e) => onLayerChange(layer.layerId, 'legend', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={layer.description}
                                onChange={(e) => onLayerChange(layer.layerId, 'description', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                onClick={() => onDiscard(layer.layerId)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm 
                         font-medium text-gray-700 bg-white hover:bg-gray-50 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-green-500"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => onSave(layer.layerId)}
                                disabled={isSaving}
                                className={`px-3 py-2 border border-transparent rounded-md text-sm 
                         font-medium text-white ${isSaved ? 'bg-green-700' : error ? 'bg-red-600' : 'bg-green-600'} 
                         hover:${error ? 'bg-red-700' : 'bg-green-700'} 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-green-500 
                         flex items-center justify-center gap-2`}
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </span>
                                ) : isSaved ? (
                                    <>
                                        <HiCheck className="h-5 w-5" />
                                        Saved
                                    </>
                                ) : error ? (
                                    <>
                                        <HiExclamation className="h-5 w-5" />
                                        Retry
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                                <HiExclamation className="h-5 w-5" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LayerCustomizationItem; 