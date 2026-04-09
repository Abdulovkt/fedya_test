import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email);
        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, email))
          .limit(1);
        if (!user) return null;
        const ok = await compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        return { id: String(user.id), email: user.email };
      },
    }),
  ],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ("email" in user && user.email) token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.email = String(token.email ?? "");
      }
      return session;
    },
  },
});
