declare namespace Express {
  interface Request {
    user?: import("./src/generated/prisma/client").User;
  }
}
