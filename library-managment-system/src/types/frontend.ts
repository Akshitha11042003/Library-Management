export interface User {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "LIBRARIAN";
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRecord {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
  book: Book;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  message?: string;
  data: T;
  results?: number;
}
