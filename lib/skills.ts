export type SkillAuthor = {
  name: string;
  url?: string;
  avatarUrl?: string;
};

export type SkillBase = {
  name: string;
  description: string;
  author?: SkillAuthor;
};

export type Skill = SkillBase & {
  id: number;
  category: string;
  complexity: "Basic" | "Intermediate" | "Advanced";
  status: "Active" | "Beta";
  metrics: { accuracy: string; speed: string };
  tags: string[];
};

export const agentSkills: Skill[] = [
  {
    id: 1,
    name: "Code Analysis",
    category: "Development",
    description:
      "Deep code inspection with pattern recognition, identifying bugs, security vulnerabilities, and performance bottlenecks.",
    author: {
      name: "Ava Tran",
      url: "https://example.com/ava-tran",
      avatarUrl: "https://example.com/avatars/ava-tran.png",
    },
    complexity: "Advanced",
    status: "Active",
    metrics: { accuracy: "98%", speed: "Fast" },
    tags: ["AST", "Static Analysis", "Security"],
  },
  {
    id: 2,
    name: "API Integration",
    category: "Development",
    description:
      "Seamlessly connect to REST, GraphQL, and WebSocket APIs with automatic schema detection and type generation.",
    author: {
      name: "Diego Park",
      url: "https://example.com/diego-park",
      avatarUrl: "https://example.com/avatars/diego-park.png",
    },
    complexity: "Intermediate",
    status: "Active",
    metrics: { accuracy: "96%", speed: "Fast" },
    tags: ["REST", "GraphQL", "WebSocket"],
  },
  {
    id: 3,
    name: "Documentation Generation",
    category: "Documentation",
    description:
      "Automatically generate comprehensive docs from code with examples, API references, and interactive guides.",
    author: {
      name: "Mira Sol",
      url: "https://example.com/mira-sol",
      avatarUrl: "https://example.com/avatars/mira-sol.png",
    },
    complexity: "Intermediate",
    status: "Active",
    metrics: { accuracy: "94%", speed: "Medium" },
    tags: ["Markdown", "JSDoc", "OpenAPI"],
  },
  {
    id: 4,
    name: "Test Automation",
    category: "Testing",
    description:
      "Generate unit, integration, and E2E tests with high coverage and edge case detection.",
    author: {
      name: "Calvin Reed",
      url: "https://example.com/calvin-reed",
      avatarUrl: "https://example.com/avatars/calvin-reed.png",
    },
    complexity: "Advanced",
    status: "Active",
    metrics: { accuracy: "97%", speed: "Fast" },
    tags: ["Jest", "Playwright", "Coverage"],
  },
  {
    id: 5,
    name: "Data Validation",
    category: "Data",
    description:
      "Validate and sanitize data structures with custom rules, schema validation, and type safety.",
    author: {
      name: "Nora Patel",
      url: "https://example.com/nora-patel",
      avatarUrl: "https://example.com/avatars/nora-patel.png",
    },
    complexity: "Basic",
    status: "Active",
    metrics: { accuracy: "99%", speed: "Very Fast" },
    tags: ["Zod", "Yup", "JSON Schema"],
  },
  {
    id: 6,
    name: "Performance Optimization",
    category: "Development",
    description:
      "Analyze runtime performance, identify bottlenecks, and suggest optimizations for faster execution.",
    author: {
      name: "Hugo Lin",
      url: "https://example.com/hugo-lin",
      avatarUrl: "https://example.com/avatars/hugo-lin.png",
    },
    complexity: "Advanced",
    status: "Active",
    metrics: { accuracy: "95%", speed: "Medium" },
    tags: ["Profiling", "Optimization", "Metrics"],
  },
  {
    id: 7,
    name: "Database Migration",
    category: "Data",
    description:
      "Generate and manage database migrations with rollback support and zero-downtime deployments.",
    author: {
      name: "Priya Shah",
      url: "https://example.com/priya-shah",
      avatarUrl: "https://example.com/avatars/priya-shah.png",
    },
    complexity: "Advanced",
    status: "Beta",
    metrics: { accuracy: "93%", speed: "Medium" },
    tags: ["SQL", "Prisma", "Migration"],
  },
  {
    id: 8,
    name: "UI Component Builder",
    category: "Frontend",
    description:
      "Create accessible, responsive UI components following design systems and best practices.",
    author: {
      name: "Leo Kim",
      url: "https://example.com/leo-kim",
      avatarUrl: "https://example.com/avatars/leo-kim.png",
    },
    complexity: "Intermediate",
    status: "Active",
    metrics: { accuracy: "96%", speed: "Fast" },
    tags: ["React", "A11y", "Design System"],
  },
  {
    id: 9,
    name: "Security Audit",
    category: "Security",
    description:
      "Comprehensive security scanning for vulnerabilities, dependency issues, and compliance checks.",
    author: {
      name: "Rowan Bell",
      url: "https://example.com/rowan-bell",
      avatarUrl: "https://example.com/avatars/rowan-bell.png",
    },
    complexity: "Advanced",
    status: "Active",
    metrics: { accuracy: "98%", speed: "Medium" },
    tags: ["OWASP", "CVE", "Compliance"],
  },
  {
    id: 10,
    name: "CI/CD Pipeline",
    category: "DevOps",
    description:
      "Set up automated build, test, and deployment pipelines with multi-environment support.",
    author: {
      name: "Selena Ortiz",
      url: "https://example.com/selena-ortiz",
      avatarUrl: "https://example.com/avatars/selena-ortiz.png",
    },
    complexity: "Advanced",
    status: "Active",
    metrics: { accuracy: "94%", speed: "Fast" },
    tags: ["GitHub Actions", "Docker", "K8s"],
  },
  {
    id: 11,
    name: "Error Handling",
    category: "Development",
    description:
      "Implement robust error handling strategies with logging, monitoring, and graceful degradation.",
    author: {
      name: "Jules Grant",
      url: "https://example.com/jules-grant",
      avatarUrl: "https://example.com/avatars/jules-grant.png",
    },
    complexity: "Intermediate",
    status: "Active",
    metrics: { accuracy: "97%", speed: "Fast" },
    tags: ["Logging", "Monitoring", "Alerts"],
  },
  {
    id: 12,
    name: "Accessibility Checker",
    category: "Frontend",
    description:
      "Audit and fix accessibility issues following WCAG guidelines for inclusive user experiences.",
    author: {
      name: "Tessa Nguyen",
      url: "https://example.com/tessa-nguyen",
      avatarUrl: "https://example.com/avatars/tessa-nguyen.png",
    },
    complexity: "Intermediate",
    status: "Beta",
    metrics: { accuracy: "95%", speed: "Fast" },
    tags: ["WCAG", "ARIA", "Screen Reader"],
  },
];
