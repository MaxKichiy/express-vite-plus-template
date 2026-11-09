import { User } from "#src/core/users/user";
import { createApp } from "#src/http/app";
import { createMainRouter } from "#src/http/routes/index";
import { bootstrapServices } from "#src/main/services.container";
import { FakeGoogleVerifier } from "../fakes/fake-google-verifier";
import { fakePasswordEncryption } from "../fakes/fake-password-encryption";
import { RecordingMailer } from "../fakes/recording-mailer";
import { inMemoryRepos } from "../helpers/in-memory-repos";
import { fakeSigner } from "../fakes/fake-signer";

export function testApp(
  users: User[] = [],
  options: { databaseUp?: boolean } = {},
) {
  const repos = inMemoryRepos(users, options);
  const mailer = new RecordingMailer();
  const google = new FakeGoogleVerifier();
  const services = bootstrapServices(repos, {
    mailer,
    google,
    signer: fakeSigner,
    passwords: fakePasswordEncryption,
  });
  const reported: unknown[] = [];
  const app = createApp(createMainRouter(services), (err) =>
    reported.push(err),
  );
  return {
    app,
    mailer,
    repos,
    google,
    reported,
  };
}
