import {
  Calculator,
  RefreshCw,
  Code2,
  Type,
  Palette,
  Briefcase,
  GraduationCap,
  Home,
} from "lucide-react";

// Central catalogue: every navigation count, search result, and tool card reads this registry.
const descriptions = {
  "Basic Calculator":
    "Everyday addition, subtraction, multiplication, and division.",
  "Scientific Calculator":
    "Trigonometry, logarithms, powers, factorials, and more.",
  Percentage: "Calculate a percentage, increase, or decrease.",
  EMI: "Estimate monthly loan payments.",
  Loan: "Estimate monthly payment and total interest.",
  GST: "Add GST to a price.",
  Discount: "Calculate sale price and savings.",
  Age: "Find age from a birth date.",
  BMI: "Estimate BMI from height and weight.",
  Currency: "Live reference-rate conversion for supported currencies.",
  Length: "Convert metric and imperial lengths.",
  Weight: "Convert common weight units.",
  Temperature: "Convert Celsius, Fahrenheit, and Kelvin.",
  Time: "Convert seconds, minutes, hours, and days.",
  "World Clock": "Check live time across international time zones.",
  Area: "Convert square meters, feet, acres, and hectares.",
  "Data Storage": "Convert decimal and binary storage units.",
  "CGPA ↔ Percentage Converter":
    "Convert using the common 10-point CGPA scale.",
  "JSON Formatter": "Format valid JSON with readable indentation.",
  "JSON Validator": "Validate JSON syntax and show a readable error.",
  "JWT Decoder":
    "Decode JWT fields locally. Decoding does not verify its signature.",
  "UUID Generator": "Generate random UUID identifiers.",
  Base64: "Encode and decode Base64 locally.",
  "URL Encoder": "Encode and decode URL components.",
  "Regex Tester": "Test a regular expression against sample text.",
  "SQL Formatter": "Format common SQL statements for readability.",
  "Timestamp Converter": "Convert Unix timestamps and dates.",
  "API Request Builder": "Build and send an HTTP request from a local form.",
  "HTTP Request Generator":
    "Generate fetch, Axios, Java, and cURL request code.",
  "JSON → Java Class Generator": "Turn a JSON object into Java classes.",
  "JSON → TypeScript Interface Generator":
    "Generate TypeScript interfaces from JSON.",
  "JSON → SQL Table Generator": "Generate a CREATE TABLE statement from JSON.",
  "SQL → Java Entity Generator":
    "Generate a Java entity from SQL column definitions.",
  "Java Getter/Setter Generator":
    "Generate Java getters and setters from fields.",
  "Java DTO Generator": "Generate a DTO with fields and constructors.",
  "Spring Boot CRUD Generator":
    "Generate starter entity, repository, service, and controller files.",
  "Regex Explainer": "Explain common regular expression tokens.",
  "Regex Generator": "Generate a pattern from a selected common requirement.",
  "Cron Expression Explainer": "Explain a five-field cron expression.",
  "HTTP Status Code Explorer":
    "Look up the meaning and common causes of an HTTP code.",
  "Git Command Generator": "Generate common Git commands from an operation.",
  ".gitignore Generator": "Generate ignore rules for common project stacks.",
  "Word Counter": "Count words, characters, sentences, and reading time.",
  "Case Converter": "Convert text to upper, lower, or title case.",
  "Text Cleaner": "Trim whitespace and remove repeated blank lines.",
  "Lorem Ipsum": "Generate placeholder text for mockups.",
  "Password Generator": "Generate a random password in your browser.",
  "Text Summarizer": "Extract representative sentences deterministically.",
  "Color Picker": "Inspect a HEX color and view RGB/HSL values.",
  "HEX/RGB/HSL Converter": "Convert a color between HEX, RGB, and HSL.",
  "Gradient Generator": "Create CSS for a linear gradient.",
  "Job Description Keyword Extractor":
    "Extract skills, experience, education, and keywords from job text.",
  "Resume Keyword Matcher": "Compare resume text with a job description.",
  "Resume Bullet Generator":
    "Create truthful resume bullet templates from your details.",
  "ATS Keyword Density Checker":
    "Check keywords, headings, sections, repetition, and formatting signals.",
  "Marks Percentage Calculator":
    "Calculate total, obtained marks, average, and percentage.",
  "Study Time Planner": "Split available study time across subjects.",
  "Pomodoro Timer": "Run focused work and break sessions.",
  "Exam Countdown": "Count down to an exam date.",
  "Attendance Calculator":
    "Calculate current attendance and classes needed to reach a target.",
  "Electricity Bill Estimator":
    "Estimate a bill from usage and your configured rate slabs.",
  "Water Intake Calculator":
    "Estimate a daily water intake baseline from body weight.",
  "Sleep Calculator": "Suggest sleep times in 90-minute cycle intervals.",
  "Trip Cost Calculator": "Estimate fuel use and per-person trip cost.",
};

export const groups = [
  {
    name: "Calculators",
    icon: Calculator,
    description: "Quick, dependable answers for everyday numbers.",
    tools: [
      "Basic Calculator",
      "Scientific Calculator",
      "Percentage",
      "EMI",
      "Loan",
      "GST",
      "Discount",
      "Age",
      "BMI",
    ],
  },
  {
    name: "Converters",
    icon: RefreshCw,
    description: "Convert common units and formats in seconds.",
    tools: [
      "Currency",
      "Length",
      "Weight",
      "Temperature",
      "Time",
      "World Clock",
      "Area",
      "Data Storage",
      "CGPA ↔ Percentage Converter",
    ],
  },
  {
    name: "Developer Tools",
    icon: Code2,
    description: "Small utilities that keep your development flow moving.",
    tools: [
      "JSON Formatter",
      "JSON Validator",
      "JWT Decoder",
      "UUID Generator",
      "Base64",
      "URL Encoder",
      "Regex Tester",
      "SQL Formatter",
      "Timestamp Converter",
      "API Request Builder",
      "HTTP Request Generator",
      "JSON → Java Class Generator",
      "JSON → TypeScript Interface Generator",
      "JSON → SQL Table Generator",
      "SQL → Java Entity Generator",
      "Java Getter/Setter Generator",
      "Java DTO Generator",
      "Spring Boot CRUD Generator",
      "Regex Explainer",
      "Regex Generator",
      "Cron Expression Explainer",
      "HTTP Status Code Explorer",
      "Git Command Generator",
      ".gitignore Generator",
    ],
  },
  {
    name: "Text Tools",
    icon: Type,
    description: "Write, clean, count, and transform text locally.",
    tools: [
      "Word Counter",
      "Case Converter",
      "Text Cleaner",
      "Lorem Ipsum",
      "Password Generator",
      "Text Summarizer",
    ],
  },
  {
    name: "Design Tools",
    icon: Palette,
    description: "Handy color and visual helpers for your next idea.",
    tools: ["Color Picker", "HEX/RGB/HSL Converter", "Gradient Generator"],
  },
  {
    name: "Career Tools",
    icon: Briefcase,
    description:
      "Prepare and tailor application materials with measurable checks.",
    tools: [
      "Job Description Keyword Extractor",
      "Resume Keyword Matcher",
      "Resume Bullet Generator",
      "ATS Keyword Density Checker",
    ],
  },
  {
    name: "Student Tools",
    icon: GraduationCap,
    description: "Plan study time and calculate academic progress.",
    tools: [
      "Marks Percentage Calculator",
      "Study Time Planner",
      "Pomodoro Timer",
      "Exam Countdown",
      "Attendance Calculator",
    ],
  },
  {
    name: "Everyday Tools",
    icon: Home,
    description: "Practical estimates and planning for day-to-day life.",
    tools: [
      "Electricity Bill Estimator",
      "Water Intake Calculator",
      "Sleep Calculator",
      "Trip Cost Calculator",
    ],
  },
];

export const allTools = groups.flatMap((group) =>
  group.tools.map((name) => ({
    name,
    category: group.name,
    description: descriptions[name] || `${name} utility.`,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    keywords: `${group.name} ${name.toLowerCase()}`,
  })),
);
