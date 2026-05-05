import AccessForm from "@/components/AccessForm";
import { listOrganizations } from "@/lib/tenancy";

interface AccessPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";
  const organizations = listOrganizations().map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));

  return <AccessForm nextPath={nextPath} organizations={organizations} />;
}