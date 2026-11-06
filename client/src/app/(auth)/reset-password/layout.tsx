import { privatePage } from "@/lib/seo/metadata";

export const metadata = privatePage("Choose a new password");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
