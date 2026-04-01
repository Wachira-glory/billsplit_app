"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, CheckCircle2, Loader2, AlertTriangle, Hash } from 'lucide-react';
import { supabase, undaFetch } from '@/app/lib/supabaseClient';

interface Channel {
  id: number;
  uid: string;
  name: string;
  idata: {
    is_default: boolean;
    owner_id: string;
    display_uid?: string;
  };
}

export default function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

const fetchChannels = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const platformUid = process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID;
    console.log('Fetching for Platform UUID:', platformUid);

    const data = await undaFetch('functions/v1/api-public-channels', {
      method: 'GET',
      headers: {
        'x-platform-uid': platformUid as string,
      },
    });

    console.log('Raw data from Edge Function:', data);

    // 1. Ensure data is an array
    if (!Array.isArray(data)) {
      setChannels([]);
      return;
    }

    // 2. Robust filtering
    const userChannels = data.filter((ch: any) => {
      // Handle cases where idata might be a string (JSONB oddity) or undefined
      const idata = typeof ch.idata === 'string' ? JSON.parse(ch.idata) : ch.idata;
      
      // Match the owner_id to the logged in user
      return idata?.owner_id === user.id;
    });

    console.log('Filtered User Channels:', userChannels);
    setChannels(userChannels);

  } catch (err: any) {
    console.error('Fetch failed:', err.message);
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

//  const handleCreateChannel = async (e: React.FormEvent) => {
//   e.preventDefault();
  
//   // 1. Get fresh user context
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) {
//     setError("Login required");
//     return;
//   }

//   console.log('Registering channel for User:', user.id);

//   setIsCreating(true);
//   setError(null);

//   try {
//     // 2. Generate a unique UID to avoid 409 Conflict errors
//     const uniqueUid = `${newUid}-${user.id.substring(0, 8)}`;

//     // 3. POST the payload exactly as the database expects it
//     await undaFetch('channels', {
//       method: 'POST',
//       body: {
//         p_id: 23, // Ensure this is a number
//         uid: uniqueUid,
//         name: newName,
//         provider: 'mpesa',
//         category: 'inbound',
//         mode: 'child',
//         parent_channel_id: 2,
//         status: 'active',
//         idata: {
//           is_default: true,
//           owner_id: user.id, // Links the channel to the logged-in user
//           display_uid: newUid, // The human-readable paybill number
//         },
//       },
//     });

//     // 4. Success cleanup
//     setNewUid('');
//     setNewName('');
    
//     // Refresh the list immediately
//     await fetchChannels();
    
//   } catch (err: any) {
//     console.error("Creation Error:", err);
//     // User-friendly error for duplicate paybills
//     if (err.message?.includes('unique') || err.message?.includes('409')) {
//       setError("This paybill is already registered.");
//     } else {
//       setError(err.message || "Failed to create channel.");
//     }
//   } finally {
//     setIsCreating(false);
//   }
// };

const handleCreateChannel = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    setError("Login required");
    return;
  }

  setIsCreating(true);
  setError(null);

  try {
    const platformId = Number(process.env.NEXT_PUBLIC_UNDA_PLATFORM_ID) || 23;

    // Build the payload for a Dedicated Till
    const payload = {
      p_id: platformId,
      uid: `${newUid}-${user.id.substring(0, 8)}`, // Unique ID for Unda
      name: newName,
      provider: 'mpesa',
      category: 'inbound',
      mode: 'dedicated', // Crucial: This makes it a standalone "VIP" channel
      status: 'active',
      
      // THIS IS WHAT THE EDGE FUNCTION READS
      config: {
        short_code: newUid,           // e.g., "4139377"
        shortcode_type: 'till_no',    // Explicitly set for Buy Goods
        crosscharge_enabled: true,    // Triggers the special routing
      },

      idata: {
        is_default: true,
        owner_id: user.id,
        display_uid: newUid,          // What shows up in your UI
      },
    };

    await undaFetch('channels', {
      method: 'POST',
      body: payload,
    });

    // Cleanup
    setNewUid('');
    setNewName('');
    await fetchChannels();
    
  } catch (err: any) {
    console.error("Creation Error:", err);
    setError(err.message || "Failed to create dedicated till.");
  } finally {
    setIsCreating(false);
  }
};

  const setDefaultChannel = async (channelId: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Optimistic UI update: Toggle checkmarks immediately
    const previousChannels = [...channels];
    setChannels(prev => prev.map(ch => ({
      ...ch,
      idata: { ...ch.idata, is_default: ch.id === channelId }
    })));

    const targetChannel = channels.find(c => c.id === channelId);
    if (!targetChannel) return;

    // 2. Define the updates
    // Set the new default
    const updateDefault = undaFetch(`channels?id=eq.${channelId}`, {
      method: 'PATCH',
      body: {
        idata: { ...targetChannel.idata, is_default: true }
      },
    });

    // Set all others to false
    const otherChannels = channels.filter(c => c.id !== channelId && c.idata.is_default);
    const updateOthers = otherChannels.map(ch => 
      undaFetch(`channels?id=eq.${ch.id}`, {
        method: 'PATCH',
        body: {
          idata: { ...ch.idata, is_default: false }
        },
      })
    );

    // 3. Execute all updates in parallel
    await Promise.all([updateDefault, ...updateOthers]);

  } catch (err: any) {
    console.error("Update failed:", err);
    setError("Could not update default channel. Syncing list...");
    // Rollback or refresh on error
    fetchChannels();
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 flex items-center gap-3">
          <AlertTriangle size={20} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
            <Plus size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Add Paybill</h2>
        </div>

        <form onSubmit={handleCreateChannel} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Account Name</label>
            <input
              required
              placeholder="Personal Till"
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold border-2 border-transparent focus:border-purple-200 transition-all text-black"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Till / Paybill Number</label>
            <div className="relative">
              <input
                required
                placeholder="123456"
                className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-mono font-bold border-2 border-transparent focus:border-purple-200 transition-all text-black"
                value={newUid}
                onChange={e => setNewUid(e.target.value)}
              />
              <Hash className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            </div>
          </div>
          <button
            disabled={isCreating}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-purple-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : 'Register Channel'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] ml-6">Your Verified Channels</h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-purple-600" size={32} />
          </div>
        ) : channels.length === 0 ? (
          <div className="bg-slate-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
            <p className="font-black text-slate-400">No channels found.</p>
          </div>
        ) : (
          channels.map(channel => (
            <div
              key={channel.id}
              className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${channel.idata?.is_default ? 'bg-white border-purple-500 shadow-xl' : 'bg-white border-slate-50'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${channel.idata?.is_default ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <CreditCard size={28} />
                </div>
                <div>
                  <p className="font-black text-xl text-slate-900 leading-tight">{channel.name}</p>
                  <p className="text-xs font-mono font-bold text-purple-500">
                    {channel.idata?.display_uid || "Verified"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDefaultChannel(channel.id)}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase ${channel.idata?.is_default ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                {channel.idata?.is_default
                  ? <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Active</span>
                  : 'Use'
                }
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}