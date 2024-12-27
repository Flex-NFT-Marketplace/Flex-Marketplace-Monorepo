import { HttpStatus } from './enum.type';

export class ResponseData<T> {
  data: T | T[];
  status: number;
  message: string;

  constructor(data: T | T[], status: HttpStatus, message: string) {
    this.data = data;
    this.status = status;
    this.message = message;
  }
}

export class PaginatedResponseData<T> extends ResponseData<T> {
  totalPages: number;
  currentPage: number;

  constructor(
    data: T | T[],
    status: HttpStatus,
    message: string,
    totalPages: number,
    currentPage: number,
  ) {
    super(data, status, message);
    this.totalPages = totalPages;
    this.currentPage = currentPage;
  }
}
