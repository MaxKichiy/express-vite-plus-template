// Throws like Postgres does when a new row repeats a value in a @unique column.
// Pass the same columns that are @unique in schema.prisma for that model.
export function assertUnique<Row, Field extends keyof Row>(
  rows: readonly Row[],
  candidate: Pick<Row, Field>,
  fields: readonly Field[],
): void {
  for (const field of fields) {
    const value = candidate[field];
    if (value === null || value === undefined) continue;
    if (rows.some((row) => row[field] === value)) {
      throw new Error(`unique constraint: ${String(field)}`);
    }
  }
}
