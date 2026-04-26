import { z } from "zod";

const shopBaseSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  shopAddress: z.string().min(1, "Shop address is required"),
  city: z.string().min(1, "City is required"),
  shopType: z.string().min(1, "Shop type is required"),
  email: z.string().email("Invalid email"),
  selectedPlanId: z.number().int().min(1, "Plan is required"),
});

export const addShopSchema = shopBaseSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const editShopSchema = shopBaseSchema.extend({
  status: z.enum(["Active", "Inactive"]),
});

export type AddShopFormData = z.infer<typeof addShopSchema>;
export type EditShopFormData = z.infer<typeof editShopSchema>;
