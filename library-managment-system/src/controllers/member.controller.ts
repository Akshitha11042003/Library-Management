import { Request, Response } from "express";
import { MemberService } from "../services/member.service";
import { catchAsync } from "../utils/AppError";

export class MemberController {
  /**
   * Retrieves registered library members.
   */
  static list = catchAsync(async (req: Request, res: Response) => {
    const members = await MemberService.getAllMembers();

    return res.status(200).json({
      status: "success",
      results: members.length,
      data: { members },
    });
  });

  /**
   * Fetches profile details of a single member.
   */
  static getById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const member = await MemberService.getMemberById(id);

    return res.status(200).json({
      status: "success",
      data: { member },
    });
  });

  /**
   * Deletes a library member.
   */
  static delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await MemberService.deleteMember(id);

    return res.status(200).json({
      status: "success",
      message: "Member profile deleted successfully.",
      data: null,
    });
  });
}
