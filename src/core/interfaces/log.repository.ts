export interface Log {
  id: string;
  userId: string;
  message: string;
}

export interface LogRepository {
  create(userId: string, message: string): Promise<Log>;
  findByUserId(userId: string): Promise<Log[]>;
}
