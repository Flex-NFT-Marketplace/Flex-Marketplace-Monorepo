export enum HttpStatus {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

export enum HttpMessage {
  SUCCESS = 'Success',
  CREATED = 'Created',
  BAD_REQUEST = 'Bad Request',
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Forbidden',
  NOT_FOUND = 'Not Found',
  SERVER_ERROR = 'Server Error',
}

export enum FilterDrops {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  DISTRIBUTED = 'distributed',
}
