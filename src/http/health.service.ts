export class HealthService {
  constructor(private readonly pingDatabase: () => Promise<void>) {}

  async check() {
    const database = await this.pingDatabase().then(
      () => true,
      () => false,
    );
    return { database };
  }
}
