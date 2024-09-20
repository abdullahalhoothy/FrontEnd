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
