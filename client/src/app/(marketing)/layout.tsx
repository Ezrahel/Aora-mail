import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";
import { SmoothScroll } from "@/components/scene/smooth-scroll";
import { SpiralBackdrop } from "@/components/scene/spiral-backdrop";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SmoothScroll />
      <SpiralBackdrop />
      <MarketingNav />
      <main className="relative z-10 flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
