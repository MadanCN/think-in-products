import { Map } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-6">
          <Map className="w-7 h-7 text-accent-primary" strokeWidth={1.5} />
        </div>

        <p className="font-display text-7xl font-extrabold text-accent-primary/15 mb-4 leading-none">
          404
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          Page not found
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          This page doesn&rsquo;t exist. The assumption that it did was wrong.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" href="/">
            Back to Home
          </Button>
          <Button variant="ghost" href="/roadmap">
            Explore Roadmap
          </Button>
        </div>
      </div>
    </div>
  );
}
