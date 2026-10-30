import type { Evidence } from "@/lib/rag/contracts";
import type { LearningState } from "@/lib/curriculum/types";

export const demoLearner: LearningState = {
  learnerId: "learner-aria-01",
  program: "BSc Computer Science",
  currentTerm: "Term 4 · 2026",
  preferredFormats: ["worked examples", "short quizzes", "visual maps"],
  updatedAt: "2026-10-28T16:20:00.000Z",
  topics: [
    { topicId: "ml-regularization", topic: "Regularization", course: "Machine Learning", mastery: 78, band: "ready", confidence: 0.86, evidenceIds: ["ev-ml-01"], nextAction: "Compare L1 and L2 on a tiny dataset" },
    { topicId: "stats-bayes", topic: "Bayesian inference", course: "Applied Statistics", mastery: 61, band: "developing", confidence: 0.71, misconception: "Confuses prior probability with likelihood", evidenceIds: ["ev-stats-01"], nextAction: "Complete a three-question diagnostic" },
    { topicId: "systems-caching", topic: "Caching strategies", course: "Distributed Systems", mastery: 44, band: "emerging", confidence: 0.63, evidenceIds: ["ev-systems-01"], nextAction: "Review cache invalidation patterns" },
  ],
};

export const demoEvidence: Evidence[] = [
  { id: "ev-ml-01", title: "ML-402 Week 7 notes", source: "Machine Learning · Dr. Kim", excerpt: "Regularization trades a small increase in bias for a reduction in variance.", topicIds: ["ml-regularization"], authority: "official", version: "2026.1" },
  { id: "ev-stats-01", title: "Bayesian inference workshop", source: "Statistics Lab · Week 5", excerpt: "The likelihood describes how compatible observed data is with a parameter value.", topicIds: ["stats-bayes"], authority: "curated", version: "2026.2" },
  { id: "ev-systems-01", title: "Distributed systems reading list", source: "CS-410 · Library guide", excerpt: "Caching improves latency, but invalidation determines whether the system remains correct.", topicIds: ["systems-caching"], authority: "official", version: "2026.1" },
  { id: "ev-stats-02", title: "Probability Foundations Lecture", source: "Statistics Lab · Week 2", excerpt: "Marginal probability sums or integrates the joint distribution across unobserved latent states.", topicIds: ["probability-foundations"], authority: "official", version: "2026.1" },
  { id: "ev-systems-02", title: "Cache Coherence in Multi-Node Systems", source: "CS-410 · Paper Archive", excerpt: "Write-through caching preserves durability at the cost of write amplification; write-back amortizes bus bandwidth.", topicIds: ["systems-caching"], authority: "curated", version: "2026.3" },
];

export type TermOutcome = {
  id: string;
  course: string;
  code: string;
  title: string;
  description: string;
  status: "mastered" | "in-progress" | "pending";
  mastery: number;
  credits: number;
};

export const demoTermOutcomes: TermOutcome[] = [
  { id: "outcome-stat-01", course: "Applied Statistics", code: "STAT-301", title: "Probability Foundations & Independence", description: "Compute joint, conditional, and marginal distributions across discrete and continuous spaces.", status: "mastered", mastery: 94, credits: 3 },
  { id: "outcome-stat-02", course: "Applied Statistics", code: "STAT-301", title: "Bayesian Inference & Conjugate Priors", description: "Formulate Bayesian models, update beliefs via Bayes theorem, and differentiate prior from likelihood.", status: "in-progress", mastery: 61, credits: 4 },
  { id: "outcome-ml-01", course: "Machine Learning", code: "CS-402", title: "Linear & Logistic Models", description: "Implement gradient descent optimization and cross-entropy loss formulation.", status: "mastered", mastery: 91, credits: 4 },
  { id: "outcome-ml-02", course: "Machine Learning", code: "CS-402", title: "Regularization & Model Generalization", description: "Apply L1 Lasso and L2 Ridge penalties to constrain model weights and avoid overfitting.", status: "in-progress", mastery: 78, credits: 4 },
  { id: "outcome-sys-01", course: "Distributed Systems", code: "CS-410", title: "Remote Procedure Calls & Concurrency", description: "Design fault-tolerant gRPC interfaces and serialized protobuf message passing.", status: "mastered", mastery: 88, credits: 3 },
  { id: "outcome-sys-02", course: "Distributed Systems", code: "CS-410", title: "Caching Architectures & Invalidation", description: "Implement LRU eviction, write-through vs write-back pipelines, and Redis cluster caching.", status: "in-progress", mastery: 44, credits: 4 },
];

export type DiagnosticQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptionTarget?: string;
};

export const demoDiagnosticBank: Record<string, DiagnosticQuestion[]> = {
  "stats-bayes": [
    {
      id: "q-bayes-1",
      topicId: "stats-bayes",
      topicName: "Bayesian Inference",
      question: "In Bayes' theorem, what does the likelihood P(Data | Hypothesis) represent?",
      options: [
        "Your initial degree of belief in the hypothesis before observing new evidence",
        "How probable the observed evidence is assuming the hypothesis is true",
        "The probability that the hypothesis is true given the collected data",
        "The overall baseline probability of the observed data across all scenarios"
      ],
      correctIndex: 1,
      explanation: "The likelihood P(Data | H) measures how compatible the observed evidence is with a specific hypothesis. In contrast, the prior P(H) is your starting belief before data, and the posterior P(H | Data) is the updated belief.",
      misconceptionTarget: "Confuses prior probability with likelihood"
    },
    {
      id: "q-bayes-2",
      topicId: "stats-bayes",
      topicName: "Bayesian Inference",
      question: "If a prior distribution is 'uninformative' or uniform, how does the maximum a posteriori (MAP) estimate relate to the maximum likelihood estimate (MLE)?",
      options: [
        "The MAP estimate becomes exactly equivalent to the MLE",
        "The MAP estimate will always shrink parameters strictly toward zero",
        "The MAP estimate ignores observed data and defaults to the mean",
        "The MAP estimate doubles the parameter variance"
      ],
      correctIndex: 0,
      explanation: "When the prior distribution is uniform (flat across parameter space), the prior term acts as a constant multiplier, causing the MAP estimate to coincide exactly with the MLE.",
    },
    {
      id: "q-bayes-3",
      topicId: "stats-bayes",
      topicName: "Bayesian Inference",
      question: "A rare disease has an incidence rate of 0.1% (prior). A diagnostic test has 99% sensitivity and 95% specificity. If someone tests positive, why is their actual probability of having the disease still relatively low (~1.9%)?",
      options: [
        "Because the test likelihood is biased towards negative outcomes",
        "Because the extremely small prior base rate produces more false positives in absolute numbers than true positives",
        "Because Bayes theorem cannot be applied to binary diagnostic tests",
        "Because the specificity cancels the sensitivity in the denominator"
      ],
      correctIndex: 1,
      explanation: "This classic base-rate fallacy demonstrates why the prior matters: in 100,000 people, 100 have the disease (99 test positive), while 99,900 do not (approx. 4,995 test false positive). The prior anchors the posterior.",
      misconceptionTarget: "Confuses prior probability with likelihood"
    },
    {
      id: "q-bayes-4",
      topicId: "stats-bayes",
      topicName: "Bayesian Inference",
      question: "What is the primary role of the marginal likelihood (evidence term) P(Data) in the denominator of Bayes' theorem?",
      options: [
        "It acts as a normalizing constant to ensure the posterior integrates or sums to 1",
        "It penalizes model complexity proportional to the number of parameters",
        "It scales the learning rate during gradient descent",
        "It replaces the prior when observations are missing"
      ],
      correctIndex: 0,
      explanation: "The denominator P(Data) = ∫ P(Data | θ) P(θ) dθ integrates the joint probability across all possible parameter values to ensure the posterior probability distribution normalizes to 1.",
    },
    {
      id: "q-bayes-5",
      topicId: "stats-bayes",
      topicName: "Bayesian Inference",
      question: "How does a Gaussian prior on linear regression weights mathematically connect to regularization in machine learning?",
      options: [
        "A zero-mean Gaussian prior is mathematically equivalent to L2 Ridge regularization",
        "A Gaussian prior produces exact coefficient sparsity like L1 Lasso",
        "A Gaussian prior eliminates the need for cross-validation",
        "A Gaussian prior causes weights to grow exponentially with data size"
      ],
      correctIndex: 0,
      explanation: "Maximizing the posterior with a zero-mean Gaussian prior corresponds to minimizing the squared error plus a quadratic weight penalty (L2 / Ridge regularization). A Laplace prior yields L1 / Lasso regularization.",
    }
  ],
  "ml-regularization": [
    {
      id: "q-reg-1",
      topicId: "ml-regularization",
      topicName: "Regularization",
      question: "What is the fundamental geometric difference between L1 (Lasso) and L2 (Ridge) regularization penalty contours?",
      options: [
        "L1 has diamond/rhombus contours with sharp corners on axes (inducing sparsity); L2 has spherical contours",
        "L1 is strictly spherical while L2 forms hypercubes",
        "L1 penalizes bias while L2 penalizes only training latency",
        "L1 can only be used with decision trees, whereas L2 is for neural nets"
      ],
      correctIndex: 0,
      explanation: "The sharp diamond corners of the L1 norm intersect loss ellipses at axes, setting coefficients exactly to zero (feature selection). L2's smooth circles shrink coefficients toward zero without setting them strictly to zero.",
    },
    {
      id: "q-reg-2",
      topicId: "ml-regularization",
      topicName: "Regularization",
      question: "When regularization parameter λ increases toward infinity in Ridge regression, what happens to bias and variance?",
      options: [
        "Bias increases and variance decreases",
        "Bias decreases and variance increases",
        "Both bias and variance increase simultaneously",
        "Both bias and variance drop to zero"
      ],
      correctIndex: 0,
      explanation: "As λ increases, the model coefficients are constrained more tightly toward zero. This reduces model variance (less overfitting) but introduces higher bias (underfitting).",
    }
  ],
  "systems-caching": [
    {
      id: "q-cache-1",
      topicId: "systems-caching",
      topicName: "Caching Strategies",
      question: "In a distributed cache, what is the 'Cache Stampede' (or Thundering Herd) problem?",
      options: [
        "Multiple concurrent client requests hit the database simultaneously when a popular key expires",
        "The cache memory leaks because objects are never freed",
        "Replication lag causes nodes to write conflicting keys",
        "The CPU locks up due to network packet fragmentation"
      ],
      correctIndex: 0,
      explanation: "A cache stampede occurs when an intensively requested key expires, causing hundreds of concurrent queries to miss cache and overwhelm the backing database at the same time. Mutex locks or probabilistic early recomputation mitigate this.",
    },
    {
      id: "q-cache-2",
      topicId: "systems-caching",
      topicName: "Caching Strategies",
      question: "What is the primary tradeoff between Write-Through and Write-Back (Write-Behind) caching?",
      options: [
        "Write-Through guarantees data durability on write but increases write latency; Write-Back is faster but risks data loss on crash",
        "Write-Through is only for NoSQL, while Write-Back is for relational SQL",
        "Write-Through consumes 10x more RAM than Write-Back",
        "Write-Through invalidates the entire cache cluster on every mutation"
      ],
      correctIndex: 0,
      explanation: "Write-Through synchronously writes to both cache and storage before acknowledging, preventing data loss. Write-Back writes to cache immediately and flushes to disk asynchronously, which is faster but carries risk if the node fails before flush.",
    }
  ]
};

export type CapstoneProject = {
  id: string;
  title: string;
  category: "Data & AI" | "Systems & Cloud" | "Product & HCI";
  fitScore: string;
  fitPercentage: number;
  reason: string;
  tag: string;
  difficulty: "Intermediate" | "Advanced" | "Capstone";
  estimatedWeeks: number;
  prerequisites: string[];
  techStack: string[];
  mcpDataset: string;
  milestones: string[];
  detailedBlueprint: string;
};

export const demoProjects: CapstoneProject[] = [
  {
    id: "proj-energy",
    title: "Campus Energy Forecasting & Anomaly Grid",
    category: "Data & AI",
    fitScore: "92% fit",
    fitPercentage: 92,
    reason: "Directly reinforces Bayesian regression and variance tuning while leveraging your Python strength.",
    tag: "Time-Series + Statistics",
    difficulty: "Intermediate",
    estimatedWeeks: 4,
    prerequisites: ["stats-bayes", "probability-foundations"],
    techStack: ["Python", "PyMC / Stan", "Pandas", "Next.js", "FastAPI"],
    mcpDataset: "campus_facility_sensors_hourly.parquet (CU-LMS Lab Archive)",
    milestones: [
      "Week 1: Clean smart meter telemetry and establish baseline ARIMA/MLE model",
      "Week 2: Introduce Bayesian structural time-series with temperature and occupancy priors",
      "Week 3: Detect peak demand anomalies using posterior predictive checks",
      "Week 4: Build interactive dashboard with live alerts and exportable savings audit"
    ],
    detailedBlueprint: "Construct an end-to-end telemetry forecasting system that models academic building power consumption. Using Bayesian hierarchical priors, the model isolates diurnal weather variations from anomalous consumption spikes."
  },
  {
    id: "proj-accessible",
    title: "Accessible Study Companion with Adaptive Pace",
    category: "Product & HCI",
    fitScore: "84% fit",
    fitPercentage: 84,
    reason: "Combines human-centered cognitive scaffolding with learner confidence modeling.",
    tag: "HCI + Cognitive Modeling",
    difficulty: "Intermediate",
    estimatedWeeks: 3,
    prerequisites: ["probability-foundations"],
    techStack: ["TypeScript", "React", "Web Speech API", "Tailwind CSS"],
    mcpDataset: "accessibility_study_patterns_anonymized.json",
    milestones: [
      "Week 1: Research screen reader navigation & WCAG AAA contrast hierarchies",
      "Week 2: Design adaptive micro-break scheduler responding to reading pace latency",
      "Week 3: Integrate multimodal voice synthesis and speech-to-text response prompts",
      "Week 4: Conduct usability evaluation with 5 student cohort volunteers"
    ],
    detailedBlueprint: "A distraction-free academic workspace designed for neurodivergent learners. Implements progressive information disclosure and cognitive load adaptation."
  },
  {
    id: "proj-cache",
    title: "Low-Latency Distributed Course Search Engine",
    category: "Systems & Cloud",
    fitScore: "79% fit",
    fitPercentage: 79,
    reason: "Transforms abstract cache coherence and replication theory into measurable systems code.",
    tag: "Distributed Systems + Cache",
    difficulty: "Advanced",
    estimatedWeeks: 5,
    prerequisites: ["systems-caching"],
    techStack: ["Go / Rust", "Redis Cluster", "gRPC", "Next.js", "Docker"],
    mcpDataset: "cu_course_catalog_index_v2.json (CUIMS Gateway)",
    milestones: [
      "Week 1: Inverted index construction for 12,000 university course syllabi",
      "Week 2: Multi-tiered LRU caching layer with Redis cluster sharding",
      "Week 3: Implement probabilistic early cache recomputation (XFetch algorithm)",
      "Week 4: Benchmark p99 latency under simulated 1,000 QPS registration rush",
      "Week 5: Package containerized deployment with Prometheus metric endpoints"
    ],
    detailedBlueprint: "High-throughput search engine capable of serving instant course requirement lookups during peak registration surges without dropping below 99.9% cache hit ratio."
  },
  {
    id: "proj-fairness",
    title: "Algorithmic Fairness Audit in Automated Grading",
    category: "Data & AI",
    fitScore: "88% fit",
    fitPercentage: 88,
    reason: "Evaluates demographic parity and equalized odds in automated rubric evaluators.",
    tag: "ML Ethics + Evaluation",
    difficulty: "Advanced",
    estimatedWeeks: 4,
    prerequisites: ["ml-regularization", "stats-bayes"],
    techStack: ["Python", "Fairlearn", "scikit-learn", "Streamlit / Next.js"],
    mcpDataset: "synthetic_student_essay_rubrics_masked.csv",
    milestones: [
      "Week 1: Formalize demographic parity and disparate impact metrics",
      "Week 2: Audit baseline LLM automated grader for systematic score disparities",
      "Week 3: Implement threshold-optimization post-processing to balance false discovery rates",
      "Week 4: Produce institutional audit report for academic governance review"
    ],
    detailedBlueprint: "A governance auditing suite that tests rubric grading algorithms for bias across linguistic style and native vs non-native phrasing."
  }
];

export type FacultyStudentSignal = {
  id: string;
  name: string;
  avatar: string;
  course: string;
  masteryAvg: number;
  activeMisconception: string | null;
  status: "Needs Support" | "On Track" | "Exceeding";
  lastActive: string;
  suggestedAction: string;
};

export const demoFacultyRoster: FacultyStudentSignal[] = [
  {
    id: "stu-aria",
    name: "Aria Sharma",
    avatar: "AS",
    course: "Applied Statistics (STAT-301)",
    masteryAvg: 61,
    activeMisconception: "Prior probability vs Likelihood in Bayes Rule",
    status: "Needs Support",
    lastActive: "12 min ago",
    suggestedAction: "Send targeted diagnostic worked example on base-rate fallacy."
  },
  {
    id: "stu-marcus",
    name: "Marcus Vance",
    avatar: "MV",
    course: "Distributed Systems (CS-410)",
    masteryAvg: 48,
    activeMisconception: "Write-back cache invalidation vs write-through durability",
    status: "Needs Support",
    lastActive: "3 hours ago",
    suggestedAction: "Recommend lab exercise 4 on Redis cluster replication."
  },
  {
    id: "stu-priya",
    name: "Priya Patel",
    avatar: "PP",
    course: "Machine Learning (CS-402)",
    masteryAvg: 89,
    activeMisconception: null,
    status: "Exceeding",
    lastActive: "Yesterday",
    suggestedAction: "Invite to Capstone Energy Forecasting research group."
  },
  {
    id: "stu-david",
    name: "David Chen",
    avatar: "DC",
    course: "Applied Statistics (STAT-301)",
    masteryAvg: 74,
    activeMisconception: null,
    status: "On Track",
    lastActive: "2 days ago",
    suggestedAction: "Queue Week 6 hypothesis testing problem set."
  }
];