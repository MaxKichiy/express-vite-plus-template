import {
  IUnitOfWork,
  TransactionalRepositories,
} from "#src/core/interfaces/IUnitOfWork";

export class FakeUnitOfWork implements IUnitOfWork {
  constructor(private readonly repos: TransactionalRepositories) {}

  runInTransaction<T>(work: (repos: TransactionalRepositories) => Promise<T>) {
    return work(this.repos);
  }
}
