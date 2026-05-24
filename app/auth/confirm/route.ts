// Mirror of /auth/callback for the alternative URL some Supabase email templates
// default to. Both handle ?token_hash=…&type=… and ?code=… uniformly.
export { GET } from "../callback/route";
