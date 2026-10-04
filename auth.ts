import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Provider ID, never email, is the stable account key for Vercel projects.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !account.access_token) return false;
      try {
        const response = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${account.access_token}`, Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (!response.ok) return false;
        const emails = await response.json() as {email:string;primary:boolean;verified:boolean}[];
        const verified = emails.find((entry) => entry.primary && entry.verified);
        if (!verified) return false;
        user.email = verified.email.toLowerCase();
        return true;
      } catch { return false; }
    },
    jwt({ token, account, user }) {
      if (account?.provider === "github") {
        token.sub = `github:${account.providerAccountId}`;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.sub?.startsWith("github:") ? token.sub : "";
      return session;
    },
  },
});
