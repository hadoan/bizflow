import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(db) as any,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error("Email and password required");
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email as string,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export NextAuth handlers and helpers
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

/**
 * Get the current authenticated user from the session
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Require authentication, throw error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getUserSpaces(userId: string) {
  const memberships = await db.spaceMembership.findMany({
    where: { userId },
    include: {
      space: true,
    },
  });

  return memberships.map((m) => m.space);
}

export async function getDefaultSpace(userId: string) {
  const spaces = await getUserSpaces(userId);
  return spaces[0] ?? null;
}

export async function hasSpaceAccess(userId: string, spaceId: string): Promise<boolean> {
  const membership = await db.spaceMembership.findUnique({
    where: {
      userId_spaceId: {
        userId,
        spaceId,
      },
    },
  });

  return !!membership;
}

export async function requireSpaceAccess(userId: string, spaceId: string) {
  const hasAccess = await hasSpaceAccess(userId, spaceId);
  if (!hasAccess) {
    throw new Error("Access denied to this space");
  }
}
