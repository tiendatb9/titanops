
import { ShopeeClient } from "@/lib/shopee"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic' // Force dynamic

export async function GET() {
    try {
        const url = ShopeeClient.generateAuthUrl()
        return NextResponse.redirect(url)
    } catch (error) {
        console.error("[SHOPEE_AUTH]", error)
        return new NextResponse("Shopee Config Error", { status: 500 })
    }
}
