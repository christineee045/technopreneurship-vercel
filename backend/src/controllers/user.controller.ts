import type { Request, Response } from "express";
import { createUser, getUsers, getUserById, updateUserProfile } from "../services/user.service";
import { getOwnerReviewStats } from "../services/review.service";

export const createUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;
    const user = await createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error });
  }
};

export const getUsersHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error });
  }
};

export const getUserByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { rating, reviewCount } = await getOwnerReviewStats(user._id.toString());

    res.json({
      ...user.toObject(),
      id: user._id.toString(),
      rating,
      reviewCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error });
  }
};

export const updateUserProfileHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const updateData: Record<string, unknown> = {};

    // Only include fields that are explicitly provided (even if empty string to allow clearing)
    if ('name' in req.body) updateData.name = req.body.name;
    if ('avatar' in req.body) updateData.avatar = req.body.avatar;
    if ('phone' in req.body) updateData.phone = req.body.phone;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "Provide at least one field to update (name, avatar, or phone)" });
      return;
    }

    const updatedUser = await updateUserProfile(userId, updateData as Partial<any>);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error });
  }
};
