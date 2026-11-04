/** Static content for the Career Guidance page. */

export const RESUME_TIPS = [
  { title: "One page, clean layout", text: "Freshers should keep it to a single page with consistent fonts and generous margins. Avoid tables, text boxes and images — ATS parsers struggle with them." },
  { title: "Lead with a 2-line summary", text: "State your degree, target role and 2–3 strongest skills. Tailor it for every application." },
  { title: "Action verb + impact + number", text: "“Built a REST API in Node.js that served 5k users and cut response time by 40%.” beats “Worked on backend.”" },
  { title: "Projects over fluff", text: "List 2–3 projects with tech stack, your role and a link to GitHub or a live demo." },
  { title: "Mirror the job description", text: "Use the exact keywords from the posting (e.g. “REST APIs”, “SQL”) where they honestly apply." },
  { title: "Standard section names", text: "Use Education, Experience, Projects, Skills, Certifications — ATS software looks for them." },
  { title: "Proofread twice", text: "Typos are the fastest way to get rejected. Export as PDF and name it Firstname_Lastname_Resume.pdf." },
];

export const INTERVIEW = [
  {
    group: "Technical",
    items: [
      { q: "Explain the difference between an array and a linked list.", a: "Arrays give O(1) indexed access but O(n) insertion in the middle; linked lists give O(1) insertion at a known node but O(n) access. Mention memory layout and cache locality." },
      { q: "What are ACID properties in databases?", a: "Atomicity, Consistency, Isolation, Durability — guarantees that make transactions reliable. Give a bank-transfer example." },
      { q: "What happens when you type a URL in the browser?", a: "DNS lookup → TCP/TLS handshake → HTTP request → server response → browser parses HTML, fetches assets, renders. Great for testing networking fundamentals." },
      { q: "Explain a project you're proud of end-to-end.", a: "Cover the problem, your design choices, trade-offs, bugs you fixed and what you'd improve. Be ready for deep follow-ups on every technology listed." },
    ],
  },
  {
    group: "HR & Behavioural",
    items: [
      { q: "Tell me about yourself.", a: "Use Present → Past → Future: current degree & strengths, 1–2 relevant achievements, and why this role excites you. Keep it under 90 seconds." },
      { q: "What is your biggest weakness?", a: "Pick a real but non-critical weakness, show the steps you're taking to improve, and give a small result." },
      { q: "Describe a time you handled conflict in a team.", a: "Use the STAR method: Situation, Task, Action, Result. Focus on listening, finding common ground and the outcome." },
      { q: "Why should we hire you?", a: "Connect 2–3 of your skills/projects directly to the job description and show eagerness to learn." },
    ],
  },
  {
    group: "Preparation checklist",
    items: [
      { q: "One week before", a: "Revise core CS subjects (DSA, DBMS, OS, CN), solve 3–5 problems daily, and re-read your own resume line by line." },
      { q: "One day before", a: "Research the company's products, prepare 3 questions to ask, test your camera/mic, lay out your outfit." },
      { q: "During the interview", a: "Think aloud while solving, clarify requirements first, be honest about what you don't know, and thank the interviewer." },
    ],
  },
];

export type QuizQ = { q: string; options: string[]; answer: number; explain: string };
export const APTITUDE: QuizQ[] = [
  { q: "A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?", options: ["30", "36", "40", "45"], answer: 1, explain: "Speed = 150/15 = 10 m/s = 10 × 3.6 = 36 km/h." },
  { q: "If 20% of a number is 50, what is 45% of that number?", options: ["100", "112.5", "125", "90"], answer: 1, explain: "Number = 50 / 0.2 = 250. 45% of 250 = 112.5." },
  { q: "The ratio of ages of A and B is 3:5. After 6 years the ratio becomes 2:3. A's present age?", options: ["9", "12", "15", "18"], answer: 3, explain: "(3x+6)/(5x+6)=2/3 → 9x+18=10x+12 → x=6. A = 18." },
  { q: "A can do a work in 12 days, B in 18 days. Together they finish in:", options: ["6.2 days", "7.2 days", "8 days", "9 days"], answer: 1, explain: "1/12 + 1/18 = 5/36 per day → 36/5 = 7.2 days." },
  { q: "Find the next number: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], answer: 2, explain: "Differences are 4, 6, 8, 10, so next is +12 → 42 (n × (n+1))." },
  { q: "A shopkeeper sells an item at 20% profit. If cost price is ₹800, the selling price is:", options: ["₹920", "₹940", "₹960", "₹980"], answer: 2, explain: "SP = 800 × 1.2 = ₹960." },
  { q: "Pointing to a man, a woman says “He is the son of my mother’s only son.” Relation of the man to the woman?", options: ["Brother", "Nephew", "Son", "Cousin"], answer: 1, explain: "The woman's mother's only son is her brother, so his son is her nephew." },
  { q: "Simple interest on ₹5000 at 8% per annum for 3 years?", options: ["₹1000", "₹1200", "₹1500", "₹1800"], answer: 1, explain: "SI = P × R × T / 100 = 5000 × 8 × 3 / 100 = ₹1200." },
  { q: "Choose the word most opposite in meaning to “Frugal”:", options: ["Thrifty", "Extravagant", "Careful", "Modest"], answer: 1, explain: "Frugal means economical; extravagant is its opposite." },
  { q: "If CODE is written as DPEF, how is DATA written?", options: ["EBUB", "EBVB", "DBUB", "EBUC"], answer: 0, explain: "Each letter shifts +1: D→E, A→B, T→U, A→B = EBUB." },
];

export const ROADMAPS = [
  {
    role: "Software Engineer",
    steps: [
      { title: "Programming foundations", time: "Month 1–2", detail: "Pick one language (Java/Python/C++). Learn syntax, OOP, recursion and basic problem solving." },
      { title: "Data structures & algorithms", time: "Month 2–5", detail: "Arrays, hashing, trees, graphs, DP. Solve 200+ problems on LeetCode/NeetCode." },
      { title: "CS fundamentals", time: "Month 4–6", detail: "DBMS & SQL, operating systems, computer networks, Git." },
      { title: "Build 2–3 projects", time: "Month 5–7", detail: "A full-stack web app, a REST API with a database, deployed with a live link." },
      { title: "Interview prep", time: "Month 7–8", detail: "Mock interviews, system-design basics, resume polish and applying early." },
    ],
  },
  {
    role: "Data Analyst",
    steps: [
      { title: "Excel & statistics", time: "Month 1", detail: "Pivot tables, lookups, descriptive statistics, probability basics." },
      { title: "SQL mastery", time: "Month 1–2", detail: "Joins, window functions, CTEs, aggregations on real datasets." },
      { title: "Python for data", time: "Month 2–3", detail: "Pandas, NumPy, Matplotlib. Clean and explore messy data." },
      { title: "BI tools", time: "Month 3–4", detail: "Build dashboards in Power BI or Tableau; learn storytelling with data." },
      { title: "Portfolio & case studies", time: "Month 4–5", detail: "3 analysis projects published on GitHub/Kaggle with clear business insights." },
    ],
  },
  {
    role: "Data Scientist",
    steps: [
      { title: "Math & Python", time: "Month 1–2", detail: "Linear algebra, probability, statistics, Python and Pandas." },
      { title: "Classical ML", time: "Month 2–4", detail: "Regression, trees, ensembles, evaluation metrics with scikit-learn." },
      { title: "Deep learning basics", time: "Month 4–6", detail: "Neural nets with PyTorch/TensorFlow; CV or NLP project." },
      { title: "MLOps essentials", time: "Month 6–7", detail: "Experiment tracking, model serving, Docker, cloud basics." },
      { title: "Kaggle & research projects", time: "Month 7–9", detail: "Compete, publish notebooks and write about your results." },
    ],
  },
  {
    role: "Cloud / DevOps Engineer",
    steps: [
      { title: "Linux & networking", time: "Month 1–2", detail: "Shell scripting, processes, permissions, TCP/IP, DNS, HTTP." },
      { title: "Git & CI/CD", time: "Month 2–3", detail: "Branching workflows, GitHub Actions/Jenkins pipelines." },
      { title: "Containers", time: "Month 3–4", detail: "Docker, then Kubernetes fundamentals." },
      { title: "Cloud platform", time: "Month 4–6", detail: "AWS (EC2, S3, IAM, VPC). Earn Cloud Practitioner → Solutions Architect Associate." },
      { title: "Infrastructure as code", time: "Month 6–7", detail: "Terraform, monitoring with Prometheus/Grafana, deploy a real project." },
    ],
  },
  {
    role: "Business Analyst",
    steps: [
      { title: "Business fundamentals", time: "Month 1", detail: "Understand P&L, KPIs, stakeholder management, SDLC." },
      { title: "Excel + SQL", time: "Month 1–2", detail: "Data wrangling, reports and ad-hoc analysis." },
      { title: "Requirement gathering", time: "Month 2–3", detail: "User stories, BRD/FRD documents, process mapping (BPMN)." },
      { title: "Visualization & tools", time: "Month 3–4", detail: "Power BI, Jira, wireframing basics with Figma." },
      { title: "Case-interview practice", time: "Month 4–5", detail: "Structured problem solving, market sizing, communication drills." },
    ],
  },
];
