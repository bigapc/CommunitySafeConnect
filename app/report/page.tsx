import ReportForm from "@/components/ReportForm";
import { requireOrganizationAccess } from "@/lib/access";

export default async function ReportPage() {
  await requireOrganizationAccess("/report");

  return (
    <main className="container">
      <h2>Submit a Safety Report</h2>
      <ReportForm />
    </main>
  );
}
