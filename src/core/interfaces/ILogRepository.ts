interface Log {
  id: string;
  userId: string;
  message: string;
}

export interface ILogRepository {
  create(userId: string, message: string): Promise<Log>;
}

export interface ILogService {
  recordLoginAttempt(userId: string, isSuccess: boolean): Promise<Log>;
  recordForgotPassword(userId: string): Promise<Log>;
  recordPasswordReset(userId: string): Promise<Log>;
}
