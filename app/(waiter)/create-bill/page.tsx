'use client'

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ReceiptText, RefreshCw, Copy, Share2, Printer, Download, CheckCircle2, Landmark } from 'lucide-react';
import { syncBillToUnda, getMerchantChannels } from '@/app/actions/unda';

export default function NewBillPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [billName, setBillName] = useState('Table 7 - Lunch');
  const [totalAmount, setTotalAmount] = useState(12400);
  const [peopleCount, setPeopleCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);
  const [generatedLink, setGeneratedLink] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  const grandTotal = totalAmount;
  const perPersonAmount = Math.floor(grandTotal / peopleCount);

 useEffect(() => {
  const initializePage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile) setUserProfile(profile);

      const result = await getMerchantChannels(23, user.id); 
      
      if (result.success && result.data.length > 0) {
        const active = result.data.find((c: any) => c.idata?.is_default === true) || result.data[0];
        setActiveChannel(active);
      }
    }
    setLoadingChannels(false);
  };

  initializePage();
}, [supabase]);

  const triggerToast = (msg?: string) => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); 
  };

  const handleGenerateBill = async () => {
    if (!activeChannel) return alert("Please wait for payment channels to load.");
    
    setIsSubmitting(true);
    setGeneratedLink(""); 
    
    try {
      const tableId = billName.match(/\d+/)?.[0] || 'X';
      const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const professionalSlug = `T${tableId}-${shortId}`;

      const billPayload = {
        uid: crypto.randomUUID(),
        slug: professionalSlug,
        p_id: 23,
        type: 'BILL',
        status: 'ACTIVE',
        balance: grandTotal,
        p_fk: {
          bill_name: billName,
          people_count: peopleCount,
          per_person: perPersonAmount,
          waiter_ref: userProfile?.full_name || 'Waiter',
          created_at: new Date().toISOString(),
          channel_id: activeChannel.id,
          channel_name: activeChannel.name
        },
        version: 1
      };

      const result = await syncBillToUnda(billPayload);

      if (result.success) {
        const fullPath = `${window.location.origin}/pay/${professionalSlug}`;
        setGeneratedLink(fullPath); 
        triggerToast();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    triggerToast();
  };

  const shareWhatsApp = () => {
    if (!generatedLink) return;
    const message = encodeURIComponent(
      `Hi! Here is the bill for ${billName}. Each person pays KES ${perPersonAmount.toLocaleString()}. Pay here: ${generatedLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px', position: 'relative' }}>
      
      {showToast && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#4caf50', color: '#0a0a0a', padding: '12px 24px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', zIndex: 1000, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <CheckCircle2 size={18} />
          {generatedLink ? "Bill Created!" : "Link Copied!"}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '450px', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <header>
          <p style={{ color: '#4caf50', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>WAITER - CREATE</p>
          <h1 style={{ fontSize: '32px', marginTop: '4px', fontWeight: 'bold', margin: 0 }}>New Bill</h1>
        </header>

        {/* CHANNEL INDICATOR */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '16px', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ color: loadingChannels ? '#666' : '#4caf50' }}>
            {loadingChannels ? <RefreshCw className="animate-spin" size={20} /> : <Landmark size={20} />}
          </div>
          <div>
            <p style={{ fontSize: '10px', color: '#888', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Receiving Via</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
              {loadingChannels ? "Connecting to Unda..." : 
               activeChannel ? `${activeChannel.name} (${activeChannel.idata?.display_uid || 'M-Pesa'})` : 
               "No active channel found"}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>BILL NAME</label>
            <input 
              type="text" 
              value={billName} 
              onChange={(e) => setBillName(e.target.value)}
              style={{ width: '100%', padding: '16px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white', marginTop: '8px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>TOTAL AMOUNT</label>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '18px', color: '#888', fontWeight: 'bold' }}>KES</span>
              <input 
                type="number" 
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '18px 16px 18px 56px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white', fontSize: '28px', fontWeight: 'bold', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222' }}>
            <span style={{ color: '#ccc', fontSize: '14px' }}>People splitting</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #444', background: 'none', color: 'white', cursor: 'pointer' }}>-</button>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{peopleCount}</span>
              <button onClick={() => setPeopleCount(peopleCount + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #444', background: 'none', color: 'white', cursor: 'pointer' }}>+</button>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#052111', border: '1px solid #0a3d1d', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
  <div>
    <p style={{ color: '#4caf50', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0 }}>EACH PERSON PAYS</p>
    <h2 style={{ color: '#4caf50', fontSize: '36px', margin: '4px 0', fontWeight: 'bold' }}>KES {perPersonAmount.toLocaleString()}</h2>
    <p style={{ color: '#2e7d32', fontSize: '10px', margin: 0 }}>
      KES {totalAmount.toLocaleString()} ÷ {peopleCount} people
    </p>
  </div>
  {/* Removed the +50 fee display from here */}
  <div style={{ textAlign: 'right', fontSize: '11px', color: '#2e7d32' }}>
    <p style={{ margin: 0, fontWeight: 'bold' }}>Net Bill</p>
    <p style={{ margin: 0 }}>KES {totalAmount.toLocaleString()}</p>
  </div>
</div>

        <button 
          onClick={handleGenerateBill}
          disabled={isSubmitting || !activeChannel}
          style={{ width: '100%', padding: '20px', backgroundColor: activeChannel ? '#4caf50' : '#333', color: '#0a0a0a', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: (isSubmitting || !activeChannel) ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <ReceiptText size={20} />}
          {isSubmitting ? 'GENERATING...' : 'GENERATE BILL'}
        </button>
      

        <div style={{ opacity: generatedLink ? 1 : 0.4, transition: 'opacity 0.3s' }}>
          <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>SHARE WITH YOUR TABLE</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <input 
              readOnly 
              value={generatedLink || "Generating link..."} 
              style={{ flex: 1, padding: '14px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: generatedLink ? '#4caf50' : '#666', fontSize: '13px', outline: 'none' }}
            />
            <button 
              onClick={copyLink}
              disabled={!generatedLink}
              style={{ padding: '0 20px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Copy
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button disabled style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
              <Printer size={16} /> Print
            </button>
            <button 
              onClick={shareWhatsApp}
              disabled={!generatedLink}
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: '#ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '10px', cursor: 'pointer' }}
            >
              <Share2 size={16} /> WhatsApp
            </button>
            <button disabled style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '14px', borderRadius: '12px', color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}