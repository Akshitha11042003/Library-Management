import { BorrowStatus } from "../types";

/**
 * Core business rules, state validations, and utility functions for the BorrowRecord model lifecycle.
 */

// Global Business Constants
export const MAX_ACTIVE_LOANS_LIMIT = 5;
export const STANDARD_LOAN_DURATION_DAYS = 14;
export const DAILY_LATE_FEE_USD = 0.50;

/**
 * Calculates the standard due date for a new borrow record.
 * @param borrowDate The date the book is being borrowed. Defaults to now.
 * @param durationDays The allowed duration of the loan. Defaults to 14 days.
 */
export function calculateDueDate(borrowDate: Date = new Date(), durationDays: number = STANDARD_LOAN_DURATION_DAYS): Date {
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + durationDays);
  return dueDate;
}

/**
 * Determines if a borrow record is currently overdue.
 * @param dueDate The deadline for returning the book.
 * @param returnDate The date the book was returned (or null if not returned yet).
 */
export function isBorrowRecordOverdue(dueDate: Date, returnDate?: Date | null): boolean {
  const referenceDate = returnDate || new Date();
  // Strip hours/minutes/seconds for fair day-based calculation
  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const refMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime();
  
  return refMidnight > dueMidnight;
}

/**
 * Evaluates the status of a borrow record based on dates.
 * @param dueDate The deadline for returning the book.
 * @param returnDate The date the book was returned (or null if not returned yet).
 */
export function determineBorrowStatus(dueDate: Date, returnDate?: Date | null): BorrowStatus {
  if (returnDate) {
    return BorrowStatus.RETURNED;
  }
  return isBorrowRecordOverdue(dueDate) ? BorrowStatus.OVERDUE : BorrowStatus.BORROWED;
}

/**
 * Calculates late fees accrued for a returned book or current active overdue book.
 * Fee rule: Daily fee starts accumulating only after the due date.
 * @param dueDate The deadline for returning the book.
 * @param returnDate The date returned (or now if checking current outstanding fees).
 * @param dailyFee Amount charged per day overdue in USD. Defaults to $0.50.
 */
export function calculateLateFee(dueDate: Date, returnDate: Date = new Date(), dailyFee: number = DAILY_LATE_FEE_USD): number {
  if (!isBorrowRecordOverdue(dueDate, returnDate)) {
    return 0.0;
  }

  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const returnMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());

  const diffTime = returnMidnight.getTime() - dueMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays * dailyFee);
}

/**
 * Validates whether a member is allowed to borrow a new book.
 * Rules:
 * 1. A member cannot exceed the maximum number of simultaneous active borrow records.
 * 2. Optionally check if they have any active overdue loans blocking new borrows.
 * 
 * @param activeLoansCount The number of books currently checked out by the member.
 * @param maxLimit The maximum allowed active loans. Defaults to 5.
 */
export function canMemberBorrow(activeLoansCount: number, maxLimit: number = MAX_ACTIVE_LOANS_LIMIT): boolean {
  return activeLoansCount < maxLimit;
}

/**
 * Checks if a book can be checked out based on inventory.
 * Rule: The available quantity of the book must be strictly greater than 0.
 * @param availableQuantity Current available quantity in stock.
 */
export function isBookAvailableForBorrow(availableQuantity: number): boolean {
  return availableQuantity > 0;
}
