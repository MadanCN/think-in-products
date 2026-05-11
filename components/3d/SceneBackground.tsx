"use client";

/**
 * Placeholder for a Three.js / Spline 3D scene.
 * Replace this component body with your Spline <SplineScene> or a
 * Three.js canvas once the scene is ready.
 *
 * Usage: drop <SceneBackground /> into a section and position it
 * absolutely behind your content:
 *
 *   <div className="relative">
 *     <SceneBackground />
 *     <YourContent className="relative z-10" />
 *   </div>
 */

export default function SceneBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Placeholder: CSS-only animated orbs until 3D scene is wired up */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent-primary/5 blur-3xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent-secondary/5 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />
    </div>
  );
}
