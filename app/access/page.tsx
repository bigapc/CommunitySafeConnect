import AccessForm from "@/components/AccessForm";

interface AccessPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";

  return <AccessForm nextPath={nextPath} />;
}