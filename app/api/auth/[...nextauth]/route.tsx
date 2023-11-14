import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID : "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET : "",
        }),
    ],
    session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
    secret: process.env.NEXTAUTH_SECRET,
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
        maxAge: 60 * 60 * 24 * 30,
    },
    callbacks: {
        async session({ session, token, user }) {
            // Send properties to the client, like an access_token and user id from a provider.
            // session.accessToken = token.accessToken
            // console.log({ session, token, user });
            if (token) {
                session.userId = token.sub;
                session.username = token.name;
                session.user.role = token.role;
                session.user.image = token.picture;

                // user.id = token.id;
                // user.username = token.name;
                // user.role = token.role;
            } else if (user) {
                session.userId = user.id;
                session.username = user.name ? user.name : user.username;
                session.user.role = user.role;
            }
            return Promise.resolve(session);
        },
        async jwt({ token, user }) {
            // console.log({ token, user });
            return await { ...token, ...(user && { role: user.role }) };
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
