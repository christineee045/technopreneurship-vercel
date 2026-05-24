import Item, { IItem } from "../models/Item";
import User from "../models/User";
import mongoose from "mongoose";
import { getEstimatedAvailableAt } from "./borrow-request.service";

export const createItem = async (itemData: Partial<IItem>): Promise<IItem> => {
  return Item.create(itemData);
};

export const getItems = async (): Promise<IItem[]> => {
  const items = await Item.find({
    $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
  }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatarAndAvailability(items);
};

export const getFeaturedItems = async (): Promise<IItem[]> => {
  const items = await Item.find({
    isFeatured: true,
    $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
  }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatarAndAvailability(items);
};

export const getItemById = async (id: string): Promise<IItem | null> => {
  const item = await Item.findOne({
    _id: id,
    $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
  });
  if (!item) return null;
  const enriched = await enrichItemsWithOwnerAvatarAndAvailability([item]);
  return enriched[0] ?? null;
};

export const getItemsByOwnerId = async (ownerId: string): Promise<IItem[]> => {
  const items = await Item.find({ ownerId }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatarAndAvailability(items);
};

export const updateItem = async (id: string, updateData: Partial<IItem>): Promise<IItem | null> => {
  return Item.findByIdAndUpdate(id, updateData, { new: true });
};

export const setItemApprovalStatus = async (
  id: string,
  approvalStatus: "pending" | "approved" | "rejected"
): Promise<IItem | null> => {
  return Item.findByIdAndUpdate(id, { approvalStatus }, { new: true });
};

export const deleteItem = async (id: string): Promise<boolean> => {
  const result = await Item.findByIdAndDelete(id);
  return !!result;
};

const enrichItemsWithOwnerAvatarAndAvailability = async (items: IItem[]): Promise<IItem[]> => {
  try {
    const userIds = [...new Set(items.map((item) => item.ownerId))];
    const itemIds = [...new Set(items.map((item) => item._id?.toString()).filter(Boolean) as string[])];

    const validObjectIds: mongoose.Types.ObjectId[] = [];
    userIds.forEach((id) => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        validObjectIds.push(new mongoose.Types.ObjectId(id));
      }
    });

    let users: Array<{ _id: mongoose.Types.ObjectId; avatar?: string; email?: string; phone?: string }> = [];
    if (validObjectIds.length > 0) {
      users = await User.find({ _id: { $in: validObjectIds } }, "avatar email phone").lean();
    }

    const avatarMap: Record<string, string> = {};
    const emailMap: Record<string, string> = {};
    const phoneMap: Record<string, string> = {};
    users.forEach((user) => {
      avatarMap[user._id.toString()] = user.avatar || "";
      if (user.email) emailMap[user._id.toString()] = user.email;
      if (user.phone) phoneMap[user._id.toString()] = user.phone;
    });

    const availabilityEntries = await Promise.all(
      itemIds.map(async (itemId) => [itemId, await getEstimatedAvailableAt(itemId)] as const)
    );
    const availabilityMap = new Map(availabilityEntries.filter((entry) => Boolean(entry[1])) as Array<readonly [string, string]>);

    return items.map((item) => {
      const plain = item.toObject ? item.toObject() : { ...item };
      const resolvedId = (plain._id || plain.id)?.toString?.() || plain.id || "";
      const estimatedAvailableAt = availabilityMap.get(resolvedId);

      return {
        ...plain,
        ownerAvatar: plain.ownerAvatar || avatarMap[item.ownerId] || undefined,
        ownerEmail: emailMap[item.ownerId] || plain.ownerEmail,
        ownerPhone: phoneMap[item.ownerId] || plain.ownerPhone,
        estimatedAvailableAt,
        availabilityBufferDays: estimatedAvailableAt ? 2 : undefined,
      } as IItem;
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return items;
  }
};
