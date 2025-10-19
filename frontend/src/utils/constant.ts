interface JourneyItem {
  id: number;
  title: string;
  date: string;
  description: string;
  image: string;
}

export const journeyData: JourneyItem[] = [
  {
    id: 1,
    title: "Completed Bachelor of Engineering in ECE",
    date: "2019 – 2023",
    description:
      "Graduated with a Bachelor’s degree in Electronics and Communication Engineering from a reputed Government Engineering College in Gandhinagar. Built a strong foundation in problem-solving, technology, and logical thinking.",
    image: "/experience/college_complete.png",
  },
  {
    id: 2,
    title: "First Internship — Beginning My Coding Journey",
    date: "Feb 2023 – Apr 2023",
    description:
      "Started my professional journey at Maxgen Technologies, where I learned Python and the fundamentals of the Django framework. Completed a 3-month internship that sparked my interest in backend development and web technologies.",
    image: "/experience/maxgen.png",
  },
  {
    id: 3,
    title: "Junior Odoo Developer at Warlock Technologies",
    date: "May 2023 – Sept 2024",
    description:
      "Joined Warlock Technologies as a Junior Odoo Developer. Gained hands-on experience in Odoo customization, module development, and the OWL (Odoo Web Library) architecture — building expertise from backend logic to frontend UI implementation.",
    image: "/experience/warlock_technologies.png",
  },
  {
    id: 4,
    title: "Odoo Full-Stack Developer at BrowseInfo",
    date: "Nov 2024 – Present",
    description:
      "Currently working at BrowseInfo, one of the leading Odoo service providers. Expanded my skills in Odoo website design, deployment, SEO optimization, and complex website-to-backend integrations. Continuously improving my full-stack Odoo expertise.",
    image: "/experience/Browseinfo.png",
  },
];

export const quotes = [
  {
    id: 1,
    name: "Cristiano Ronaldo",
    quote:
      "Talent without working hard is nothing.",
    image: "/quotes/ranaldo.webp",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: 2,
    name: "Virat Kohli",
    quote:
      "Self-belief and hard work will always earn you success.",
    image: "/quotes/virat.jpg",
    color: "from-orange-500 to-red-500",
  },
  {
    id: 3,
    name: "Linus Torvalds",
    quote:
      "Talk is cheap. Show me the code.",
    image: "/quotes/linus.webp",
    color: "from-blue-500 to-cyan-400",
  },
  {
    id: 4,
    name: "Steve Jobs",
    quote:
      "Stay hungry, stay foolish.",
    image: "/quotes/jobs.jpg",
    color: "from-gray-800 to-gray-600",
  },
  {
    id: 5,
    name: "Warren Buffett",
    quote:
      "The more you learn, the more you earn.",
    image: "/quotes/warren.jpg",
    color: "from-yellow-500 to-amber-400",
  },
];

