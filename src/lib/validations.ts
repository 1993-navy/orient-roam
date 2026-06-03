import { z } from "zod";

// Normalize emails so mobile keyboards' auto-capitalization / stray spaces
// can't cause sign-up and later sign-in to disagree.
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email("Enter a valid email"));

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  email: emailField,
  password: z.string().min(6, "At least 6 characters"),
  homeCountry: z.string().max(60).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export const meetupSchema = z.object({
  type: z.enum(["MEAL", "SHOPPING", "TRIP"]),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  placeId: z.string().optional().or(z.literal("")),
  maxPeople: z.coerce.number().int().min(2).max(50).default(4),
});

export const PLACE_CATEGORIES = [
  "FOOD",
  "ATTRACTION",
  "HOTEL",
  "NATURE",
  "NIGHTLIFE",
  "SHOPPING",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
