import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        userId: string | undefined;
        username: string | null | undefined;
        user: {
            role: string | undefined;
            image: string | null | undefined;
        } & DefaultSession["user"];
    }

    interface User {
        role: string | undefined;
        username: string | undefined;
        disabled: boolean | undefined;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string | undefined;
    }
}
