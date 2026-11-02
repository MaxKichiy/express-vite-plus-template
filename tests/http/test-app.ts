import { User } from "#src/core/users/user";
import { createApp } from "#src/http/app";
import { createMainRouter } from "#src/http/routes/index";
import { bootstrapServices } from "#src/main/services.container";
import { FakeGoogleVerifier } from "../fakes/fake-google-verifier";
import { fakePasswordEncryption } from "../fakes/fake-password-encryption";
import { RecordingMailer } from "../fakes/recording-mailer";
import { inMemoryRepos } from "../helpers/in-memory-repos";
import { fakeSigner } from "../mocks/fakeSigner.test";

export function testApp(users: User[] = []) {
  const repos = inMemoryRepos(users); // the same 5 in-memory repos + FakeUnitOfWork, as AppRepositories
  const mailer = new RecordingMailer();
  const services = bootstrapServices(repos, {
    mailer, // ✅ no AWS
    signer: fakeSigner, // ✅ readable tokens
    passwords: fakePasswordEncryption, // ✅ fast (real bcrypt cost 12 is ~250ms per hash)
    google: new FakeGoogleVerifier(), // ✅ no Google
  });
  return { app: createApp(createMainRouter(services)), mailer, repos }; // ✅ REAL routes, validators, controllers, core
}
