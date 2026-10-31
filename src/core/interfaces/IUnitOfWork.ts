import { IUserRepository } from "../users/IUserRepository";
import { IEmailVerificationRepository } from "./IEmailVerification";
import { IGoogleUserRepository } from "./IGoogleUserRepository";
import { ILogRepository } from "./ILogRepository";
import { IPasswordResetsRepository } from "./IPasswordResetsRepository";

export interface TransactionalRepositories {
  users: IUserRepository;
  passwordResets: IPasswordResetsRepository;
  logs: ILogRepository;
  emailVerifications: IEmailVerificationRepository;
  googleUsers: IGoogleUserRepository;
}

export interface IUnitOfWork extends TransactionalRepositories {
  runInTransaction<T>(
    work: (transactionalRepos: TransactionalRepositories) => Promise<T>,
  ): Promise<T>;
}
