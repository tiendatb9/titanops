import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname === '/' || // Root is dashboard
                nextUrl.pathname.startsWith('/products') ||
                nextUrl.pathname.startsWith('/orders') ||
                nextUrl.pathname.startsWith('/shops') ||
                nextUrl.pathname.startsWith('/inventory') ||
                nextUrl.pathname.startsWith('/settings');

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                return Response.redirect(new URL('/', nextUrl))
            }
            return true
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        },
        async jwt({ token }) {
            return token
        }
    },
    providers: [], // Providers configured in auth.ts
} satisfies NextAuthConfig
