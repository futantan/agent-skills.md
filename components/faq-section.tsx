const faqItems = [
  {
    question: "What are Agent Skills?",
    answer:
      "Agent Skills are reusable, production-ready capability packs for AI agents. Each skill lives in its own folder and is described by a SKILL.md file with metadata and instructions.",
  },
  {
    question: "What does this agent-skills.md site do?",
    answer:
      "Agent Skills is a curated directory that indexes skill repositories and lets you browse, preview, and download skills in a consistent format.",
  },
  {
    question: "Where are skills stored in a repo?",
    answer:
      "By default, the site scans the skills/ folder. You can override the folder during submission, or even scan from repo root if needed.",
  },
  {
    question: "What is required inside SKILL.md?",
    answer:
      "SKILL.md must include YAML frontmatter with at least name and description. The body contains the actual guidance and steps for the agent.",
  },
  {
    question: "How can I submit a repo?",
    answer:
      "Click Submit in the header and paste a GitHub repo URL. We’ll parse the skills folder and add any valid skills to the directory.",
  },
];

export function FaqSection() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6 pb-8">
      <div className="rounded-3xl border border-border/40 bg-card/40 p-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-2 text-3xl font-semibold text-foreground">FAQ</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Frequently asked questions about Agent Skills.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {faqItems.map((item, index) => (
            <div
              key={item.question}
              className="flex gap-4 rounded-2xl border border-border/30 bg-background/40 p-6"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
