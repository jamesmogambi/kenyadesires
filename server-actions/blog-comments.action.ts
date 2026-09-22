export interface BlogComment {
  id: string;
  postSlug: string;
  name: string;
  email: string;
  content: string;
  createdAt: string;
  approved: boolean;
  clerkUserId?: string;
}