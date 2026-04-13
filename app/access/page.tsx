import AccessForm from "@/components/AccessForm";

interface AccessPageProps {
  searchParams: Promise<{
    next?: string;
    sso_error?: string;
  }>;
}

export default async function AccessPage({ searchParams }: AccessPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";
  const ssoError = typeof params.sso_error === "string" ? params.sso_error : "";

  return <AccessForm nextPath={nextPath} ssoError={ssoError} />;
}