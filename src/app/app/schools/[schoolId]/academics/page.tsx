import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";

const LINKS = [
  { href: "subjects", label: "Subjects", description: "Define subjects and which classes take them." },
  { href: "grading", label: "Grading scale", description: "Configure your school's own grading bands." },
  { href: "assessments", label: "Assessments & marks", description: "Create assessments and enter marks." },
  { href: "report-cards", label: "Report cards", description: "View a learner's report card for the current term." },
];

export default async function AcademicsIndexPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  return (
    <div>
      <h2 className="text-lg font-semibold">Academics</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={`/app/schools/${schoolId}/academics/${l.href}`}
            className="tech-card block border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-sky-400/50 hover:bg-white/[0.06]"
          >
            <h3 className="text-base font-semibold text-white">{l.label}</h3>
            <p className="mt-2 text-sm text-white/60">{l.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
