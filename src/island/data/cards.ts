import type { PortfolioCard } from "@/src/island/types";

// Placeholder card content (spec §9). Card ids are FIXED: project-01, project-02, about, skills, contact.
// Content is intentionally fake — this slice only proves the object-to-card interaction system.
export const portfolioCards: PortfolioCard[] = [
  {
    id: "project-01",
    title: "Featured Project",
    eyebrow: "Project placeholder",
    summary:
      "A future project card will live here. This slice only verifies object-to-card interaction.",
    stack: ["Placeholder", "Stack", "Here"],
    highlights: ["Replace with a real featured project", "Media and links go here later"],
    links: [{ label: "Coming soon", href: "#" }],
  },
  {
    id: "project-02",
    title: "Secondary Project",
    eyebrow: "Project placeholder",
    summary:
      "A second project slot used to prove multiple project objects can share one interaction system.",
    stack: ["Placeholder", "Stack", "Here"],
    highlights: ["Proves the registry scales past one project"],
    links: [{ label: "Coming soon", href: "#" }],
  },
  {
    id: "about",
    title: "About",
    eyebrow: "Builder placeholder",
    summary:
      "A short personal introduction will go here after the interaction system is stable.",
    highlights: ["Bio, role, and story land here later"],
  },
  {
    id: "skills",
    title: "Skills & Tools",
    eyebrow: "Stack placeholder",
    summary: "A readable summary of technologies and capabilities will go here later.",
    stack: ["TypeScript", "React", "Three.js", "Next.js"],
  },
  {
    id: "contact",
    title: "Contact",
    eyebrow: "Signal placeholder",
    summary: "Contact links and calls to action will go here later.",
    links: [
      { label: "Email (placeholder)", href: "#" },
      { label: "GitHub (placeholder)", href: "#" },
    ],
  },
];

export function getPortfolioCard(id: string): PortfolioCard | undefined {
  return portfolioCards.find((c) => c.id === id);
}
