// MentorConnect — Mock Data

export type Role = "student" | "mentor" | "admin";
export type AvailabilityStatus = "Available" | "Busy" | "Offline";
export type BookingStatus = "Confirmed" | "Cancelled" | "Pending";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  bio: string;
  expertise: string[];
  availability: AvailabilityStatus;
  rating: number;
  reviewCount: number;
  avatarInitials: string;
  course?: string;
}

export interface TimeSlot {
  id: string;
  mentorId: string;
  date: string;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export interface Booking {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
}

export interface Review {
  id: string;
  mentorId: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantInitials: string;
  lastMessage: string;
  lastTimestamp: string;
}

export interface PendingMentor {
  id: string;
  name: string;
  email: string;
  registeredDate: string;
}

export interface ReviewModeration {
  id: string;
  mentorName: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
  hidden: boolean;
}

// ─── Mock Current User ─────────────────────────────────────────────────────────
export const currentUser: User = {
  id: "u1",
  name: "Alex Murphy",
  email: "alex.murphy@student.ie",
  role: "student",
  avatarInitials: "AM",
};

// To simulate a mentor, uncomment:
// export const currentUser: User = {
//   id: "m1",
//   name: "Dr. Sarah Chen",
//   email: "s.chen@mumail.ie",
//   role: "mentor",
//   avatarInitials: "SC",
// };

// To simulate admin, uncomment:
// export const currentUser: User = {
//   id: "a1",
//   name: "Admin User",
//   email: "admin@mumail.ie",
//   role: "admin",
//   avatarInitials: "AU",
// };

// ─── Mentors ────────────────────────────────────────────────────────────────────
export const mentors: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Sarah Chen",
    email: "s.chen@mumail.ie",
    bio: "PhD in Computer Science from MIT. Currently a lecturer in the CS department with a focus on machine learning and distributed systems. I enjoy helping students navigate their academic journey and career paths in tech.",
    expertise: ["Machine Learning", "Python", "Distributed Systems"],
    availability: "Available",
    rating: 4.8,
    reviewCount: 24,
    avatarInitials: "SC",
  },
  {
    id: "m2",
    name: "Prof. James O'Brien",
    email: "j.obrien@mumail.ie",
    bio: "15 years of industry experience at Google and Microsoft before returning to academia. I specialise in software architecture, agile methodologies, and helping students break into the industry.",
    expertise: ["Software Architecture", "Agile", "Career Guidance"],
    availability: "Available",
    rating: 4.6,
    reviewCount: 31,
    avatarInitials: "JO",
  },
  {
    id: "m3",
    name: "Dr. Priya Nair",
    email: "p.nair@mumail.ie",
    bio: "Research focus on cybersecurity and cryptography. I mentor students interested in security engineering, CTF competitions, and academic research in the field.",
    expertise: ["Cybersecurity", "Cryptography", "Research Methods"],
    availability: "Busy",
    rating: 4.9,
    reviewCount: 18,
    avatarInitials: "PN",
  },
  {
    id: "m4",
    name: "Dr. Tom Walsh",
    email: "t.walsh@mumail.ie",
    bio: "Former startup founder, now teaching entrepreneurship and product management. Passionate about helping students turn ideas into real products.",
    expertise: ["Product Management", "Entrepreneurship", "UX Design"],
    availability: "Available",
    rating: 4.5,
    reviewCount: 12,
    avatarInitials: "TW",
  },
  {
    id: "m5",
    name: "Dr. Aoife Kelly",
    email: "a.kelly@mumail.ie",
    bio: "Lecturer in Data Science and Statistics. I help students with their dissertation research, data analysis, and building a strong quantitative foundation.",
    expertise: ["Data Science", "Statistics", "R", "Dissertation Support"],
    availability: "Offline",
    rating: 4.7,
    reviewCount: 9,
    avatarInitials: "AK",
  },
  {
    id: "m6",
    name: "Dr. Marcus Hill",
    email: "m.hill@mumail.ie",
    bio: "Specialist in web technologies and cloud infrastructure. I mentor students on full-stack development, DevOps practices, and building scalable systems.",
    expertise: ["Web Development", "Cloud", "DevOps"],
    availability: "Available",
    rating: 4.4,
    reviewCount: 16,
    avatarInitials: "MH",
  },
];

// ─── Time Slots ─────────────────────────────────────────────────────────────────
export const timeSlots: TimeSlot[] = [
  { id: "ts1", mentorId: "m1", date: "2026-04-07", startTime: "10:00", endTime: "10:50", booked: false },
  { id: "ts2", mentorId: "m1", date: "2026-04-08", startTime: "14:00", endTime: "14:50", booked: false },
  { id: "ts3", mentorId: "m1", date: "2026-04-10", startTime: "11:00", endTime: "11:50", booked: true },
  { id: "ts4", mentorId: "m2", date: "2026-04-07", startTime: "09:00", endTime: "09:50", booked: false },
  { id: "ts5", mentorId: "m2", date: "2026-04-09", startTime: "15:00", endTime: "15:50", booked: false },
  { id: "ts6", mentorId: "m3", date: "2026-04-08", startTime: "13:00", endTime: "13:50", booked: false },
  { id: "ts7", mentorId: "m4", date: "2026-04-11", startTime: "10:00", endTime: "10:50", booked: false },
  { id: "ts8", mentorId: "m4", date: "2026-04-12", startTime: "16:00", endTime: "16:50", booked: false },
  { id: "ts9", mentorId: "m6", date: "2026-04-07", startTime: "11:00", endTime: "11:50", booked: false },
  { id: "ts10", mentorId: "m6", date: "2026-04-09", startTime: "14:00", endTime: "14:50", booked: false },
];

// ─── Bookings ───────────────────────────────────────────────────────────────────
export const bookings: Booking[] = [
  {
    id: "b1",
    mentorId: "m1",
    mentorName: "Dr. Sarah Chen",
    studentId: "u1",
    studentName: "Alex Murphy",
    date: "2026-04-10",
    startTime: "11:00",
    endTime: "11:50",
    status: "Confirmed",
  },
  {
    id: "b2",
    mentorId: "m2",
    mentorName: "Prof. James O'Brien",
    studentId: "u1",
    studentName: "Alex Murphy",
    date: "2026-03-28",
    startTime: "09:00",
    endTime: "09:50",
    status: "Confirmed",
  },
  {
    id: "b3",
    mentorId: "m3",
    mentorName: "Dr. Priya Nair",
    studentId: "u1",
    studentName: "Alex Murphy",
    date: "2026-03-15",
    startTime: "13:00",
    endTime: "13:50",
    status: "Cancelled",
  },
  {
    id: "b4",
    mentorId: "m1",
    mentorName: "Dr. Sarah Chen",
    studentId: "u2",
    studentName: "Cian Doyle",
    date: "2026-04-11",
    startTime: "10:00",
    endTime: "10:50",
    status: "Confirmed",
  },
];

// ─── Reviews ────────────────────────────────────────────────────────────────────
export const reviews: Review[] = [
  {
    id: "r1",
    mentorId: "m1",
    studentName: "Liam Byrne",
    rating: 5,
    comment: "Sarah is an exceptional mentor. She helped me understand neural networks in a way no textbook could. Highly recommended.",
    date: "2026-03-10",
  },
  {
    id: "r2",
    mentorId: "m1",
    studentName: "Emma Walsh",
    rating: 5,
    comment: "Very patient and knowledgeable. My dissertation improved massively after just two sessions.",
    date: "2026-02-22",
  },
  {
    id: "r3",
    mentorId: "m1",
    studentName: "Niall Connors",
    rating: 4,
    comment: "Great sessions overall. Sometimes the pace was a bit fast but always happy to re-explain things.",
    date: "2026-02-05",
  },
  {
    id: "r4",
    mentorId: "m2",
    studentName: "Siobhan Murphy",
    rating: 5,
    comment: "Prof. O'Brien's industry experience is invaluable. Got a grad role at a top firm after following his advice.",
    date: "2026-03-14",
  },
  {
    id: "r5",
    mentorId: "m2",
    studentName: "Patrick Daly",
    rating: 4,
    comment: "Very practical advice about entering the industry. Could have more sessions available per week.",
    date: "2026-02-28",
  },
  {
    id: "r6",
    mentorId: "m3",
    studentName: "Aisling Quinn",
    rating: 5,
    comment: "Dr. Nair is brilliant. Her CTF preparation guidance was spot on and I placed in my first competition.",
    date: "2026-03-01",
  },
];

// ─── Conversations & Messages ───────────────────────────────────────────────────
export const conversations: Conversation[] = [
  {
    id: "c1",
    participantId: "m1",
    participantName: "Dr. Sarah Chen",
    participantInitials: "SC",
    lastMessage: "See you at the session on Thursday!",
    lastTimestamp: "10:42",
  },
  {
    id: "c2",
    participantId: "m2",
    participantName: "Prof. James O'Brien",
    participantInitials: "JO",
    lastMessage: "I've reviewed your CV. A few suggestions...",
    lastTimestamp: "Yesterday",
  },
  {
    id: "c3",
    participantId: "m4",
    participantName: "Dr. Tom Walsh",
    participantInitials: "TW",
    lastMessage: "Good question about your project roadmap.",
    lastTimestamp: "Mon",
  },
];

export const messages: Message[] = [
  { id: "msg1", conversationId: "c1", senderId: "m1", text: "Hi Alex, looking forward to our session on Thursday.", timestamp: "10:30" },
  { id: "msg2", conversationId: "c1", senderId: "u1", text: "Thanks Dr. Chen! I've prepared the questions we discussed.", timestamp: "10:35" },
  { id: "msg3", conversationId: "c1", senderId: "m1", text: "Perfect. Please also review Chapter 7 before we meet.", timestamp: "10:39" },
  { id: "msg4", conversationId: "c1", senderId: "u1", text: "Will do. Thank you!", timestamp: "10:40" },
  { id: "msg5", conversationId: "c1", senderId: "m1", text: "See you at the session on Thursday!", timestamp: "10:42" },

  { id: "msg6", conversationId: "c2", senderId: "u1", text: "Prof. O'Brien, could you take a look at my CV when you get a chance?", timestamp: "Yesterday" },
  { id: "msg7", conversationId: "c2", senderId: "m2", text: "Of course, send it over.", timestamp: "Yesterday" },
  { id: "msg8", conversationId: "c2", senderId: "u1", text: "Sent! It's in the email thread.", timestamp: "Yesterday" },
  { id: "msg9", conversationId: "c2", senderId: "m2", text: "I've reviewed your CV. A few suggestions...", timestamp: "Yesterday" },

  { id: "msg10", conversationId: "c3", senderId: "m4", text: "How is the project roadmap coming along?", timestamp: "Mon" },
  { id: "msg11", conversationId: "c3", senderId: "u1", text: "Still working on the MVP scope. Should I narrow it down further?", timestamp: "Mon" },
  { id: "msg12", conversationId: "c3", senderId: "m4", text: "Good question about your project roadmap.", timestamp: "Mon" },
];

// ─── Admin Data ──────────────────────────────────────────────────────────────────
export const pendingMentors: PendingMentor[] = [
  { id: "pm1", name: "Dr. Claire Reilly", email: "c.reilly@mumail.ie", registeredDate: "2026-03-20" },
  { id: "pm2", name: "Dr. Brendan Scott", email: "b.scott@mumail.ie", registeredDate: "2026-03-21" },
  { id: "pm3", name: "Dr. Nora Finnegan", email: "n.finnegan@mumail.ie", registeredDate: "2026-03-22" },
];

export const reviewsForModeration: ReviewModeration[] = [
  {
    id: "rm1",
    mentorName: "Dr. Sarah Chen",
    studentName: "Unknown User",
    rating: 1,
    comment: "This mentor is useless and never shows up to sessions.",
    date: "2026-03-18",
    hidden: false,
  },
  {
    id: "rm2",
    mentorName: "Prof. James O'Brien",
    studentName: "Anonymous",
    rating: 2,
    comment: "I felt the advice was generic and not tailored to my needs.",
    date: "2026-03-19",
    hidden: false,
  },
];
