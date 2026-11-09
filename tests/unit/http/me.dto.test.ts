import { toMeResponseDto } from "#src/http/dtos/me-response.dto";
import { describe, expect, it } from "vite-plus/test";
import { aUser } from "../../builders/a-user";

describe("toCurrentUserDto", () => {
  it("sends only the public fields", () => {
    const dto = toMeResponseDto({
      currentUser: aUser({ passwordHash: "hashed:secret" }),
    });

    expect(Object.keys(dto).sort()).toEqual(["data", "success"].sort());
  });

  it("turns the verified dates into true/false", () => {
    const dto = toMeResponseDto({
      currentUser: aUser({
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: null,
      }),
    });
    expect(dto.data.currentUser).toMatchObject({
      emailVerified: true,
      phoneVerified: false,
    });
  });
});
