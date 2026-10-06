import 'server-only';
import type { Lead } from '@/lib/validation';
import { storeLead as storeLeadSupabase, type StoreResult } from '@/lib/supabase/leads';

/** Legacy compatibility shim for older imports; current persistence lives in @/lib/supabase/leads. */
export type { StoreResult };

export async function storeLead(lead: Lead): Promise<StoreResult> {
  return storeLeadSupabase(lead);
}
