import { describe, expect, it } from "vite-plus/test";
import { toCurrentUserDto } from "#src/http/dtos/current-user.dto";
import { aUser } from "../../builders/a-user";

describe("toCurrentUserDto", () => {
  it("sends only the public fields", () => {
    const dto = toCurrentUserDto(aUser({ passwordHash: "hashed:secret" }));

    expect(Object.keys(dto).sort()).toEqual(
      [
        "createdAt",
        "email",
        "emailVerified",
        "firstName",
        "id",
        "lastName",
        "phoneNumber",
        "phoneVerified",
        "role",
        "updatedAt",
      ].sort(),
    );
  });

  it("turns the verified dates into true/false", () => {
    const dto = toCurrentUserDto(
      aUser({ emailVerifiedAt: new Date(), phoneVerifiedAt: null }),
    );
    expect(dto).toMatchObject({ emailVerified: true, phoneVerified: false });
  });
});
