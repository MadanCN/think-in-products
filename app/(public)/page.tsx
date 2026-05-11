import HeroSection from "@/components/sections/HeroSection";
import RoadmapPreview from "@/components/sections/RoadmapPreview";
import FeaturedArticles from "@/components/sections/FeaturedArticles";
import NewsletterSection from "@/components/sections/NewsletterSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <RoadmapPreview />
      <FeaturedArticles />
      <NewsletterSection />
    </main>
  );
}
