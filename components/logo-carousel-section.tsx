type LogoItem = {
  href: string;
  alt: string;
  src: string;
  width: number;
};

const primaryLogos: LogoItem[] = [
  {
    href: "https://code.visualstudio.com/",
    alt: "VS Code",
    src: "/images/logos/vscode/vscode.svg",
    width: 150,
  },
  {
    href: "https://geminicli.com",
    alt: "Gemini CLI",
    src: "/images/logos/gemini-cli/gemini-cli-logo_light.svg",
    width: 150,
  },
  {
    href: "https://github.com/",
    alt: "GitHub",
    src: "/images/logos/github/GitHub_Lockup_Dark.svg",
    width: 150,
  },
  {
    href: "https://block.github.io/goose/",
    alt: "Goose",
    src: "/images/logos/goose/goose-logo-black.png",
    width: 150,
  },
  {
    href: "https://ampcode.com/",
    alt: "Amp",
    src: "/images/logos/amp/amp-logo-light.svg",
    width: 120,
  },
  {
    href: "https://cursor.com/",
    alt: "Cursor",
    src: "/images/logos/cursor/LOCKUP_HORIZONTAL_2D_LIGHT.svg",
    width: 150,
  },
];

const secondaryLogos: LogoItem[] = [
  {
    href: "https://claude.ai/code",
    alt: "Claude Code",
    src: "/images/logos/claude-code/Claude-Code-logo-Slate.svg",
    width: 150,
  },
  {
    href: "https://www.letta.com/",
    alt: "Letta",
    src: "/images/logos/letta/Letta-logo-RGB_OffBlackonTransparent.svg",
    width: 150,
  },
  {
    href: "https://opencode.ai/",
    alt: "OpenCode",
    src: "/images/logos/opencode/opencode-wordmark-light.svg",
    width: 150,
  },
  {
    href: "https://claude.ai/",
    alt: "Claude",
    src: "/images/logos/claude-ai/Claude-logo-Slate.svg",
    width: 150,
  },
  {
    href: "https://developers.openai.com/codex",
    alt: "OpenAI Codex",
    src: "/images/logos/oai-codex/OAI_Codex-Lockup_400px.svg",
    width: 150,
  },
  {
    href: "https://factory.ai/",
    alt: "Factory",
    src: "/images/logos/factory/factory-logo-light.svg",
    width: 150,
  },
];

function LogoTrack({
  logos,
  animation,
}: {
  logos: LogoItem[];
  animation: string;
}) {
  return (
    <div className="logo-carousel">
      <div className="logo-carousel-track" style={{ animation }}>
        {logos.map((logo, index) => (
          <a
            key={`${logo.alt}-${index}`}
            href={logo.href}
            target="_blank"
            rel="noreferrer"
            className="link"
            style={{ textDecoration: "none", border: "none" }}
          >
            <img
              alt={logo.alt}
              src={logo.src}
              style={{ width: logo.width, maxWidth: "100%" }}
              className="rounded mint-object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export function LogoCarouselSection() {
  return (
    <section className="border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="mt-2 text-3xl font-semibold text-foreground">
            Adoption
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Agent Skills are supported by leading AI development tools.
          </p>
        </div>
        <LogoTrack
          logos={[...primaryLogos, ...primaryLogos]}
          animation="50s linear 0s infinite normal none running logo-scroll"
        />
        <LogoTrack
          logos={[...secondaryLogos, ...secondaryLogos]}
          animation="60s linear 0s infinite reverse none running logo-scroll"
        />
      </div>
    </section>
  );
}
