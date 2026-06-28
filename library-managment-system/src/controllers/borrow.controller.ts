import { Response } from "express";
import { BorrowService } from "../services/borrow.service";
import { AuthenticatedRequest, Role } from "../types";
import { AppError, catchAsync } from "../utils/AppError";

export class BorrowController {
  /**
   * Action to checkout/borrow a book.
   */
  static borrow = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookId = req.params.id;
    const { memberId } = req.body;
    const currentUser = req.user!;

    // Security check: Members can only borrow books for themselves.
    // Librarians can register borrowings on behalf of any member.
    let targetMemberId = memberId;

    if (currentUser.role === Role.MEMBER) {
      if (memberId && memberId !== currentUser.id) {
        throw new AppError("Access denied. Members can only checkout books for themselves.", 403);
      }
      targetMemberId = currentUser.id;
    } else {
      // If librarian, they must provide a valid memberId in the payload
      if (!targetMemberId) {
        throw new AppError("A valid memberId is required for librarians checking out books.", 400);
      }
    }

    if (!bookId) {
      throw new AppError("The bookId is required to complete this checkout.", 400);
    }

    const record = await BorrowService.borrowBook(targetMemberId, bookId);

    return res.status(201).json({
      status: "success",
      message: "Book checked out successfully.",
      data: { record },
    });
  });

  /**
   * Action to return a book.
   */
  static return = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const bookId = req.params.id;
    const { memberId } = req.body;
    const currentUser = req.user!;

    // Security check: Members can only return books for themselves.
    // Librarians can process returns on behalf of any member.
    let targetMemberId = memberId;

    if (currentUser.role === Role.MEMBER) {
      if (memberId && memberId !== currentUser.id) {
        throw new AppError("Access denied. Members can only process returns for themselves.", 403);
      }
      targetMemberId = currentUser.id;
    } else {
      if (!targetMemberId) {
        throw new AppError("A valid memberId is required for librarians processing returns.", 400);
      }
    }

    if (!bookId) {
      throw new AppError("The bookId is required to complete this return.", 400);
    }

    const record = await BorrowService.returnBook(targetMemberId, bookId);

    return res.status(200).json({
      status: "success",
      message: "Book returned and inventory updated successfully.",
      data: { record },
    });
  });

  /**
   * Fetch active books checked out by the authenticated member.
   */
  static getMyActiveBorrows = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;

    const borrows = await BorrowService.getMemberActiveBorrows(currentUser.id);

    return res.status(200).json({
      status: "success",
      results: borrows.length,
      data: { borrows },
    });
  });

  /**
   * Fetch complete borrowing histories of the authenticated member.
   */
  static getMyHistory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;

    const history = await BorrowService.getMemberBorrowHistory(currentUser.id);

    return res.status(200).json({
      status: "success",
      results: history.length,
      data: { history },
    });
  });
}
