import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import * as bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user: oauthUser, account }) {
      if (account?.provider === "google" && oauthUser.email) {
        const u = await prisma.user.upsert({
          where: { email: oauthUser.email },
          create: {
            email: oauthUser.email,
            name: oauthUser.name ?? undefined,
            role: "customer",
            authProvider: "google",
            emailVerifiedAt: new Date(),
          },
          update: {
            emailVerifiedAt: new Date(),
          },
        });
        (oauthUser as unknown as { id: string }).id = u.id;
        (oauthUser as unknown as { role: string }).role = u.role;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { role?: string }).role ?? "customer";
      }
      if (account?.provider === "google" && token.sub && !token.id) {
        const u = await prisma.user.findFirst({
          where: { email: token.email ?? undefined },
        });
        if (u) {
          token.id = u.id;
          token.role = u.role;
        }
      }
      if (token.id) {
        const u = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        if (u) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id ?? "";
        (session.user as { role: string }).role = token.role ?? "customer";
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        if (user.emailVerifiedAt == null) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
};

export function isStaff(role: string) {
  return role === "staff" || role === "admin";
}
