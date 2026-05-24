export type CategoryType = "nature" | "culture" | "monument" | "active" | "wellness";
export type DifficultyType = "easy" | "medium" | "hard";
export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  createdAt: any; // Firebase Timestamp or ISO date string
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Sight {
  id: string; // Document ID/slug
  title: string;
  shortDescription: string;
  description: string; // Markdown supported
  image: string;
  category: CategoryType;
  location: string;
  coordinates: Coordinates;
  rating: number;
  reviewsCount: number;
  createdBy: string;
  createdAt: any;
}

export interface Route {
  id: string; // Document ID/slug
  title: string;
  description: string; // Detailed itinerary description
  duration: string; // e.g., "1 день", "3 часа", "2 дня"
  difficulty: DifficultyType;
  image: string;
  sightIds: string[]; // List of Sight IDs included in this itinerary
  createdBy: string;
  createdAt: any;
}

export interface Review {
  id?: string; // Auto-generated ID
  sightId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1 to 5 stars
  text: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}
