declare const txBrand: unique symbol;
export type TxContext = { readonly [txBrand]: true };

export interface ITransactionManager {
  runInTransaction<T>(work: (context: TxContext) => Promise<T>): Promise<T>;
}
