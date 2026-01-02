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
  id: string;
  category: string;
  tags: string[];
};

export const agentSkills: Skill[] = [
  {
    id: "code-analysis",
    name: "Code Analysis",
    category: "Development",
    description:
      "Deep code inspection with pattern recognition, identifying bugs, security vulnerabilities, and performance bottlenecks.",
    author: {
      name: "Ava Tran",
      url: "https://example.com/ava-tran",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["AST", "Static Analysis", "Security"],
  },
  {
    id: "api-integration",
    name: "API Integration",
    category: "Development",
    description:
      "Seamlessly connect to REST, GraphQL, and WebSocket APIs with automatic schema detection and type generation.",
    author: {
      name: "Diego Park",
      url: "https://example.com/diego-park",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["REST", "GraphQL", "WebSocket"],
  },
  {
    id: "documentation-generation",
    name: "Documentation Generation",
    category: "Documentation",
    description:
      "Automatically generate comprehensive docs from code with examples, API references, and interactive guides.",
    author: {
      name: "Mira Sol",
      url: "https://example.com/mira-sol",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["Markdown", "JSDoc", "OpenAPI"],
  },
  {
    id: "test-automation",
    name: "Test Automation",
    category: "Testing",
    description:
      "Generate unit, integration, and E2E tests with high coverage and edge case detection.",
    author: {
      name: "Calvin Reed",
      url: "https://example.com/calvin-reed",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["Jest", "Playwright", "Coverage"],
  },
  {
    id: "data-validation",
    name: "Data Validation",
    category: "Data",
    description:
      "Validate and sanitize data structures with custom rules, schema validation, and type safety.",
    author: {
      name: "Nora Patel",
      url: "https://example.com/nora-patel",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["Zod", "Yup", "JSON Schema"],
  },
  {
    id: "performance-optimization",
    name: "Performance Optimization",
    category: "Development",
    description:
      "Analyze runtime performance, identify bottlenecks, and suggest optimizations for faster execution.",
    author: {
      name: "Hugo Lin",
      url: "https://example.com/hugo-lin",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["Profiling", "Optimization", "Metrics"],
  },
  {
    id: "database-migration",
    name: "Database Migration",
    category: "Data",
    description:
      "Generate and manage database migrations with rollback support and zero-downtime deployments.",
    author: {
      name: "Priya Shah",
      url: "https://example.com/priya-shah",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["SQL", "Prisma", "Migration"],
  },
  {
    id: "ui-component-builder",
    name: "UI Component Builder",
    category: "Frontend",
    description:
      "Create accessible, responsive UI components following design systems and best practices.",
    author: {
      name: "Leo Kim",
      url: "https://example.com/leo-kim",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["React", "A11y", "Design System"],
  },
  {
    id: "security-audit",
    name: "Security Audit",
    category: "Security",
    description:
      "Comprehensive security scanning for vulnerabilities, dependency issues, and compliance checks.",
    author: {
      name: "Rowan Bell",
      url: "https://example.com/rowan-bell",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["OWASP", "CVE", "Compliance"],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    category: "DevOps",
    description:
      "Set up automated build, test, and deployment pipelines with multi-environment support.",
    author: {
      name: "Selena Ortiz",
      url: "https://example.com/selena-ortiz",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["GitHub Actions", "Docker", "K8s"],
  },
  {
    id: "error-handling",
    name: "Error Handling",
    category: "Development",
    description:
      "Implement robust error handling strategies with logging, monitoring, and graceful degradation.",
    author: {
      name: "Jules Grant",
      url: "https://example.com/jules-grant",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["Logging", "Monitoring", "Alerts"],
  },
  {
    id: "accessibility-checker",
    name: "Accessibility Checker",
    category: "Frontend",
    description:
      "Audit and fix accessibility issues following WCAG guidelines for inclusive user experiences.",
    author: {
      name: "Tessa Nguyen",
      url: "https://example.com/tessa-nguyen",
      avatarUrl: "https://avatars.githubusercontent.com/u/6268441?v=4",
    },
    tags: ["WCAG", "ARIA", "Screen Reader"],
  },
];
