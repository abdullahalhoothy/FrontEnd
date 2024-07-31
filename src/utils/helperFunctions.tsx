// helperFunctions.tsx
export function formatSubcategoryName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function processData(data: any, setData: Function): string[] {
  if (typeof data === "object" && data !== null) {
    const keys = Object.keys(data);
    setData(data);
    return keys;
  }
  return [];
}

export const colorOptions = ["Red", "Green", "Blue", "Yellow", "Black"];

export function isValidColor(color: string): boolean {
  return colorOptions.includes(
    color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()
  );
}