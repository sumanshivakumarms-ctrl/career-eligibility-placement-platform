/** Option lists + learning resources used across forms and the eligibility engine. */

export const DEGREES = [
  "B.E / B.Tech",
  "B.Sc",
  "BCA",
  "B.Com",
  "BBA",
  "Diploma",
  "M.E / M.Tech",
  "MCA",
  "MBA",
  "M.Sc",
];

export const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Data Science & AI",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical",
  "Civil",
  "Commerce & Finance",
  "Business Administration",
  "Mathematics & Statistics",
  "Other",
];

export const SKILLS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C",
  "C++",
  "SQL",
  "HTML/CSS",
  "React",
  "Node.js",
  "Git",
  "Data Structures",
  "Algorithms",
  "System Design",
  "Problem Solving",
  "Machine Learning",
  "Statistics",
  "Cloud (AWS)",
  "Docker",
  "Linux",
  "Networking",
  "Excel",
  "Power BI",
  "Tableau",
  "Communication",
  "Aptitude",
  "Financial Modelling",
  "Accounting",
  "Cybersecurity",
  "Spring Boot",
  "Figma",
  "Testing / QA",
];

export const LOCATIONS = [
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Mumbai",
  "Delhi NCR",
  "Kolkata",
  "Remote",
];

export const ROLE_CATEGORIES = [
  "Software Engineer",
  "Frontend Engineer",
  "Data Analyst",
  "Data Scientist",
  "Cloud / DevOps Engineer",
  "Business Analyst",
  "Finance Analyst",
  "Consultant",
  "QA / Testing",
  "Core Engineering",
];

export const GRAD_YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029];

export type Course = { title: string; provider: string; url: string };

const COURSES: Record<string, Course> = {
  JavaScript: { title: "The Modern JavaScript Course", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/" },
  TypeScript: { title: "TypeScript Handbook", provider: "typescriptlang.org", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
  Python: { title: "Python for Everybody", provider: "Coursera", url: "https://www.coursera.org/specializations/python" },
  Java: { title: "Java Programming Masterclass", provider: "Udemy", url: "https://www.udemy.com/topic/java/" },
  C: { title: "C Programming for Beginners", provider: "NPTEL", url: "https://nptel.ac.in/courses/106105171" },
  "C++": { title: "C++ Programming", provider: "NPTEL", url: "https://nptel.ac.in/courses/106105151" },
  SQL: { title: "SQL for Data Science", provider: "Coursera", url: "https://www.coursera.org/learn/sql-for-data-science" },
  "HTML/CSS": { title: "Responsive Web Design", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/" },
  React: { title: "React – Official Tutorial", provider: "react.dev", url: "https://react.dev/learn" },
  "Node.js": { title: "Node.js Guides", provider: "nodejs.org", url: "https://nodejs.org/en/learn" },
  Git: { title: "Pro Git (free book)", provider: "git-scm.com", url: "https://git-scm.com/book/en/v2" },
  "Data Structures": { title: "Data Structures & Algorithms Specialization", provider: "Coursera", url: "https://www.coursera.org/specializations/data-structures-algorithms" },
  Algorithms: { title: "Algorithms, Part I", provider: "Coursera (Princeton)", url: "https://www.coursera.org/learn/algorithms-part1" },
  "System Design": { title: "System Design Primer", provider: "GitHub", url: "https://github.com/donnemartin/system-design-primer" },
  "Problem Solving": { title: "Daily practice: 150 curated problems", provider: "LeetCode / NeetCode", url: "https://neetcode.io/practice" },
  "Machine Learning": { title: "Machine Learning Specialization", provider: "Coursera (Andrew Ng)", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
  Statistics: { title: "Statistics with Python", provider: "Coursera", url: "https://www.coursera.org/specializations/statistics-with-python" },
  "Cloud (AWS)": { title: "AWS Cloud Practitioner Essentials", provider: "AWS Skill Builder", url: "https://explore.skillbuilder.aws/learn" },
  Docker: { title: "Docker Get Started", provider: "docker.com", url: "https://docs.docker.com/get-started/" },
  Linux: { title: "Linux Foundation – Intro to Linux", provider: "edX", url: "https://www.edx.org/learn/linux" },
  Networking: { title: "Computer Networking Fundamentals", provider: "Cisco Networking Academy", url: "https://www.netacad.com/" },
  Excel: { title: "Excel Skills for Business", provider: "Coursera", url: "https://www.coursera.org/specializations/excel" },
  "Power BI": { title: "Microsoft Power BI Data Analyst", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/" },
  Tableau: { title: "Tableau Training", provider: "Tableau", url: "https://www.tableau.com/learn/training" },
  Communication: { title: "Improve Your English Communication Skills", provider: "Coursera", url: "https://www.coursera.org/specializations/improve-english" },
  Aptitude: { title: "Quantitative Aptitude Practice", provider: "IndiaBix", url: "https://www.indiabix.com/aptitude/questions-and-answers/" },
  "Financial Modelling": { title: "Financial Modeling & Valuation", provider: "Wall Street Prep / CFI", url: "https://corporatefinanceinstitute.com/course/free-financial-modeling-course/" },
  Accounting: { title: "Financial Accounting Fundamentals", provider: "Coursera", url: "https://www.coursera.org/learn/wharton-accounting" },
  Cybersecurity: { title: "Google Cybersecurity Certificate", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/google-cybersecurity" },
  "Spring Boot": { title: "Spring Boot Tutorial", provider: "spring.io", url: "https://spring.io/guides" },
  Figma: { title: "Figma for Beginners", provider: "Figma", url: "https://help.figma.com/hc/en-us/articles/360040328273" },
  "Testing / QA": { title: "Software Testing Fundamentals", provider: "ISTQB / Udemy", url: "https://www.istqb.org/certifications/certified-tester-foundation-level" },
};

/** Recommended course for a skill (falls back to a search link). */
export function courseFor(skill: string): Course {
  return (
    COURSES[skill] ?? {
      title: `Learn ${skill}`,
      provider: "Coursera",
      url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
    }
  );
}

export const LANDING_TESTIMONIALS = [
  {
    name: "Ananya Rao",
    role: "Software Engineer, placed via campus drive",
    quote:
      "I thought I was 'not eligible' for most drives. CareerPath showed me exactly two skills I was missing — I closed the gap in 3 weeks and landed my offer.",
  },
  {
    name: "Rohit Mehta",
    role: "Data Analyst, career switcher",
    quote:
      "The skill-gap analysis and roadmap were gold. I switched from mechanical to analytics with a clear plan and real deadlines to chase.",
  },
  {
    name: "Priya Nair",
    role: "Placement Officer, engineering college",
    quote:
      "Managing criteria and exporting applicants to CSV saved our team days of spreadsheet work every placement season.",
  },
];
