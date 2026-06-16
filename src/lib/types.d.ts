import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ATHLETE" | "COACH";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ATHLETE" | "COACH";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ATHLETE" | "COACH";
  }
}
