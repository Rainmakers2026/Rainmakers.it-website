import 'server-only';
import type { Lead } from '@/lib/validation';

type AirtableStatus = 'synced' | 'not_configured' | 'failed' | 'skipped';

export async function syncLeadToAirtable(lead: Lead): Promise<AirtableStatus> {
  if (!lead.submissionType) return 'skipped';
  const token = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = lead.submissionType === 'pitch' ? process.env.AIRTABLE_PITCH_TABLE_ID : process.env.AIRTABLE_CV_TABLE_ID;
  const configured = [token, baseId, process.env.AIRTABLE_PITCH_TABLE_ID, process.env.AIRTABLE_CV_TABLE_ID].some(Boolean);

  if (!configured) return 'not_configured';
  if (!token || !baseId || !tableId) {
    console.error('[airtable] Airtable is partially configured; set API key, base ID and both table IDs');
    return 'failed';
  }

  const fields: Record<string, string | number | boolean> = {
    'First name': lead.firstName,
    'Last name': lead.lastName,
    Email: lead.email,
    Company: lead.company,
    Role: lead.role,
    'Website or LinkedIn': lead.link ?? '',
    'Profile type': lead.profileType,
    Interest: lead.interest ?? '',
    Language: lead.locale,
    Consent: lead.consent,
  };

  if (lead.application) {
    const services = {
      'business-plan': lead.locale === 'it' ? 'Redazione Business Plan' : 'Business plan writing',
      fundraising: lead.locale === 'it' ? 'Supporto per Fund Raising' : 'Fundraising support',
      'business-development': 'Business Development',
      other: lead.locale === 'it' ? 'Altro' : 'Other',
    };
    Object.assign(fields, {
      'Startup name': lead.application.startupName,
      'Company incorporated?': lead.application.companyIncorporated === 'yes' ? (lead.locale === 'it' ? 'Sì' : 'Yes') : (lead.locale === 'it' ? 'No' : 'No'),
      'Incorporation year': lead.application.incorporationYear ?? '',
      'City / Province': lead.application.cityProvince,
      Sector: lead.application.sector,
      Websites: lead.application.websites?.join('\n') ?? '',
      'Service of interest': services[lead.application.serviceInterest],
      'Other service': lead.application.otherService ?? '',
    });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields }], performUpsert: { fieldsToMergeOn: ['Email'] } }),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error('[airtable] Submission failed with status', response.status);
      return 'failed';
    }
    return 'synced';
  } catch (error) {
    console.error('[airtable] Network error', error);
    return 'failed';
  }
}
