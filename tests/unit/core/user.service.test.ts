import { describe, expect, it } from "vite-plus/test";
import { makeUserService } from "../../builders/make-user-service";
import { aUser } from "../../builders/a-user";
import { expectAppError } from "../../helpers/expect-app-error";

const input = {
  firstName: "Ada",
  lastName: "Second",
  email: "test@sts.com",
};

describe("UserService.findByIdOrThrow", () => {
  it("return user for provided id", async () => {
    const { userService } = makeUserService({ users: [aUser()] });

    const user = await userService.findByIdOrThrow(aUser().id);

    expect(user).toMatchObject({ id: aUser().id });
  });
  it("rejects with USER_NOT_FOUND if user is missing", async () => {
    const { userService } = makeUserService({ users: [] });

    await expectAppError(
      userService.findByIdOrThrow(input.email),
      "USER_NOT_FOUND",
    );
  });
});
