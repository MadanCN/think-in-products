import type { Metadata } from "next";
import { getAdminCases } from "@/app/actions/portfolio";
import { PortfolioAdminList } from "@/components/admin/portfolio/PortfolioAdminList";

export const metadata: Metadata = { title: "Portfolio — Admin" };

export default async function AdminPortfolioPage() {
  let cases: Awaited<ReturnType<typeof getAdminCases>> = [];
  try {
    cases = await getAdminCases();
  } catch {}
  return <PortfolioAdminList initialCases={cases} />;
}
