import { Suspense } from "react";
import HeroSection from "@/components/sections/HeroSection";
import RoadmapPreview from "@/components/sections/RoadmapPreview";
import PortfolioTeaser from "@/components/sections/PortfolioTeaser";
import AboutSection from "@/components/sections/AboutSection";
import FeaturedArticles from "@/components/sections/FeaturedArticles";
import NewsletterSection from "@/components/sections/NewsletterSection";
import { getFeaturedArticles } from "@/app/actions/articles";
import { getPublicPhasesPreview, getRoadmapStats } from "@/app/actions/roadmap";
import { getPublicFeaturedCases } from "@/app/actions/portfolio";
import { getSettings } from "@/app/actions/settings";

export default async function HomePage() {
  const [articles, phases, stats, featuredCases, settings] = await Promise.all([
    getFeaturedArticles(),
    getPublicPhasesPreview(),
    getRoadmapStats(),
    getPublicFeaturedCases(),
    getSettings(),
  ]);

  const shortBio = settings.profile.bio
    || settings.about.body?.split(/\n{2,}/)[0]
    || undefined;

  return (
    <main>
      <Suspense>
        <HeroSection stats={stats} />
      </Suspense>

      <RoadmapPreview phases={phases} />

      <PortfolioTeaser cases={featuredCases} />

      {articles.length > 0 && <FeaturedArticles articles={articles} />}

      <AboutSection
        profile={settings.profile}
        social={settings.social}
        shortBio={shortBio}
        tools={settings.tools}
      />

      <NewsletterSection />
    </main>
  );
}
