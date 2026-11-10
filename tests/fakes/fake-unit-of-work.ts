import {
  UnitOfWork,
  TransactionalRepositories,
} from "#src/core/interfaces/unit-of-work";

export class FakeUnitOfWork implements UnitOfWork {
  constructor(private readonly repos: TransactionalRepositories) {}

  runInTransaction<T>(work: (repos: TransactionalRepositories) => Promise<T>) {
    return work(this.repos);
  }
}
