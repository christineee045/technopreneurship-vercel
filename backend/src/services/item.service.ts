import Item, { IItem } from "../models/Item";
import User, { IUser } from "../models/User";
import mongoose from "mongoose";

export const createItem = async (itemData: Partial<IItem>): Promise<IItem> => {
  return Item.create(itemData);
};

export const getItems = async (): Promise<IItem[]> => {
  const items = await Item.find({
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
  }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatar(items);
};

export const getFeaturedItems = async (): Promise<IItem[]> => {
  const items = await Item.find({
    isFeatured: true,
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
  }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatar(items);
};

export const getItemById = async (id: string): Promise<IItem | null> => {
  const item = await Item.findOne({
    _id: id,
    $or: [{ approvalStatus: 'approved' }, { approvalStatus: { $exists: false } }],
  });
  if (!item) return null;
  const enriched = await enrichItemsWithOwnerAvatar([item]);
  return enriched[0] ?? null;
};

export const getItemsByOwnerId = async (ownerId: string): Promise<IItem[]> => {
  const items = await Item.find({ ownerId }).sort({ createdAt: -1 });
  return enrichItemsWithOwnerAvatar(items);
};

export const updateItem = async (id: string, updateData: Partial<IItem>): Promise<IItem | null> => {
  return Item.findByIdAndUpdate(id, updateData, { new: true });
};

export const setItemApprovalStatus = async (
  id: string,
  approvalStatus: 'pending' | 'approved' | 'rejected'
): Promise<IItem | null> => {
  return Item.findByIdAndUpdate(id, { approvalStatus }, { new: true });
};

export const deleteItem = async (id: string): Promise<boolean> => {
  const result = await Item.findByIdAndDelete(id);
  return !!result;
};

// Helper: enrich items with ownerAvatar from User collection if missing
const enrichItemsWithOwnerAvatar = async (items: IItem[]): Promise<IItem[]> => {
  try {
    const userIds = [...new Set(items.map(i => i.ownerId))];

    // Only include IDs that are valid ObjectId strings
    const validObjectIds: mongoose.Types.ObjectId[] = [];

    userIds.forEach(id => {
      if (mongoose.Types.ObjectId.isValid(id)) {
        validObjectIds.push(new mongoose.Types.ObjectId(id));
      }
    });

    let users: any[] = [];
    if (validObjectIds.length > 0) {
      users = await User.find({ _id: { $in: validObjectIds } }, "avatar").lean();
    }

    const avatarMap: Record<string, string> = {};
    users.forEach((u: any) => {
      avatarMap[u._id.toString()] = u.avatar;
    });

    return items.map(item => {
      if (!item.ownerAvatar && avatarMap[item.ownerId]) {
        const plain = item.toObject ? item.toObject() : { ...item };
        return { ...plain, ownerAvatar: avatarMap[item.ownerId] } as IItem;
      }
      return item;
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return items;
  }
};
