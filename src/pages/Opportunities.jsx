import FloatingNav from "../components/FloatingNav.jsx";

function firstSentence(text) {
  if (!text) return "";
  const match = text.match(/^[^.]+\./);
  return match ? match[0] : text.slice(0, 120) + (text.length > 120 ? "…" : "");
}

const opportunities = [
  {
    title: "NYSC Corps Members — Creditville Group",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Creditville Group is recruiting NYSC Corps Members in Lagos State. Gain valuable experience to kick-start your career in finance and investment services. Ideal for graduates in Humanities, Law, Social Sciences, Data Science, and related disciplines.",
    url: "https://ng.linkedin.com/jobs/view/national-youth-service-corps-nysc-members-at-creditville-group-4163530255",
  },
  {
    title: "NYSC Corps Member — Mephalti Technologies",
    type: "Internship",
    location: "Benin City, Nigeria",
    description:
      "Mephalti Technologies is recruiting NYSC Corps Members in Benin City. Open to graduates in Computer Engineering, Mechanical Engineering, Business Administration, Public Administration, and Marketing. Gain hands-on experience in a fast-paced IT consulting environment.",
    url: "https://ng.linkedin.com/jobs/view/nysc-corps-member-at-mephalti-technologies-limited-4134423440",
  },
  {
    title: "National Service Personnel — JD Link",
    type: "Entry Level",
    location: "Nationwide, Nigeria",
    description:
      "JD Link has opened applications for its National Service Personnel (NYSC) Programme for 2026/2027. Positions available in HR, Engineering, Accounting, IT, Business Development, and Procurement. Only First Class Honours or Second Class Upper Division graduates eligible.",
    url: "https://thelagosvoice.com/jd-link-calls-for-applications-national-service-personnel-2026-2027/",
  },
  {
    title: "Trainee Analyst (NYSC) — Arbiterz Nigeria",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Arbiterz Nigeria is seeking a passionate Youth Corper to join their editorial team as a Trainee Analyst for macroeconomic research and editorial content. Must have a minimum of 2.1 in Economics. Monthly stipend of ₦100,000 plus performance bonuses.",
    url: "https://ng.linkedin.com/jobs/view/position-trainee-analyst-nysc-youth-corper-%E2%80%93-must-have-a-2-1-in-economics-at-arbiterz-nigeria-4100044058",
  },
  {
    title: "NYSC Associate — Scott's Legal",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Scott's Legal seeks a called-to-bar NYSC Associate with interest in tech law. Role involves legal research, drafting, advisory, and client support at the intersection of law and technology. Salary: ₦70,000 – ₦150,000.",
    url: "https://www.jobberman.com/listings/nysc-associate-8mmn66",
  },
  {
    title: "Admin Intern (NYSC) — Smartflow Technologies",
    type: "Internship",
    location: "Ojodu-Berger, Lagos, Nigeria",
    description:
      "Smartflow Technologies is looking for a vibrant NYSC corps member to join their administrative team. The role provides foundational experience in office administration, operational support, and corporate management. Open to BSc or HND holders in any field.",
    url: "https://nyscportal.org/apply-for-admin-intern-nysc-job-at-smartflow-technologies-limited/",
  },
  {
    title: "Graduate Trainee Intern — PGE Travels & Education Consulting",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "PGE Travels is seeking a smart, internet-savvy Graduate Trainee Intern for a NYSC Corps Member posted to Lagos. Ideal for Computer Science or IT graduates with basic knowledge of digital marketing and social media management. Salary: ₦70,000 – ₦150,000.",
    url: "https://www.myjobmag.com/job/graduate-trainee-intern-nysc-corps-member-pge-travels-and-education-consulting",
  },
  {
    title: "Brand Officer (NYSC) — Resource Intermediaries Limited",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Resource Intermediaries Limited is hiring a Brand Officer for NYSC corps members. Responsibilities include content creation, social media management, brand consistency, and campaign execution. Ideal for graduates with an interest in branding and digital marketing.",
    url: "https://www.myjobmag.com/job/brand-officer-corp-member-nysc-resource-intermediaries-limited",
  },
  {
    title: "NYSC/First-Year Associates — Permanent Capital Ventures",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Permanent Capital Ventures is seeking a proactive NYSC Corps Member with a Law degree as a Legal Trainee. Hands-on legal experience in a dynamic environment. Minimum Second Class Upper required. Salary: ₦150,000 – ₦250,000.",
    url: "https://www.jobberman.com/listings/nyscfirst-year-associates-d999er",
  },
  {
    title: "Field Sales Officer (NYSC PPA) — Workcentral Nigeria",
    type: "Entry Level",
    location: "Nationwide, Nigeria",
    description:
      "Workcentral Nigeria is offering NYSC PPA opportunities for Field Sales Officers across Nigeria. Ideal for corps members looking to gain hands-on sales and business development experience in a growing company.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Customer Service Intern (NYSC) — Avario Digitals",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Avario Digitals is seeking a Customer Service Intern for their Lagos office. This NYSC opportunity is ideal for graduates with strong communication skills who want to gain experience in client relations and digital services.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "NYSC PPA Opportunities — Internet Solutions Nigeria",
    type: "Entry Level",
    location: "Abuja & Lagos, Nigeria",
    description:
      "Internet Solutions Nigeria (ISN) is looking for highly motivated NYSC Corps Members for departments including Administrative, Commercials, IT/Technical, Project Management, and Service Management. Submit CV to: oluwaseun.moses@isn.ng.",
    url: "https://www.myjobmag.com/job/nysc-ppa-opportunities-internet-solutions",
  },
  {
    title: "IT Security Intern (NYSC) — Dragnet Nigeria",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Dragnet Nigeria is looking for a high-potential NYSC corps member as an IT Security Intern. Hands-on role working on live systems and real security operations. ₦70,000 monthly allowance, company laptop, MiFi, remote work flexibility.",
    url: "https://www.myjobmag.com/job/it-security-intern-nysc-dragnet-nigeria",
  },
  {
    title: "Corp Member (NYSC) — Platform Finance Limited",
    type: "Internship",
    location: "Victoria Island, Lagos, Nigeria",
    description:
      "Platform Finance, a CBN-approved financial company, is seeking a NYSC Corps Member for their Lagos office. Must be posted to Lagos (Lekki axis preferred). Good communication and organizational skills required. ₦70,000 monthly allowance.",
    url: "https://www.myjobmag.com/job/corp-member-nysc-platform-finance-limited",
  },
  {
    title: "Junior Accountant (NYSC) — AllFlavors Supreme Foods",
    type: "Internship",
    location: "Amuwo Odofin, Lagos, Nigeria",
    description:
      "AllFlavors Supreme Foods is offering a NYSC Corps Member position as Junior Accountant in their Finance Team. Ideal for Accounting or Finance graduates seeking hands-on experience in a structured manufacturing environment.",
    url: "https://www.myjobmag.com/job/junior-accountant-nysc-allflavors-supreme-foods",
  },
  {
    title: "NYSC Corps Member — Mikado Nigeria Limited",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Mikado Nigeria is looking for NYSC Corps Members. Preferred graduates in Food Tech, Biochemistry, Electronic Engineering, or Social Sciences. Must be well organized, presentable, and punctual.",
    url: "https://www.myjobmag.com/job/nysc-corps-member-corper-mikado-nigeria-limited",
  },
  {
    title: "Account Intern — Kartel Energy",
    type: "Internship",
    location: "Lagos (Remote), Nigeria",
    description:
      "Kartel Energy is seeking an Account Intern. Open to NYSC corps members or recent graduates in Accounting, Finance, or Economics. Proficiency in Microsoft Excel required. ₦50,000 – ₦100,000/month.",
    url: "https://www.myjobmag.com/job/account-intern-kartel-energy",
  },
  {
    title: "NYSC Corp Member — Primly Premium Solutions",
    type: "Entry Level",
    location: "Abuja (FCT), Nigeria",
    description:
      "Primly Premium Solutions is seeking a motivated NYSC Corps Member for IT support and business technology solutions. Ideal for graduates in Computer Science, IT, Software Engineering, or related disciplines. Application deadline: July 1, 2026.",
    url: "https://jobfetcher.org/jobs/view/nysc-corp-member",
  },
  {
    title: "Architect/Civil Engineer Intern (NYSC) — Popville Luxury Homes",
    type: "Internship",
    location: "Abuja, Nigeria",
    description:
      "Popville Luxury Homes is looking for Corp Members (Architects and Civil Engineers) for a challenging and rewarding PPA experience. Build your portfolio with a top-tier luxury real estate firm in Abuja.",
    url: "https://www.myjobmag.com/jobs/architect-intern-nysc-at-popville-luxury",
  },
  {
    title: "Architecture Design Intern (NYSC) — Spacefinish",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Spacefinish is seeking an Architecture Design Intern (NYSC). Support the Lead Designer in all aspects of the design process from concept to installation. Must have a degree in Architecture or Interior Design. Proficient in Sketchup, Revit, or similar tools.",
    url: "https://ng.linkedin.com/jobs/view/architecture-design-intern-nysc-at-spacefinish-4118870693",
  },
  {
    title: "Accounting Corper — Arco Group PLC",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "ARCO Group Plc is looking for recent Accounting graduates to join for their NYSC service year. Strong attention to detail and analytical skills required. Send CV to: taiwo.adeoladada@arcogroup-nigeria.com.",
    url: "https://ng.linkedin.com/jobs/view/accounting-corper-at-arco-group-plc-4142381633",
  },
  {
    title: "NYSC Corps Member — Lavita Group",
    type: "Internship",
    location: "Abuja, Nigeria",
    description:
      "Lavita Group is seeking a vibrant NYSC Corps Member for marketing support. Assist the marketing team in campaign execution, brand promotion, and lead generation. Creative and confident candidates preferred.",
    url: "https://jobbernaija.com/job/nysc-corps-member-at-lavita-group-internship-jobs-in-abuja",
  },
  {
    title: "Graduate Internship Program — GIG Logistics",
    type: "Internship",
    location: "Lagos & Edo, Nigeria",
    description:
      "GIG Logistics (GIGL) has opened applications for its 2026 Graduate Internship Program for NYSC corps members. Placements in HR, Organizational Development, and Corporate Operations. Second Class Upper required. Under 28 years old.",
    url: "https://crispng.com/gig-logistics-graduate-internship-program-2026/",
  },
  {
    title: "Graduate Associate Programme — PwC Nigeria",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "PricewaterhouseCoopers (PwC) Nigeria is hiring for its 2026 Graduate Associate Programme. Open to post-NYSC graduates with minimum Second Class Upper and 5 O'Level credits. Applications close April 14, 2026.",
    url: "https://jobnow.ng/pricewaterhousecoopers-pwc-nigeria-graduate-associate-programme-2026/",
  },
  {
    title: "Ingenious Graduate Trainee Program — Oilserv Limited",
    type: "Entry Level",
    location: "Port Harcourt & Lagos, Nigeria",
    description:
      "Oilserv Limited is offering a structured two-year Graduate Trainee Program for post-NYSC graduates in Engineering and Energy. Minimum Second Class Upper required. Under 28 years old. Application deadline: March 6, 2026.",
    url: "https://deroundtable.com/oilserv-limited-ingenious-graduate-trainee-program-2026-apply-now/",
  },
  {
    title: "Graduate Trainee Program — Snapnet Limited",
    type: "Entry Level",
    location: "Lagos & Abuja, Nigeria",
    description:
      "Snapnet Limited is offering a one-year structured training and mentorship program for fresh graduates. Live project exposure, monthly stipends, HMO coverage, and a guaranteed pathway to full-time employment upon completion.",
    url: "https://recruitmentblueprint.com.ng/snapnet-graduate-trainee-program-2026/",
  },
  {
    title: "Graduate Trainee Program — Scib Nigeria & Company",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Scib Nigeria & Company Limited, a premier corporate insurance brokerage, is offering a Graduate Trainee Program with cross-functional rotations across strategic business units. Open to graduates with strong analytical and communication skills.",
    url: "https://www.jobsregion.com/scib-nigeria-graduate-trainee-program/",
  },
  {
    title: "Graduate Trainee (Electrical & Solar) — Basscomm Group",
    type: "Internship",
    location: "Maryland, Lagos, Nigeria",
    description:
      "Basscomm Group Limited is hiring Electrical & Solar Engineering Graduate Trainees (NYSC Interns). Gain hands-on experience with complex electrical systems and modern renewable energy technologies. BSc/B.Eng in Electrical/Electronic Engineering required.",
    url: "https://penimade.com/graduate-trainee-electrical-solar-nysc-ppa-at-basscomm-group-lagos/",
  },
  {
    title: "NYSC Corps Member — Styaks Legal (PSSP)",
    type: "Internship",
    location: "Abuja (FCT), Nigeria",
    description:
      "A licensed Payment Solution Service Provider (PSSP) is recruiting NYSC Corps Members for Customer Success, Finance & Accounting, and Technical Operations. Degree in CS, Accounting, Business Admin, or related fields. Minimum 9 months remaining in service year.",
    url: "https://jobnow.ng/nysc-corps-member-corper-at-a-licensed-payment-solution-service-provider-pssp-styaks-legal/",
  },
  {
    title: "Frontend Development Intern — FlexiSAF Edusoft",
    type: "Internship",
    location: "Abuja, Nigeria",
    description:
      "FlexiSAF Edusoft Limited is offering a Frontend Development Internship program open to NYSC corps members. Learn Software Development through a structured curriculum with no cost. On-site placement required during NYSC.",
    url: "https://ng.linkedin.com/jobs/view/frontend-development-intern-at-flexisaf-edusoft-limited-4181191431",
  },
  {
    title: "Frontend Engineer Intern — OptivaHR",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "OptivaHR is seeking a Frontend Engineer Intern to build and improve their recruitment platform. React, Next.js, TypeScript, and Redux required. ₦50,000 monthly allowance. Remote position with mentorship from experienced developers.",
    url: "https://ng.linkedin.com/jobs/view/frontend-engineer-intern-at-optivahr-4122184178",
  },
  {
    title: "Backend Developer Intern — GO54 (formerly Whogohost)",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "GO54, a leading domain and hosting company in Nigeria, is seeking a Backend Developer Intern for a 6-month internship. Knowledge of PHP, relational databases, and version control (Git) required. ₦50,000 monthly allowance. Hybrid work model.",
    url: "https://ng.linkedin.com/jobs/view/backend-developer-intern-at-go54-formerly-whogohost-3778281523",
  },
  {
    title: "NYSC Member (Accounting) — Arit of Africa Limited",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Arit of Africa Limited is seeking a NYSC Member with an Accounting background. Fresh graduate with B.Sc/HND in Accounting. Strong organizational skills and proficiency in Microsoft Office required.",
    url: "https://www.myjobmag.com/job/nysc-member-accounting-background-arit-of-africa-limited-2",
  },
  {
    title: "Graduate Trainee Program — Ardova Plc",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Ardova Plc is recruiting for its 2026 Graduate Trainee Recruitment program. Open to post-NYSC graduates looking to build a career in the oil and gas downstream sector.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Graduate Trainee Program — African Industries Group (AIG)",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "African Industries Group is offering Graduate Trainee positions in Metallurgical Engineering and Mechanical Engineering. Structured training program for post-NYSC graduates.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Medical Doctor (Post NYSC) — Sigma Consulting Group",
    type: "Entry Level",
    location: "Ikorodu, Lagos, Nigeria",
    description:
      "Sigma Consulting Group is seeking a Medical Doctor (Post NYSC) for a hospital in Ikorodu. Morning/weekend shift. Salary: ₦300,000 – ₦350,000. Accommodation provided. MBBS required.",
    url: "https://ng.linkedin.com/jobs/view/medical-doctor-post-nysc-at-sigma-consulting-group-4176441084",
  },
  {
    title: "NYSC Survey Data Analysis Intern — R-DATS Consulting",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "R-DATS Consulting is seeking a NYSC Survey Data Analysis Intern with proficiency in Stata or SPSS. Ideal for graduates interested in research, data analysis, and monitoring & evaluation.",
    url: "https://www.myjobmag.com/job/account-intern-kartel-energy",
  },
  {
    title: "NYSC Product & Project Manager (Scrum) — Wazobia Technologies",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Wazobia Technologies is seeking a NYSC member for a Product & Project Manager role using Scrum methodology. Ideal for tech-savvy corps members interested in agile project management.",
    url: "https://www.myjobmag.com/job/nysc-member-accounting-background-arit-of-africa-limited-2",
  },
  {
    title: "Internal Control Officer (NYSC) — Zotmann International",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Zotmann International Limited is hiring an Internal Control Officer for their NYSC intake. Ideal for accounting or finance graduates with strong analytical skills.",
    url: "https://www.myjobmag.com/job/account-intern-kartel-energy",
  },
  {
    title: "Junior Accountant (NYSC) — Zotmann International",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Zotmann International Limited is seeking a Junior Accountant (NYSC Corps Member). Ideal for Accounting or Finance graduates seeking hands-on experience in a corporate environment.",
    url: "https://www.myjobmag.com/job/account-intern-kartel-energy",
  },
  {
    title: "Graduate Trainee (Finance) — Agri Seed Co",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Agri Seed Co is seeking a Graduate Trainee in Finance. Structured program for post-NYSC graduates looking to build a career in the agricultural sector.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "NYSC Intern — J-Six Group",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "J-Six Group is offering NYSC internship opportunities. Gain professional experience across various departments in a dynamic corporate environment.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Front Desk Intern (NYSC) — Norrenberger Financial Group",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Norrenberger Financial Group is seeking a Front Desk Intern (NYSC Corps Member). Ideal for graduates looking to gain customer service and administrative experience in a financial services environment.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Sales Support Intern (NYSC) — Sygnite Power",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Sygnite Power and Infrastructure is seeking a Sales Support Intern (NYSC). Ideal for graduates looking to gain experience in sales support within the energy sector.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Administrative Assistant (NYSC) — Nuvelle Consulting",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Nuvelle Consulting is seeking an Administrative Assistant (NYSC Corps Member). Support daily administrative functions and gain experience in a consulting environment.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "NYSC Corps Member — Lamlan Digital Limited",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "Lamlan Digital Limited is seeking a tech-savvy NYSC Corps Member. Ideal for graduates with digital marketing, social media, and content creation skills.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Graduate Trainee (Electrical Engineer) — The Candel FZE",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "The Candel FZE is seeking a Graduate Trainee in Electrical Engineering. Structured program for post-NYSC graduates in the energy sector.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Finance Intern — BAP Energy Limited",
    type: "Internship",
    location: "Lagos, Nigeria",
    description:
      "BAP Energy Limited is seeking a Finance Intern. Ideal for NYSC corps members or recent graduates in Accounting, Finance, or related fields.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "NYSC Corps Member — AGS Movers",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "AGS Movers is offering NYSC PPA opportunities in Lagos. Gain experience in logistics and moving services.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Hub Manager — Ezzyrun",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Ezzyrun is seeking a Hub Manager. Ideal for NYSC corps members looking to gain operations and management experience in a tech-driven company.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "Field Sales Executive — Periculum",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Periculum is seeking a Field Sales Executive. Ideal for NYSC corps members looking to gain hands-on sales and business development experience.",
    url: "https://ng.linkedin.com/jobs/corps-member-jobs",
  },
  {
    title: "NYSC Corps Member — Victoria Waterfront Hotel & Resorts",
    type: "Entry Level",
    location: "Lagos, Nigeria",
    description:
      "Victoria Waterfront Hotel & Resorts is seeking a tech-savvy NYSC Corps Member for Technical Operations. Hybrid of desktop IT support and NOC monitoring. Computer Science or Engineering background required.",
    url: "https://www.myjobmag.com/job/nysc-corps-member-ppa-victoria-waterfront-hotel-resorts",
  },
];

export default function Opportunities() {
  return (
    <div className="site-page">
      <FloatingNav />
      <section className="panel full-panel opportunities-panel">
        <div className="panel-heading">
          <div>
            <h2>Opportunities</h2>
            <p>Jobs, internships, grants, scholarships, and business resources for NYSC corps members.</p>
          </div>
        </div>

        <div className="opportunity-grid">
          {opportunities.map((item) => (
            <article className="opportunity-card" key={item.title}>
              <span className="category-label">{item.type}</span>
              <h3>{item.title}</h3>
              <p>{firstSentence(item.description)}</p>
              <div className="opportunity-meta">{item.location}</div>
              <a className="primary-button" href={item.url} target="_blank" rel="noreferrer">
                View Opportunity
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
