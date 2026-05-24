import User, { IUser } from "../models/User";

export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  return User.create(userData);
};

export const getUsers = async (): Promise<IUser[]> => {
  return User.find().sort({ createdAt: -1 });
};

export const getUserById = async (id: string): Promise<IUser | null> => {
  return User.findById(id);
};

export const updateUserProfile = async (
  id: string,
  updateData: Partial<IUser>
): Promise<IUser | null> => {
  const allowedFields = ["name", "avatar", "phone"];
  const sanitizedData: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in updateData) {
      sanitizedData[key] = updateData[key as keyof IUser];
    }
  }

  return User.findByIdAndUpdate(id, sanitizedData, {
    new: true,
    runValidators: true,
  });
};
