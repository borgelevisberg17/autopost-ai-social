export type PlanAccess = { features: string[]; company_status: string };
export function routeAllowed(path: string, access: PlanAccess | null): boolean {
  const required: Record<string, string[]> = {
    "/admin/conversas": ["whatsapp"],
    "/admin/analytics": ["analytics"],
    "/admin/agentes": ["marketing", "sales"],
    "/admin/conteudo": ["marketing"],
    "/admin/aprovacoes": ["marketing"],
    "/admin/automacoes": ["marketing"],
  };
  const features = required[path];
  return !features || !!access && access.company_status === "active" && features.some(f => access.features.includes(f));
}