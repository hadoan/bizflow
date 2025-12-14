import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(db) as Adapter,
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
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(password, user.password);

        if (!isPasswordValid) {
          return null;
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

export async function getDefaultSpace(userId: string, preferredSpaceId?: string | null) {
  const spaces = await getUserSpaces(userId);
  if (preferredSpaceId) {
    const match = spaces.find((s) => s.id === preferredSpaceId);
    if (match) return match;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { defaultSpaceId: true },
  });

  if (user?.defaultSpaceId) {
    const match = spaces.find((s) => s.id === user.defaultSpaceId);
    if (match) return match;
  }

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

/**
 * Get the default space for a user (alias for getDefaultSpace)
 * In V1, each user has one space
 */
export async function getDefaultSpaceForUser(userId: string) {
  return getDefaultSpace(userId);
}

/**
 * Get the current user and their default space
 * Convenience function for API handlers
 * @returns Object with user and space, or throws if not authenticated
 */
export async function getCurrentUserWithSpace() {
  const user = await requireAuth();

  if (!user.id) {
    throw new Error("User ID not found in session");
  }

  const space = await getDefaultSpace(user.id);

  if (!space) {
    throw new Error("No space found for user");
  }

  return { user, space };
}
