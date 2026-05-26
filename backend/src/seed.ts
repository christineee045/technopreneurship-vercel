import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { resolve } from "path";
import User from "./models/User";
import Item from "./models/Item";
import BorrowRequest from "./models/BorrowRequest";

dotenv.config({ path: resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}

const mockUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@platform.com",
    password: "admin123",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isAdmin: true,
    joinDate: "2024-01-15",
    rating: 4.8,
    reviewCount: 24,
  },
  {
    id: "2",
    name: "Alex Johnson",
    email: "alex@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-01-20",
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: "3",
    name: "Sarah Martinez",
    email: "sarah@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-01-20",
    rating: 4.9,
    reviewCount: 18,
  },
  {
    id: "4",
    name: "Miguel Santos",
    email: "miguel@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-02-10",
    rating: 4.7,
    reviewCount: 15,
  },
  {
    id: "5",
    name: "Lisa Chen",
    email: "lisa@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-02-15",
    rating: 5.0,
    reviewCount: 12,
  },
  {
    id: "6",
    name: "Carlos Rivera",
    email: "carlos@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-03-05",
    rating: 4.6,
    reviewCount: 10,
  },
  {
    id: "7",
    name: "Jenny Park",
    email: "jenny@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-03-20",
    rating: 4.8,
    reviewCount: 14,
  },
  {
    id: "8",
    name: "David Lee",
    email: "david@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-04-01",
    rating: 4.7,
    reviewCount: 11,
  },
  {
    id: "9",
    name: "Tom Wilson",
    email: "tom@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
    isAdmin: false,
    joinDate: "2024-04-15",
    rating: 4.5,
    reviewCount: 9,
  },
];

const mockItems = [
  {
    title: "DeWalt Cordless Drill",
    description:
      "Professional-grade 20V cordless drill with two batteries and charger. Perfect for home projects and repairs.",
    category: "Power Tools",
    condition: "Excellent",
    rentalFeePerDay: 120,
    deposit: 500,
    images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop"],
    ownerId: "3",
    ownerName: "Sarah Martinez",
    ownerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    ownerRating: 4.9,
    location: "Makati, Metro Manila",
    available: true,
    isFeatured: true,
  },
  {
    title: "Folding Ladder - 6ft",
    description:
      "Sturdy aluminum folding ladder. Can support up to 150kg. Great for painting, cleaning, or minor repairs.",
    category: "Ladders & Scaffolding",
    condition: "Good",
    rentalFeePerDay: 50,
    deposit: 300,
    images: ["https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=600&fit=crop"],
    ownerId: "3",
    ownerName: "Miguel Santos",
    ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    ownerRating: 4.7,
    location: "Quezon City",
    available: true,
    isFeatured: false,
  },
  {
    title: "Party Tent - 10x10ft",
    description:
      "White pop-up canopy tent perfect for birthday parties, small gatherings, or outdoor events. Easy to set up.",
    category: "Party & Events",
    condition: "Excellent",
    rentalFeePerDay: 250,
    deposit: 1000,
    images: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop"],
    ownerId: "4",
    ownerName: "Lisa Chen",
    ownerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    ownerRating: 5.0,
    location: "Pasig City",
    available: true,
    isFeatured: true,
  },
  {
    title: "Lawn Mower - Electric",
    description:
      "Eco-friendly electric lawn mower with grass collection bag. Quiet and easy to use for small to medium lawns.",
    category: "Garden Equipment",
    condition: "Good",
    rentalFeePerDay: 180,
    deposit: 800,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"],
    ownerId: "5",
    ownerName: "Carlos Rivera",
    ownerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    ownerRating: 4.6,
    location: "Taguig City",
    available: false,
    isFeatured: false,
  },
  {
    title: "Camping Tent - 4 Person",
    description:
      "Waterproof camping tent with easy setup. Includes carry bag and stakes. Perfect for family camping trips.",
    category: "Camping & Outdoor",
    condition: "Excellent",
    rentalFeePerDay: 220,
    deposit: 1200,
    images: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop"],
    ownerId: "6",
    ownerName: "Jenny Park",
    ownerAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    ownerRating: 4.8,
    location: "Mandaluyong",
    available: true,
    isFeatured: true,
  },
  {
    title: "Pressure Washer",
    description:
      "High-powered pressure washer for cleaning driveways, patios, and vehicles. Includes multiple nozzle attachments.",
    category: "Power Tools",
    condition: "Good",
    rentalFeePerDay: 160,
    deposit: 1500,
    images: ["https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop"],
    ownerId: "3",
    ownerName: "Sarah Martinez",
    ownerAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    ownerRating: 4.9,
    location: "Makati, Metro Manila",
    available: true,
    isFeatured: false,
  },
  {
    title: "Sound System - Portable",
    description:
      "Professional portable PA system with microphones. Great for parties, presentations, or small events.",
    category: "Party & Events",
    condition: "Excellent",
    rentalFeePerDay: 300,
    deposit: 2000,
    images: ["https://images.unsplash.com/photo-1519508234439-4f23643125c1?w=800&h=600&fit=crop"],
    ownerId: "7",
    ownerName: "David Lee",
    ownerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    ownerRating: 4.7,
    location: "BGC, Taguig",
    available: true,
    isFeatured: false,
  },
  {
    title: "Leaf Blower/Vacuum",
    description:
      "2-in-1 electric leaf blower and vacuum with mulching capability. Perfect for yard cleanup and maintenance.",
    category: "Garden Equipment",
    condition: "Good",
    rentalFeePerDay: 90,
    deposit: 600,
    images: ["https://images.unsplash.com/photo-1617791160588-241658c0f566?w=800&h=600&fit=crop"],
    ownerId: "3",
    ownerName: "Miguel Santos",
    ownerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    ownerRating: 4.7,
    location: "Quezon City",
    available: true,
    isFeatured: false,
  },
  {
    title: "Heavy-Duty Ladder - 12ft",
    description:
      "Commercial-grade 12ft ladder suitable for painting, repairs, and reaching high ceilings safely.",
    category: "Ladders & Scaffolding",
    condition: "Excellent",
    rentalFeePerDay: 50,
    deposit: 400,
    images: ["https://images.unsplash.com/photo-1597006460675-1f3b6b8f8f46?w=800&h=600&fit=crop"],
    ownerId: "2",
    ownerName: "Alex Johnson",
    ownerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    ownerRating: 4.8,
    location: "Pasay City",
    available: true,
    isFeatured: false,
  },
];

const mockBorrowRequests = [
  {
    itemId: "2",
    itemTitle: "Folding Ladder - 6ft",
    itemImage: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=300&fit=crop",
    borrowerId: "2",
    borrowerName: "Alex Johnson",
    borrowerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    ownerId: "3",
    ownerName: "Miguel Santos",
    startDate: "2026-03-25",
    endDate: "2026-03-27",
    status: "Pending",
    message: "Need it for painting my living room. Will take good care of it!",
  },
  {
    itemId: "3",
    itemTitle: "Party Tent - 10x10ft",
    itemImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop",
    borrowerId: "2",
    borrowerName: "Alex Johnson",
    borrowerAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    ownerId: "4",
    ownerName: "Lisa Chen",
    startDate: "2026-03-30",
    endDate: "2026-04-01",
    status: "Approved",
    message: "Planning a birthday party for my daughter. The tent would be perfect!",
  },
  {
    itemId: "1",
    itemTitle: "DeWalt Cordless Drill",
    itemImage: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop",
    borrowerId: "8",
    borrowerName: "Tom Wilson",
    borrowerAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
    ownerId: "3",
    ownerName: "Sarah Martinez",
    startDate: "2026-03-18",
    endDate: "2026-03-20",
    status: "Returned",
    message: "Need to assemble some furniture.",
    returnedAt: "2026-03-20",
  },
  {
    itemId: "9",
    itemTitle: "Heavy-Duty Ladder - 12ft",
    itemImage: "https://images.unsplash.com/photo-1597006460675-1f3b6b8f8f46?w=400&h=300&fit=crop",
    borrowerId: "8",
    borrowerName: "Tom Wilson",
    borrowerAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop",
    ownerId: "2",
    ownerName: "Alex Johnson",
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    status: "Pending",
    message: "I need the ladder for a quick ceiling paint job. I will return it clean and on time.",
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Item.deleteMany({});
    await BorrowRequest.deleteMany({});
    console.log("Cleared existing collections");

    // Hash passwords for users before inserting
    const hashedUsers = await Promise.all(
      mockUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    // Insert mock data
    const insertedUsers = await User.insertMany(hashedUsers);
    console.log(`Inserted ${insertedUsers.length} users`);

    const insertedItems = await Item.insertMany(mockItems);
    console.log(`Inserted ${insertedItems.length} items`);

    const insertedRequests = await BorrowRequest.insertMany(mockBorrowRequests);
    console.log(`Inserted ${insertedRequests.length} borrow requests`);

    console.log("Database seeding completed successfully!");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
