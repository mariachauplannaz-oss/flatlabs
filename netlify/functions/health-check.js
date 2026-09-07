import { neon } from "@netlify/neon";

export default async function handler(req, context) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);

  try {
    const result = await sql`SELECT COUNT(*)::int AS count FROM tc_versions`;
    
    return new Response(JSON.stringify({ 
      ok: true, 
      tc_versions_count: result[0].count 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export const config = {
  path: "/api/health-check"
};
