// helperFunctions.tsx
export function formatSubcategoryName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function processCityData(data: any, setData: Function): string[] {
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);
    setData(data);
    return keys;
  }
  return [];
}

export const colorOptions = [
  { name: "Red", hex: "#FF5733" },
  { name: "Green", hex: "#28A745" },
  { name: "Blue", hex: "#007BFF" },
  { name: "Yellow", hex: "#FFC107" },
  { name: "Black", hex: "#343A40" },
];

export function isValidColor(color: string): boolean {
  // Check if the color is a valid hex color
  const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  if (hexColorRegex.test(color)) {
    return true;
  }

  // Check if the color is a valid named color using CSS
  const option = document.createElement("div");
  option.style.color = color;
  return option.style.color !== "";
}

// Haversine formula to calculate distance between two points
// export const calculateDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371; // Radius of the Earth in km
//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) *
//       Math.cos(lat2 * (Math.PI / 180)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c; // Distance in km
//   return distance;
// };
// Accepts two GeoJSON Point geometries (arrays) and calculates the distance in km
export const calculateDistance = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};
