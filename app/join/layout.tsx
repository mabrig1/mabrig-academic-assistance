import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mabrig Opportunities — Earn, Recruit or Partner",
  description: "Join the Mabrig network as a paid promoter or connect as a recruiter, employer, sponsor, campus, training or technology partner.",
  openGraph: {
    title: "Mabrig Opportunities — Earn, Recruit or Partner",
    description: "Paid promotion + referral conversion commission for promoters, plus recruitment and partnership opportunities for organisations.",
    url: "https://academic.mabrigkorie.org/join",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mabrig Opportunities — Earn, Recruit or Partner",
    description: "Paid promotion + referral commission, recruiter opportunities and partnerships across Academic Assistance, Fintigen and DDEI.",
  },
};

export default function JoinLayout({ children }: { children: ReactNode }) {
  return children;
}
