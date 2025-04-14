/**
 * Converts an alphabetical code to a number
 * e.g., 'a' -> 0, 'b' -> 1, 'aa' -> 26
 */
export function alphabet2number(a: string): number {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    const charCode = a.charCodeAt(i) - 97;
    result = result * 26 + (charCode + 1);
  }
  return result - 1;
}

/**
 * Converts a number to an alphabetical code
 * e.g., 0 -> 'a', 1 -> 'b', 26 -> 'aa'
 */
export function number2alphabet(n: number): string {
  let result = "";
  n++; // Convert zero-based to one-based for calculations
  while (n > 0) {
    n--; // Adjust for zero-based indexing
    const remainder = n % 26;
    result = String.fromCharCode(97 + remainder) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/**
 * Parses an ID string to a number
 * Supports both numeric and alphabetical IDs
 */
export function parseId(id: string): number {
  const num = parseInt(id);
  if (!isNaN(num)) return num;
  return alphabet2number(id);
}
