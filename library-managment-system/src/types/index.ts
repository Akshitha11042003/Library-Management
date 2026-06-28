import { Request } from "express";

export enum Role {
  MEMBER = "MEMBER",
  LIBRARIAN = "LIBRARIAN"
}

export enum BorrowStatus {
  BORROWED = "BORROWED",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE"
}

export interface UserContext {
  id: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}
