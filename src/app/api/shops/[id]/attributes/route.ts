
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ShopeeAuthService } from "@/lib/services/shopee-auth"
import { ShopeeClient } from "@/lib/shopee"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth()
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

        // URL Params
        const url = new URL(req.url)
        const categoryId = url.searchParams.get("categoryId")

        if (!categoryId) return new NextResponse("Missing categoryId", { status: 400 })

        // Get Shop
        const { id } = await params
        const shop = await prisma.shop.findUnique({
            where: { id, userId: session.user.id }
        })

        if (!shop) return new NextResponse("Shop Not Found", { status: 404 })

        // 1. Get Access Token
        const accessToken = await ShopeeAuthService.getValidAccessToken(shop.id)

        // 2. Fetch Attributes Tree
        const res = await ShopeeClient.getAttributeTree(accessToken, Number(shop.platformShopId), Number(categoryId))

        if (res.error) {
            return new NextResponse(`Shopee Error: ${res.error} - ${res.message}`, { status: 500 })
        }

        // Parse Response according to User's App Script logic
        const list = res.response?.list || []
        if (list.length === 0) return NextResponse.json([])

        const attributeTree = list[0].attribute_tree || []

        // Transform to cleaner format for Frontend
        const cleanedAttributes = attributeTree.map((attr: any) => {
            // Get VN Name
            let displayName = attr.name
            if (attr.attribute_info?.multi_lang) {
                const vn = attr.attribute_info.multi_lang.find((l: any) => l.language === 'vi')
                if (vn) displayName = vn.value
            }

            // Process Values
            const values = attr.attribute_value_list?.map((val: any) => {
                let valName = val.original_value_name || val.display_value_name || val.value_id
                if (val.multi_lang) {
                    const valVn = val.multi_lang.find((l: any) => l.language === 'vi')
                    if (valVn) valName = valVn.value
                }
                return {
                    value_id: val.value_id,
                    original_value_name: val.original_value_name,
                    display_value_name: valName
                }
            }) || []

            return {
                attribute_id: attr.attribute_id,
                original_name: attr.name,
                display_attribute_name: displayName,
                is_mandatory: attr.mandatory,
                input_type: attr.input_type || (values.length > 0 ? 'DROP_DOWN' : 'TEXT_FILED'), // Fallback
                attribute_value_list: values,
                input_validation_type: attr.input_validation_type,
                format_type: attr.format_type,
                date_format_type: attr.date_format_type
            }
        })

        return NextResponse.json(cleanedAttributes)

    } catch (error: any) {
        console.error("[Attributes_GET]", error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
