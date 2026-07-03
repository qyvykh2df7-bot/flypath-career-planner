import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";

type SchoolRow = {
  name: string | null;
  slug: string | null;
  city: string | null;
  data_status: string | null;
};

export const dynamic = "force-dynamic";

/** Página de debug interna: no debe indexarse. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "32px 24px",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#0f172a",
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: "#64748b",
};

const okStyle: React.CSSProperties = {
  marginTop: 18,
  padding: "10px 14px",
  borderRadius: 8,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 14,
  fontWeight: 600,
  display: "inline-block",
};

const errorStyle: React.CSSProperties = {
  marginTop: 18,
  padding: "10px 14px",
  borderRadius: 8,
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: 14,
  fontWeight: 600,
};

const totalStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 14,
  color: "#0f172a",
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  marginTop: 20,
};

const itemStyle: React.CSSProperties = {
  padding: "10px 0",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 14,
  lineHeight: 1.5,
};

const nameStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#0f172a",
};

const metaStyle: React.CSSProperties = {
  color: "#64748b",
};

export default async function SupabaseTestPage() {
  const { data, error } = await supabase
    .from("schools")
    .select("name, slug, city, data_status")
    .order("name", { ascending: true });

  if (error) {
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>Supabase test</h1>
        <p style={subtitleStyle}>Página temporal de verificación de conexión.</p>
        <div style={errorStyle}>Error loading schools: {error.message}</div>
      </main>
    );
  }

  const rows: SchoolRow[] = (data ?? []) as SchoolRow[];

  if (rows.length === 0) {
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>Supabase test</h1>
        <p style={subtitleStyle}>Página temporal de verificación de conexión.</p>
        <p style={totalStyle}>No schools found.</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>Supabase test</h1>
      <p style={subtitleStyle}>Página temporal de verificación de conexión.</p>
      <div style={okStyle}>Supabase connection OK</div>
      <p style={totalStyle}>Total schools: {rows.length}</p>
      <ul style={listStyle}>
        {rows.map((row, idx) => (
          <li key={`${row.slug ?? "row"}-${idx}`} style={itemStyle}>
            <span style={nameStyle}>{row.name ?? "—"}</span>
            <span style={metaStyle}>
              {" · "}
              slug: {row.slug ?? "—"}
              {" · "}
              city: {row.city ?? "—"}
              {" · "}
              data_status: {row.data_status ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
