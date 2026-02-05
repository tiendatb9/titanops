
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic' // Force dynamic

export async function GET() {
    try {
        const url = TikTokClient.generateAuthUrl()
        return NextResponse.redirect(url)
    } catch (error) {
        console.error("[TIKTOK_AUTH]", error)
        return new NextResponse("TikTok Config Error", { status: 500 })
    }
}
