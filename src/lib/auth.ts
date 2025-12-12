import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
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

export async function getCurrentUser(req: Request) {
  // This would be implemented using getServerSession in route handlers
  // For now, this is a placeholder
  return null;
}

export async function requireAuth(req: Request) {
  const user = await getCurrentUser(req);
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
