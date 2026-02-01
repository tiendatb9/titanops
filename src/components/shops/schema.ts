import * as z from "zod"

export enum Platform {
    SHOPEE = "SHOPEE",
    TIKTOK = "TIKTOK",
    LAZADA = "LAZADA",
    TIKI = "TIKI",
    SAPO = "SAPO",
    PANCAKE = "PANCAKE",
    WOO = "WOO"
}



export const shopFormSchema = z.object({
    name: z.string().min(2, {
        message: "Tên shop phải có ít nhất 2 ký tự.",
    }),
    platform: z.nativeEnum(Platform),
    // Hybrid Config: BYOA (Marketplaces)
    useCustomApp: z.boolean().default(false),
    appKey: z.string().default(""),
    appSecret: z.string().default(""),

    // Platform Specific: Sapo
    sapoDomain: z.string().default(""),
    sapoAccessToken: z.string().default(""),
    sapoLocationId: z.string().default(""),
    sapoAccountId: z.string().default(""),

    // Platform Specific: Pancake
    pancakeApiKey: z.string().default(""),
    pancakeShopId: z.string().default(""),

    // Platform Specific: WooCommerce
    wooDomain: z.string().default(""),
    wooConsumerKey: z.string().default(""),
    wooConsumerSecret: z.string().default(""),

}).superRefine((data, ctx) => {
    // 1. Validate Marketplaces (Shopee/TikTok/Lazada/Tiki)
    if ([Platform.SHOPEE, Platform.TIKTOK, Platform.LAZADA, Platform.TIKI].includes(data.platform)) {
        if (data.useCustomApp) {
            if (!data.appKey) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập App Key", path: ["appKey"] });
            if (!data.appSecret) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Vui lòng nhập App Secret", path: ["appSecret"] });
        }
    }

    // 2. Validate Sapo
    if (data.platform === Platform.SAPO) {
        if (!data.sapoDomain) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Domain (vd: store.mysapo.net)", path: ["sapoDomain"] });
        if (!data.sapoAccessToken) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Access Token", path: ["sapoAccessToken"] });
        if (!data.sapoLocationId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Location ID", path: ["sapoLocationId"] });
        if (!data.sapoAccountId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Account ID", path: ["sapoAccountId"] });
    }

    // 3. Validate Pancake
    if (data.platform === Platform.PANCAKE) {
        if (!data.pancakeApiKey) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu API Key", path: ["pancakeApiKey"] });
        if (!data.pancakeShopId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Shop ID", path: ["pancakeShopId"] });
    }

    // 4. Validate WooCommerce
    if (data.platform === Platform.WOO) {
        if (!data.wooDomain) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Domain Website", path: ["wooDomain"] });
        if (!data.wooConsumerKey) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Consumer Key", path: ["wooConsumerKey"] });
        if (!data.wooConsumerSecret) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Thiếu Consumer Secret", path: ["wooConsumerSecret"] });
    }
})

export type ShopFormValues = z.infer<typeof shopFormSchema>
