import React, { useEffect, useState } from 'react';
import styles from './UserLayerCard.module.css';
import placeHolderImage from '../../placeholderImage/layer.png';
import { UserLayerCardProps } from '../../types/allTypesAndInterfaces';
import { useCatalogContext } from '../../context/CatalogContext';
import { useLayerContext } from '../../context/LayerContext';
import { FaSearch } from 'react-icons/fa';

function UserLayerCard(props: UserLayerCardProps) {
  const { geoPoints } = useCatalogContext();
  const { propsFetchingProgress } = useLayerContext();
  const [isLoading, setIsLoading] = useState(false);
  const progress = props.progress || 89; // Default to 89% if not provided

  function handleMoreInfo() {
    setIsLoading(true);
    props.onMoreInfo({
      id: props.id,
      name: props.name,
      typeOfCard: props.typeOfCard,
    });
    // Simulate loading state for demo purposes
    setTimeout(() => setIsLoading(false), 2000);
  }

  return (
    <div className="relative transition-all">
      <div className="absolute top-0 left-0 z-[1]"></div>
      <div className="border border-[#f0f0f0] rounded overflow-hidden bg-white flex flex-col h-full">
        <div className="overflow-hidden relative">
          <img
            alt="Placeholder"
            src={placeHolderImage}
            className="w-full h-[200px] object-contain scale-[0.8]"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <FaSearch className="text-white text-3xl animate-bounce" />
                <div className="text-white mt-2">Loading...</div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col justify-between flex-grow">
          <div className="mb-4">
            <div className="flex flex-col">
              <div className="text-base font-bold">{props.name}</div>
            </div>
          </div>
          <div className="mt-2 flex-grow">
            <span className="block text-sm text-[#888]">Legend: {props.legend}</span>
            <p className="m-0 text-sm text-[#555]">Description: {props.description}</p>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        <ul className="list-none py-[10px] px-[5px] m-0 flex justify-around bg-[#f0f2f5] border-t border-[#dbdbdb] gap-x-[10px] w-full">
          <li className="flex items-center justify-center gap-x-[5px] font-medium text-[#1677ff]">
            <div
              onClick={handleMoreInfo}
              className={`cursor-pointer inline-flex items-center hover:text-[#40a9ff] text-red-500 font-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <FaSearch className="mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                '+ Add'
              )}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default UserLayerCard;
