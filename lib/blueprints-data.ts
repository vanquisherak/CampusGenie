export interface MicroStep {
  id: string;
  stepNumber: number;
  title: string;
  explanation: string;
  task: string;
  estimatedMinutes: number;
  completed: boolean;
  youtubeUrl?: string;
  youtubeTitle?: string;
}

export interface SubjectBlueprint {
  overview: string;
  biggerGoal: string;
  videoLinks: Array<{
    title: string;
    channel: string;
    url: string;
    duration: string;
  }>;
  microSteps: MicroStep[];
}

export interface StudySession {
  id: string;
  day: string;
  title: string;
  course: string;
  durationMinutes: number;
  status: "not-started" | "in-progress" | "completed";
  focusNotes: string;
  color: string;
  blueprint?: SubjectBlueprint;
}

export const PRESET_BLUEPRINTS: Record<string, SubjectBlueprint> = {
  "bayes-inference": {
    biggerGoal: "Master Bayesian parameter estimation, update conjugate beliefs, and prevent base-rate false positive fallacies in machine learning models.",
    overview: `Bayesian inference is a mathematical framework that treats unknown parameters as probability distributions rather than fixed static constants. 

In classical frequentist statistics, a hypothesis is tested against a fixed null. In Bayesian inference, we begin with a prior belief P(H), observe experimental evidence or diagnostic data D, compute the likelihood P(D|H), and systematically calculate the updated posterior distribution P(H|D) using Bayes' Theorem:
P(H|D) = [P(D|H) * P(H)] / P(D)

Understanding this distinction prevents the notorious 'base-rate fallacy', which occurs when high test accuracy causes students or practitioners to drastically overestimate the probability of a condition when its true prevalence is rare.`,
    videoLinks: [
      {
        title: "Bayes theorem, the geometry of changing beliefs",
        channel: "3Blue1Brown",
        url: "https://www.youtube.com/watch?v=HZGCoVF3YvM",
        duration: "15:10",
      },
      {
        title: "Bayes' Theorem, Clearly Explained!!!",
        channel: "StatQuest with Josh Starmer",
        url: "https://www.youtube.com/watch?v=9wCnvr7Xw4E",
        duration: "10:35",
      },
      {
        title: "The Main Ideas of Bayesian Statistics",
        channel: "StatQuest with Josh Starmer",
        url: "https://www.youtube.com/watch?v=Ohm36ZqRP3U",
        duration: "12:15",
      },
    ],
    microSteps: [
      {
        id: "step-bayes-1",
        stepNumber: 1,
        title: "Prior P(H) vs Likelihood P(D|H) distinction",
        explanation: "The prior represents your state of knowledge before observing evidence. The likelihood is NOT the probability of the hypothesis; it measures how probable the observed data is given that hypothesis.",
        task: "Write down the probability of a wet sidewalk given rain vs probability of rain given a wet sidewalk.",
        estimatedMinutes: 12,
        completed: true,
        youtubeUrl: "https://www.youtube.com/watch?v=HZGCoVF3YvM",
        youtubeTitle: "3Blue1Brown: Geometry of Beliefs",
      },
      {
        id: "step-bayes-2",
        stepNumber: 2,
        title: "Deconstruct the Base-Rate Fallacy",
        explanation: "When disease prevalence is 0.1% and a test has 99% accuracy, a positive test only yields ~9% posterior probability due to the overwhelming ratio of healthy false positives.",
        task: "Calculate posterior probability P(Disease|Positive) given 1 in 1000 prevalence and 5% false positive rate.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=9wCnvr7Xw4E",
        youtubeTitle: "StatQuest: Bayes' Theorem",
      },
      {
        id: "step-bayes-3",
        stepNumber: 3,
        title: "Calculate the Marginal Evidence Denominator P(D)",
        explanation: "The denominator normalizes probabilities across the hypothesis space using the law of total probability: P(D) = Σ P(D|Hi) * P(Hi).",
        task: "Verify that all posterior probabilities sum strictly to 1.0 across complementary hypotheses.",
        estimatedMinutes: 14,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=Ohm36ZqRP3U",
        youtubeTitle: "StatQuest: Bayesian Main Ideas",
      },
      {
        id: "step-bayes-4",
        stepNumber: 4,
        title: "Beta-Binomial Conjugate Updating",
        explanation: "When observations are coin flips (binomial), pairing them with a Beta(α, β) prior yields a closed-form Beta(α + heads, β + tails) posterior without numerical integration.",
        task: "Plot or sketch prior Beta(2, 2) before and after observing 8 heads out of 10 flips.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=9wCnvr7Xw4E",
        youtubeTitle: "Conjugate Priors Walkthrough",
      },
    ],
  },

  "ml-regularization": {
    biggerGoal: "Prevent machine learning model overfitting by tuning L1 Lasso and L2 Ridge loss penalty constraints on regression and neural networks.",
    overview: `Complex machine learning models often suffer from high variance (overfitting): they memorize training dataset noise and fail to generalize on unseen test data.

Regularization modifies the cost function by adding a penalty term proportional to model weights:
- L2 Regularization (Ridge): Penalty = λ * Σ(w_i)^2
- L1 Regularization (Lasso): Penalty = λ * Σ|w_i|

L2 shrinks all weights toward zero smoothly, whereas L1 drives non-essential feature weights strictly to zero, effectively performing automatic feature selection due to the geometric diamond corners of the L1 norm constraint.`,
    videoLinks: [
      {
        title: "Regularization Part 1: Ridge (L2) Regression",
        channel: "StatQuest with Josh Starmer",
        url: "https://www.youtube.com/watch?v=Q81RR3yKn30",
        duration: "16:20",
      },
      {
        title: "Regularization Part 2: Lasso (L1) Regression",
        channel: "StatQuest with Josh Starmer",
        url: "https://www.youtube.com/watch?v=NGf0voTMlcs",
        duration: "15:45",
      },
      {
        title: "Gradient Descent and Cost Surfaces",
        channel: "3Blue1Brown",
        url: "https://www.youtube.com/watch?v=IHZwWFHWa-w",
        duration: "19:00",
      },
    ],
    microSteps: [
      {
        id: "step-reg-1",
        stepNumber: 1,
        title: "Detecting Overfitting & Weight Inflation",
        explanation: "Unconstrained ordinary least squares (OLS) minimizes training residual sum of squares by blowing up weights to cancel out collinear variables.",
        task: "Inspect model weights with and without multicollinearity on a small synthetic dataset.",
        estimatedMinutes: 12,
        completed: true,
        youtubeUrl: "https://www.youtube.com/watch?v=Q81RR3yKn30",
        youtubeTitle: "StatQuest: Ridge Regression",
      },
      {
        id: "step-reg-2",
        stepNumber: 2,
        title: "L2 Ridge Penalty Mechanics & Shrinkage",
        explanation: "Ridge penalizes the squared Euclidean magnitude of the weights. The penalty grows quadratically with weight size, forcing small, stable weights.",
        task: "Compare analytical Ridge solution w = (X^T X + λI)^(-1) X^T y against standard OLS.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=Q81RR3yKn30",
        youtubeTitle: "StatQuest: Ridge Penalty",
      },
      {
        id: "step-reg-3",
        stepNumber: 3,
        title: "L1 Lasso Sparsity & Diamond Geometry",
        explanation: "Because the L1 norm has sharp corners along the coordinate axes in weight space, the elliptical contours of the loss function typically hit a corner first, setting coefficients exactly to 0.",
        task: "Draw the 2D contour intersection between an elliptical loss surface and the diamond L1 boundary.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=NGf0voTMlcs",
        youtubeTitle: "StatQuest: Lasso Sparsity",
      },
      {
        id: "step-reg-4",
        stepNumber: 4,
        title: "K-Fold Cross-Validation for Hyperparameter λ",
        explanation: "Selecting the optimal λ balances bias and variance. Too high causes underfitting; too low permits overfitting.",
        task: "Run 5-fold cross-validation to locate the minimum mean squared error across log-spaced λ values.",
        estimatedMinutes: 18,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=NGf0voTMlcs",
        youtubeTitle: "Cross-validation for Lambda",
      },
    ],
  },

  "distributed-caching": {
    biggerGoal: "Design a fault-tolerant multi-tier caching architecture with $O(1)$ LRU eviction and zero cache stampedes under high concurrency.",
    overview: `In large-scale distributed web systems, database IOPS and query latencies become the primary performance bottleneck. In-memory caching layers (such as Redis or Memcached) deliver sub-millisecond response times.

However, caching introduces distributed consensus and consistency challenges:
- Cache Stampede (Thundering Herd): When a hot key expires, thousands of simultaneous queries hit the database at once.
- Invalidation Policies: Balancing Write-Through (strong durability) against Write-Back (maximum throughput, eventual persistence).
- Eviction Algorithms: Managing finite RAM boundaries via Least Recently Used (LRU) or Least Frequently Used (LFU).`,
    videoLinks: [
      {
        title: "Top 7 Caching Strategies for System Design",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=d_EwG4EUGc0",
        duration: "11:20",
      },
      {
        title: "Distributed Systems: Caching & Consistency",
        channel: "MIT OpenCourseWare",
        url: "https://www.youtube.com/watch?v=G0wSojpxvBw",
        duration: "48:15",
      },
      {
        title: "Cache Coherence & CPU Caches",
        channel: "Computerphile",
        url: "https://www.youtube.com/watch?v=6Jp6fqn_K-w",
        duration: "13:40",
      },
    ],
    microSteps: [
      {
        id: "step-cache-1",
        stepNumber: 1,
        title: "Cache-Aside vs Read-Through Patterns",
        explanation: "In Cache-Aside, the application code queries the cache, and on miss queries the database and populates the cache. In Read-Through, the cache library abstracts database retrieval.",
        task: "Implement a simple Cache-Aside wrapper function with fallback query and TTL expiration.",
        estimatedMinutes: 12,
        completed: true,
        youtubeUrl: "https://www.youtube.com/watch?v=d_EwG4EUGc0",
        youtubeTitle: "ByteByteGo: Caching Strategies",
      },
      {
        id: "step-cache-2",
        stepNumber: 2,
        title: "Mitigating Cache Stampedes (Thundering Herd)",
        explanation: "When hot keys expire, use distributed mutex locks (Redis SETNX) or probabilistic early expiration (XFetch algorithm) so only one worker regenerates the cached payload.",
        task: "Write pseudocode for mutex lease acquisition with a short retry backoff.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=d_EwG4EUGc0",
        youtubeTitle: "ByteByteGo: Stampede Protection",
      },
      {
        id: "step-cache-3",
        stepNumber: 3,
        title: "O(1) LRU Eviction via Doubly Linked List & Hash Map",
        explanation: "A doubly linked list allows moving accessed nodes to the head in O(1) time and popping the tail in O(1) time, while the hash map provides O(1) key lookups.",
        task: "Trace node pointer updates when accessing an existing key in an LRU cache of capacity 3.",
        estimatedMinutes: 16,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=6Jp6fqn_K-w",
        youtubeTitle: "Computerphile: Cache Mechanics",
      },
      {
        id: "step-cache-4",
        stepNumber: 4,
        title: "Write-Through vs Write-Back Invalidation Analysis",
        explanation: "Write-through updates both cache and DB synchronously. Write-back queues writes asynchronously in cache, increasing write speed but risking data loss upon node crash.",
        task: "Construct a trade-off matrix comparing write latency, dirty reads, and node failure survival.",
        estimatedMinutes: 14,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=G0wSojpxvBw",
        youtubeTitle: "MIT OCW: Consistency Invariants",
      },
    ],
  },

  "alphafold-bioscience": {
    biggerGoal: "Analyze 3D macromolecular protein predictions using AlphaFold DB v6 API, evaluate pLDDT confidence intervals, and extract domain structures.",
    overview: `AlphaFold revolutionized structural biology by predicting 3D protein structures directly from primary amino acid sequences with near-experimental atomic accuracy.

Understanding AlphaFold outputs requires analyzing:
- Per-residue pLDDT confidence scores (0-100 scale), where >90 indicates high confidence and <50 indicates intrinsically disordered regions (IDRs).
- Predicted Aligned Error (PAE) matrices, which communicate inter-domain orientation confidence.
- Coordinate files (mmCIF / PDB) for downstream active site exploration and Foldseek structural homology searches.`,
    videoLinks: [
      {
        title: "AlphaFold: Using AI for scientific discovery",
        channel: "Google DeepMind",
        url: "https://www.youtube.com/watch?v=gg7WjuFs8F4",
        duration: "08:30",
      },
      {
        title: "Exploring predicted structures with AlphaFold DB",
        channel: "EMBL-EBI Training",
        url: "https://www.youtube.com/watch?v=uQkI_gZf0O4",
        duration: "14:20",
      },
    ],
    microSteps: [
      {
        id: "step-af-1",
        stepNumber: 1,
        title: "Dynamic mmCIF File Resolution from UniProt",
        explanation: "Always resolve structure URLs dynamically via GET https://alphafold.ebi.ac.uk/api/prediction/{accession} to fetch current v6 coordinate files.",
        task: "Query AlphaFold DB for human p53 (P04637) and inspect the returned cifUrl and paeImageUrl.",
        estimatedMinutes: 10,
        completed: true,
        youtubeUrl: "https://www.youtube.com/watch?v=gg7WjuFs8F4",
        youtubeTitle: "DeepMind: AlphaFold AI",
      },
      {
        id: "step-af-2",
        stepNumber: 2,
        title: "Canonical 4-Band pLDDT Metric Interpretation",
        explanation: "pLDDT is stored in the B-factor column: Very High (>90), Confident (70-90), Low (50-70), and Very Low (<50). Low regions typically reflect true disordered loops.",
        task: "Calculate the percentage of residues with pLDDT > 70 for your target protein.",
        estimatedMinutes: 12,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=uQkI_gZf0O4",
        youtubeTitle: "EMBL-EBI: Confidence Scores",
      },
      {
        id: "step-af-3",
        stepNumber: 3,
        title: "Predicted Aligned Error (PAE) Heatmap Analysis",
        explanation: "PAE displays expected error in Ångströms at residue x when aligned on residue y. Dark square blocks along the diagonal signify rigid structural domains.",
        task: "Identify whether two globular domains have rigid or flexible relative orientations.",
        estimatedMinutes: 15,
        completed: false,
        youtubeUrl: "https://www.youtube.com/watch?v=uQkI_gZf0O4",
        youtubeTitle: "PAE Heatmaps Explained",
      },
    ],
  },
};

export const INITIAL_STUDY_SESSIONS: StudySession[] = [
  {
    id: "s-1",
    day: "Thu",
    title: "Bayes diagnostic & prior formulation",
    course: "Applied Statistics",
    durationMinutes: 25,
    status: "in-progress",
    focusNotes: "Distinguish between prior probability P(H) and likelihood P(D|H)",
    color: "bg-[var(--coral)]",
    blueprint: PRESET_BLUEPRINTS["bayes-inference"],
  },
  {
    id: "s-2",
    day: "Fri",
    title: "Prior vs Likelihood worked examples",
    course: "Applied Statistics",
    durationMinutes: 45,
    status: "not-started",
    focusNotes: "Solve medical diagnostic base-rate problem and beta-binomial update",
    color: "bg-[var(--cobalt)]",
    blueprint: PRESET_BLUEPRINTS["bayes-inference"],
  },
  {
    id: "s-3",
    day: "Sat",
    title: "L1 vs L2 regularization lab",
    course: "Machine Learning",
    durationMinutes: 60,
    status: "not-started",
    focusNotes: "Plot parameter contour shrinkage on housing dataset",
    color: "bg-[var(--mint)]",
    blueprint: PRESET_BLUEPRINTS["ml-regularization"],
  },
  {
    id: "s-4",
    day: "Sun",
    title: "Distributed cache invalidation study",
    course: "Distributed Systems",
    durationMinutes: 40,
    status: "not-started",
    focusNotes: "Compare write-through vs write-back cache stampede mitigations",
    color: "bg-[var(--ink)]",
    blueprint: PRESET_BLUEPRINTS["distributed-caching"],
  },
  {
    id: "s-5",
    day: "Mon",
    title: "AlphaFold 3D macromolecular analysis",
    course: "Bioscience & Structural Biology",
    durationMinutes: 50,
    status: "not-started",
    focusNotes: "Analyze pLDDT confidence distribution and PAE domain boundaries",
    color: "bg-teal-600",
    blueprint: PRESET_BLUEPRINTS["alphafold-bioscience"],
  },
];
