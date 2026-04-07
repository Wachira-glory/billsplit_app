'use server'


import { createClient as createAuthClient} from '@/utils/server';
import { UNDA_CONFIG } from '@/utils/unda.config';
import { createClient as createUndaClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const UNDA_URL = process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL;
const UNDA_ANON_KEY = process.env.NEXT_PUBLIC_UNDA_SUPABASE_ANON_KEY;
const UNDA_EMAIL = process.env.NEXT_PUBLIC_UNDA_API_EMAIL;
const UNDA_PASSWORD = process.env.UNDA_API_PASSWORD;
const PLATFORM_UID = process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID;


async function getUndaSession() {
  if (!UNDA_URL || !UNDA_ANON_KEY || !UNDA_EMAIL || !UNDA_PASSWORD) {
    throw new Error("Missing Unda Environment Variables");
  }
  //This is where connection with Unda is done
  const tempClient = createUndaClient(UNDA_URL, UNDA_ANON_KEY);
  //This is where the generation of the JWT is done, which will help in queryting the tables
  const { data, error } = await tempClient.auth.signInWithPassword({
    email: UNDA_EMAIL,
    password: UNDA_PASSWORD,
  });

  if (error || !data.session) {
    throw new Error("Unda Auth Failed: " + error?.message);
  }

  return { 
    token: data.session.access_token, 
    apiKey: UNDA_ANON_KEY 
  };
}


export async function triggerMpesaPush(params: {
  amount: number;
  phone: string;
  reference: string;
  customer_name: string;
  active_channel: any; 
  account_id: number;
}) {
  console.log("LOG: Entering triggerMpesaPush (Dedicated Mode)");
  
  // 1. Validate Channel Data
  if (!params.active_channel) {
    console.error("LOG: CRITICAL - active_channel is missing");
    return { success: false, error: "No payment channel selected." };
  }

  // 2. Extract Channel Identity
  const channel = params.active_channel;
  const channelName = channel.name || "Merchant";
  const channelApiKey = channel.api_key;
  
  // We pull the config saved during channel creation (Till 4139377)
  const cfg = channel.config || channel.idata || {};

  try {
    const { token, apiKey } = await getUndaSession();

    const payload = {
  amount: params.amount,
  customer_no: params.phone.replace(/\D/g, '').replace(/^0/, '254'),
  reference: params.reference,
  to_ac_id: params.account_id,
  details: { 
    customer_name: params.customer_name,
    // Remove all the crosscharge/mode hints — the Edge Function ignores them
  }
};

    console.log(`LOG: Triggering STK for ${channelName} using Key: ${channelApiKey?.substring(0, 8)}...`);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_UNDA_SUPABASE_URL}/functions/v1/api-public-channels-mpesa-charge-req?api_key=${channelApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${token}`,
          'x-platform-uid': process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID as string,
          'x-channel-mode': 'dedicated' 
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error("LOG: API Error Response:", result);
      throw new Error(result.error?.message || "M-Pesa Push Failed");
    }

    return { success: true, data: result };

  } catch (error: any) {
    console.error("LOG: Final Catch Error:", error.message);
    return { success: false, error: error.message };
  }
}


export async function getChannelById(channelId: number) {
  try {
    const { token, apiKey } = await getUndaSession();
    
    const response = await fetch(`${UNDA_URL}/rest/v1/channels?id=eq.${channelId}&select=*`, {
      method: 'GET',
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (response.ok && Array.isArray(data) && data.length > 0) {
      return { success: true, data: data[0] };
    }

    return { success: false, error: "Channel not found" };
  } catch (error: any) {
    console.error("getChannelById Error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createAuthClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/signup?message=Could not authenticate user')
  }

  return redirect('/signup?message=Check email to continue sign in')
}

export async function getMerchantChannels(platformId: number = 23, userId?: string) {
  try {
    const { token, apiKey } = await getUndaSession();
    let url = `${UNDA_URL}/rest/v1/channels?p_id=eq.${platformId}&select=*`;
    
    if (userId) url += `&idata->>owner_id=eq.${userId}`;

    const response = await fetch(url, {
      headers: { "apikey": apiKey, "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Failed to fetch channels");

    const sortedData = data.sort((a: any, b: any) => {
      const aDef = a.idata?.is_default ? 1 : 0;
      const bDef = b.idata?.is_default ? 1 : 0;
      return bDef - aDef;
    });

    return { success: true, data: sortedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function syncBillToUnda(billPayload: any) {
  try {
    const { token, apiKey } = await getUndaSession();
    const response = await fetch(`${UNDA_URL}/rest/v1/accounts`, {
      method: 'POST',
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(billPayload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error("Failed to sync bill");
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function getBillFromUnda(slug: string) {
  try {
    const { token, apiKey } = await getUndaSession();
    const billRes = await fetch(`${UNDA_URL}/rest/v1/accounts?slug=eq.${slug}&select=*`, {
      headers: { "apikey": apiKey, "Authorization": `Bearer ${token}` },
      cache: 'no-store'
    });

    const bills = await billRes.json();
    if (!billRes.ok || !bills.length) return { success: false, error: "Bill not found" };
    
    const bill = bills[0];
    const targetChannelId = bill.p_fk?.channel_id;

    const chanRes = await fetch(`${UNDA_URL}/rest/v1/channels?id=eq.${targetChannelId}&select=*`, {
      headers: { "apikey": apiKey, "Authorization": `Bearer ${token}` }
    });

    const channels = await chanRes.json();
    return { 
      success: true, 
      data: { ...bill, active_channel: channels[0] || null } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// export async function triggerMpesaPush(params: {
//   amount: number;
//   phone: string;
//   reference: string;
//   customer_name: string;
//   channel_api_key: string;
//   account_id: number;
// }) {
//   try {
//     const { token, apiKey } = await getUndaSession();

//     let cleanPhone = params.phone.replace(/\D/g, ''); 
//     if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.substring(1);

//     const response = await fetch(
//       `${UNDA_URL}/functions/v1/api-public-channels-mpesa-charge-req?api_key=${params.channel_api_key}`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'apikey': apiKey,
//           'Authorization': `Bearer ${token}`,
//           'x-platform-uid': PLATFORM_UID!
//         },
//         body: JSON.stringify({
//           amount: params.amount,
//           customer_no: cleanPhone,
//           reference: params.reference,
//           to_ac_id: params.account_id,
//           details: { customer_name: params.customer_name }
//         })
//       }
//     );

//     const result = await response.json();
//     if (!response.ok) throw new Error(result.error?.message || "STK Push Failed");

//     return { success: true, data: result.data || result };
//   } catch (error: any) {
//     return { success: false, error: error.message };
//   }
// }


export async function checkPaymentStatus(slug: string) {
  try {
    // 1. Get session (make sure your getUndaSession trims the strings!)
    const { token, apiKey } = await getUndaSession();
    
    const PLATFORM_UID = "2731028a-9103-47aa-8f0e-3a121fbeb2d8";

    // 2. Updated URL to include 'idata' and specific fields just like the CURL
    const url = `${UNDA_URL}/rest/v1/payments?reference=ilike.*${slug}*&select=id,status,amount,uid,idata,data, created_at&order=created_at.desc`;

    console.log("POLLING BY REFERENCE SLUG:", slug);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${token.trim()}`, // .trim() is CRITICAL here to fix the '4 parts' error
        "x-platform-uid": PLATFORM_UID,           // This is what was missing!
        "Content-Type": "application/json"
      },
      cache: 'no-store', // Prevents the browser from showing old 'Pending' data
      next: { revalidate: 0 }
    });

    const payments = await response.json();
    
    if (!response.ok) {
      console.error("REFERENCE QUERY FAILED:", payments);
      return { success: false, allPayments: [] };
    }

    console.log(`POLL SUCCESS: Found ${payments.length} records. Status of first: ${payments[0]?.status}`);
    
    return { 
      success: true, 
      allPayments: Array.isArray(payments) ? payments : [] 
    };
  } catch (error: any) {
    console.error("POLLING ERROR:", error.message);
    return { success: false, allPayments: [] };
  }
}


export async function getPaymentStatusById(id: number) {
  try {
    const { token, apiKey } = await getUndaSession();
    const response = await fetch(`${UNDA_URL}/functions/v1/api-public-payments?id=${id}`, {
      method: "GET",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${token}`,
        "x-platform-uid": PLATFORM_UID!,
      },
    });

    const data = await response.json();
    return { success: true, data: Array.isArray(data) ? data[0] : data };
  } catch (err) {
    return { success: false, error: "Status check failed" };
  }
}