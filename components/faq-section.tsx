import { ChevronRight } from "lucide-react";

const faqItems = [
  {
    question: "What are Agent Skills?",
    answer:
      "Agent Skills are reusable, production-ready capability packs for AI agents. Each skill lives in its own folder and is described by a SKILL.md file that includes metadata and instructions.",
  },
  {
    question: "How do I submit a repo to the site?",
    answer:
      "Use the Submit page and paste a public GitHub repository URL. The site parses skills/ folders and indexes the skills it finds.",
  },
  {
    question: "How should I organize supporting files?",
    answer:
      "Place extra files in the same skill folder and reference them from SKILL.md. Keep the main file concise and move large details into referenced files.",
  },
  {
    question: "Can I preview or download a skill folder?",
    answer:
      "Yes. Open any skill detail page to browse the folder tree, preview SKILL.md, and download the full skill folder.",
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
        <h2 className="mt-3 text-3xl font-semibold text-foreground text-center">
          FAQ
        </h2>

        <div className="mt-10 space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-border/40 bg-background/40 px-6 py-4"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="transition group-open:rotate-90">
                    <ChevronRight size="16" />
                  </span>
                </span>
              </summary>
              <div className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </div>
            </details>
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
