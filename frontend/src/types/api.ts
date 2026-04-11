export type Role = "student" | "mentor" | "admin";
export type AvailabilityStatus = "available" | "busy" | "offline";

export interface MentorListItem {
  id: string;
  fullName: string;
  bio: string;
  expertise: string[];
  availabilityStatus: AvailabilityStatus;
  photoUrl: string;
  averageRating: number;
  ratingCount: number;
  isApproved: boolean;
}

export interface MentorReview {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  mentorId: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  status: string;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  userId: string;
  role: "owner" | "admin" | "member";
  fullName: string;
  appRole?: Role | null;
}

export interface ConversationItem {
  id: string;
  type: "direct" | "group";
  name: string;
  rawName: string | null;
  myRole: "owner" | "admin" | "member";
  members: ConversationMember[];
  lastMessage: ConversationMessage | null;
  updatedAt: string;
  createdAt: string;
  closedAt?: string | null;
  closedByStudentId?: string | null;
  canSendMessages?: boolean;
  chatSessionEndsAt?: string | null;
  activeBookingId?: string | null;
  studentCanEndSession?: boolean;
}

