/**
 * Utility functions and business rule validators for the Book model.
 */

/**
 * Normalizes an ISBN string by stripping whitespace, hyphens, and converting "x" to "X".
 * @param isbn Raw ISBN input string from client/database
 */
export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, "").toUpperCase();
}

/**
 * Validates an ISBN-10 checksum.
 * ISBN-10 formula: (x1 * 10 + x2 * 9 + x3 * 8 + ... + x10 * 1) % 11 === 0
 * @param isbn Normalized 10-character ISBN string
 */
export function isValidISBN10(isbn: string): boolean {
  if (isbn.length !== 10) return false;
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i], 10) * (10 - i);
  }

  const lastChar = isbn[9];
  sum += lastChar === "X" ? 10 : parseInt(lastChar, 10);

  return sum % 11 === 0;
}

/**
 * Validates an ISBN-13 checksum.
 * ISBN-13 formula: (x1 * 1 + x2 * 3 + x3 * 1 + x4 * 3 + ... + x13 * 1) % 10 === 0
 * @param isbn Normalized 13-character ISBN string
 */
export function isValidISBN13(isbn: string): boolean {
  if (isbn.length !== 13) return false;
  if (!/^\d{13}$/.test(isbn)) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

/**
 * Checks if a string is a valid ISBN-10 or ISBN-13 with standard checksum validation.
 * @param isbn Raw or partially-normalized ISBN string
 */
export function isValidISBN(isbn: string): boolean {
  const cleanIsbn = normalizeISBN(isbn);
  if (cleanIsbn.length === 10) {
    return isValidISBN10(cleanIsbn);
  } else if (cleanIsbn.length === 13) {
    return isValidISBN13(cleanIsbn);
  }
  return false;
}

/**
 * Checks if a librarian is allowed to reduce a book's total quantity to a target level.
 * Rule: Total books currently loaned out (borrowed but not yet returned) is computed as (totalQuantity - availableQuantity).
 * The new total quantity cannot be less than the number of active, outstanding loans.
 * 
 * @param currentTotal Current total quantity (`quantity` field in database)
 * @param currentAvailable Current available quantity (`availableQuantity` field in database)
 * @param targetTotal The proposed new total quantity
 */
export function canReduceBookQuantity(
  currentTotal: number,
  currentAvailable: number,
  targetTotal: number
): boolean {
  if (targetTotal < 0) return false;
  
  const outstandingLoans = currentTotal - currentAvailable;
  // If proposed new total is less than currently active loans, reduction is blocked
  return targetTotal >= outstandingLoans;
}

/**
 * Calculates the new available quantity when updating the total quantity of a book.
 * Formula: newAvailable = targetTotal - (currentTotal - currentAvailable)
 * 
 * @param currentTotal Current total quantity (`quantity` field in database)
 * @param currentAvailable Current available quantity (`availableQuantity` field in database)
 * @param targetTotal The proposed new total quantity
 */
export function calculateNewAvailableQuantity(
  currentTotal: number,
  currentAvailable: number,
  targetTotal: number
): number {
  const outstandingLoans = currentTotal - currentAvailable;
  return Math.max(0, targetTotal - outstandingLoans);
}
