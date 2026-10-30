import {
  ITransactionManager,
  TxContext,
} from "@src/core/interfaces/ITransactionManager";
import { Prisma, PrismaClient } from "@src/generated/prisma/client";

export type Db = PrismaClient | Prisma.TransactionClient;

export const sealTx = (tx: Prisma.TransactionClient) =>
  tx as unknown as TxContext;

export const dbFor = (tx: TxContext | undefined, fallback: Db): Db =>
  (tx as unknown as Prisma.TransactionClient | undefined) ?? fallback;

export class PrismaTransactionManager implements ITransactionManager {
  constructor(private prisma: PrismaClient) {}

  async runInTransaction<T>(
    work: (txContext: TxContext) => Promise<T>,
  ): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      return await work(sealTx(tx));
    });
  }
}
