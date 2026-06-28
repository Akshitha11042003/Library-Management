import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { BorrowStatus, Role } from "../types";

export class MemberService {
  /**
   * Retrieves all registered library members (excluding librarians for security).
   */
  static async getAllMembers() {
    return await prisma.user.findMany({
      where: {
        role: Role.MEMBER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Fetch a single member by ID.
   */
  static async getMemberById(id: string) {
    const member = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!member) {
      throw new AppError("The requested member record was not found.", 404);
    }

    return member;
  }

  /**
   * Deletes a member record after verifying they have no active borrows.
   */
  static async deleteMember(id: string) {
    const member = await prisma.user.findUnique({
      where: { id },
    });
    if (!member) {
      throw new AppError("The member record to delete was not found.", 404);
    }

    // Safeguard: Check if member has active checkouts
    const activeBorrows = await prisma.borrowRecord.count({
      where: {
        memberId: id,
        status: BorrowStatus.BORROWED,
        returnDate: null,
      },
    });

    if (activeBorrows > 0) {
      throw new AppError(
        `Cannot delete this member. They currently have ${activeBorrows} unreturned books.`,
        400
      );
    }

    // Delete historic borrow entries if they exist (or they cascade/restrict depending on database configs)
    // To be perfectly safe under onDelete: Restrict, if there are historic loans that are returned,
    // we block deletion or prompt to anonymize. Let's check for any historic borrows:
    const hasHistoricBorrows = await prisma.borrowRecord.findFirst({
      where: { memberId: id },
    });

    if (hasHistoricBorrows) {
      throw new AppError(
        "Cannot delete this member profile because transaction audit trails are connected to their account. Suspend their account or change login details instead.",
        400
      );
    }

    return await prisma.user.delete({
      where: { id },
    });
  }
}
