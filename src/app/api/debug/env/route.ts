import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || "MISSING"
    // Mask the password
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@")

    return NextResponse.json({
        env: process.env.NODE_ENV,
        databaseUrl: maskedUrl, // Reveal host/db name but not password
        verifier: "Is this the DB you are looking at?",
        timestamp: new Date().toISOString()
    })
}
