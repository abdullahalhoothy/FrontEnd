import { CustomProperties } from "../../types/allTypesAndInterfaces";
import urls from "../../urls.json";
const googleStreetViewUrl = urls.street_view_link;
import styles from "./MapContainer.module.css";

export function generatePopupContent(
  properties: CustomProperties,
  coordinates: [number, number],
  loading: boolean,
  hasStreetView: boolean
): string {
  let content = `<div class="${styles.popupContent}">`;

  // Always included fields at the top
  content += `<strong class="${styles.popupContentStrong}">${properties.name}</strong>`;

  // Dynamically included fields in the middle
  for (const key in properties) {
    const value = properties[key];
    if (
      key !== "name" &&
      key !== "user_ratings_total" &&
      key !== "rating" &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      let parsedValue = value;
      if (
        typeof value === "string" &&
        value.startsWith("[") &&
        value.endsWith("]")
      ) {
        try {
          parsedValue = JSON.parse(value);
        } catch (e) {
          console.error(`Failed to parse value for key: ${key}`, e);
        }
      }

      if (Array.isArray(parsedValue)) {
        content += `<div class="${
          styles.popupContentDiv
        }">${key}: ${parsedValue.join(", ")}</div>`;
      } else {
        content += `<div class="${styles.popupContentDiv}">${key}: ${parsedValue}</div>`;
      }
    }
  }

  // Always included fields at the end
  content += `<div class="${styles.popupContentDiv} ${styles.popupContentTotalRatings}">Total Ratings: ${properties.user_ratings_total}</div>`;
  content += `<div class="${styles.popupContentDiv} ${styles.popupContentRating}">Rating: ${properties.rating}</div>`;

  if (loading) {
    content += `<div class="flex items-center gap-2 text-sm font-semibold">
                      <svg
                          class="animate-spin w-4 h-4 fill-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24">
                          <path d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z" />
                      </svg>
        Loading Street View...
      </div>`;
  } else if (hasStreetView) {
    content += `<a href="${googleStreetViewUrl}${coordinates[1]},${coordinates[0]}" target="_blank" class="text-sm hover:underline text-gray-900 hover:text-primary font-semibold my-2">Open Google Street View</a>`;
  } else {
    content += `<div class="text-sm text-gray-700 font-semibold my-2">No Street View available</div>`;
  }
  content += `</div>`;
  return content;
}