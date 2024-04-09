import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");

const maxAge = 30 * 24 * 60 * 60; // 30 days

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html(params: { url: string; host: string; }) {
    const { url, host } = params;

    const escapedHost = host.replace(/\./g, "&#8203;.");

    const brandColor = "#346df1";
    const color = {
        background: "#f9f9f9",
        text: "#444",
        mainBackground: "#fff",
        buttonBackground: brandColor,
        buttonBorder: brandColor,
        buttonText: "#fff",
    };

    return `
  <body style="background: ${color.background}; padding-top: 40px;">
    <table width="100%" border="0" cellspacing="20" cellpadding="0"
      style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
      <tr>
        <td align="center"
          style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
          Sign in to <strong>${escapedHost}</strong>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px 0;">
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                  target="_blank"
                  style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText
        }; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder
        }; display: inline-block; font-weight: bold;">Sign
                  in</a></td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center"
          style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text
        };">
          If you did not request this email you can safely ignore it.
        </td>
      </tr>
    </table>
    <br><small style="color:${color.background}">Message sent on ${new Date().toString()} </small>
  </body>
  `;
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
    return `Sign in to ${host}\n${url}\n\n`;
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: process.env.EMAIL_SERVER_PORT,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
            maxAge: 3600,
            async sendVerificationRequest(params) {
                const { identifier, url, provider } = params;
                const { host } = new URL(url);
                // NOTE: You are not required to use `nodemailer`, use whatever you want.
                const transport = nodemailer.createTransport(provider.server);
                const result = await transport.sendMail({
                    to: identifier,
                    from: provider.from,
                    subject: `Sign in to ${host}`,
                    text: text({ url, host }),
                    html: html({ url, host }),
                });
                const failed = result.rejected.concat(result.pending).filter(Boolean);
                if (failed.length) {
                    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
                }
            },
        }),
        // GoogleProvider({
        //     clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID : "",
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET : "",
        // }),
    ],
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
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
