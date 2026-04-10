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

    if (!Array.isArray(data)) {
      setChannels([]);
      return;
    }

    const userChannels = data.filter((ch: any) => {
      const idata = typeof ch.idata === 'string' ? JSON.parse(ch.idata) : ch.idata;
      
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


const handleCreateChannel = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!user) {
    setError("Login required");
    return;
  }

  setIsCreating(true);
  setError(null);

  try {
    const platformId = Number(process.env.NEXT_PUBLIC_UNDA_PLATFORM_ID) || 23;

    const payload = {
      p_id: platformId,
      uid: `${newUid}-${user.id.substring(0, 8)}`,
      name: newName,
      provider: 'mpesa',
      category: 'inbound',
      mode: 'dedicated',
      status: 'active',
      
      config: {
        short_code: newUid,           
        shortcode_type: 'till_no',    
        crosscharge_enabled: true,    
      },

      idata: {
        is_default: true,
        owner_id: user.id,
        display_uid: newUid,          
      },
    };

  await undaFetch('channels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'x-platform-uid': process.env.NEXT_PUBLIC_UNDA_PLATFORM_UID,
    'Content-Type': 'application/json'
  },
  body: payload,
});

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

    const previousChannels = [...channels];
    setChannels(prev => prev.map(ch => ({
      ...ch,
      idata: { ...ch.idata, is_default: ch.id === channelId }
    })));

    const targetChannel = channels.find(c => c.id === channelId);
    if (!targetChannel) return;

    
    const updateDefault = undaFetch(`channels?id=eq.${channelId}`, {
      method: 'PATCH',
      body: {
        idata: { ...targetChannel.idata, is_default: true }
      },
    });

    const otherChannels = channels.filter(c => c.id !== channelId && c.idata.is_default);
    const updateOthers = otherChannels.map(ch => 
      undaFetch(`channels?id=eq.${ch.id}`, {
        method: 'PATCH',
        body: {
          idata: { ...ch.idata, is_default: false }
        },
      })
    );

    await Promise.all([updateDefault, ...updateOthers]);

  } catch (err: any) {
    console.error("Update failed:", err);
    setError("Could not update default channel. Syncing list...");
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