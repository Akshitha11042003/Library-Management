import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { catchAsync } from "../utils/AppError";

export class AuthController {
  /**
   * Registers a new library member.
   */
  static register = catchAsync(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const user = await AuthService.register(name, email, password);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      data: { user },
    });
  });

  /**
   * Authenticates user and issues access token.
   */
  static login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const { token, user } = await AuthService.login(email, password);

    return res.status(200).json({
      status: "success",
      message: "Authentication successful.",
      data: {
        accessToken: token,
        user,
      },
    });
  });
}
