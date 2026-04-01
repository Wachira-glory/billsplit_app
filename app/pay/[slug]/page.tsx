"use client";

import React, { useState, useEffect, use } from 'react';
import { Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getBillFromUnda, triggerMpesaPush, checkPaymentStatus, getPaymentStatusById, getChannelById } from '@/app/actions/unda';
import { PaymentCard } from '@/app/components/PaymentCard';
import { QRCodeSVG } from 'qrcode.react';

// Updated helper to handle lowercase/uppercase consistently
const mapUndaStatus = (undaStatus: string): 'paid' | 'pending' | 'failed' => {
  if (!undaStatus) return 'pending';
  const s = undaStatus.toLowerCase();
  if (['completed', 'success', 'paid'].includes(s)) return 'paid';
  if (['failed', 'expired', 'cancelled', 'rejected', 'declined', 'error'].includes(s)) return 'failed';
  return 'pending'; 
};

export default function ParticipantPayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'paid'>('idle');
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);

  // 1. Initial Load: Fetch Bill details
 // 1. Initial Load: Fetch Bill and then fetch its Channel
useEffect(() => {
  const fetchBillAndChannel = async () => {
    if (!slug) return;
    try {
      const result = await getBillFromUnda(slug);
      if (result.success && result.data) {
        const billData = result.data;
        
        // Use the ID we saved in NewBillPage (p_fk.channel_id)
        const channelId = billData.p_fk?.channel_id;
        
        if (channelId) {
          // You'll need an action to fetch a channel by ID
          const channelResult = await getChannelById(channelId); 
          if (channelResult.success) {
            // Attach the full channel object to the bill state
            billData.active_channel = channelResult.data;
          }
        }
        
        setBill(billData);
      } else {
        setError(result.error || "Bill not found");
      }
    } catch (err) {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };
  fetchBillAndChannel();
}, [slug]);


  // 2. Continuous Table Polling - This is seeing the "failed" status in your logs!
  useEffect(() => {
    if (!slug) return;

    const pollTable = async () => {
      try {
        const listResult = await checkPaymentStatus(slug);
        if (listResult?.success) {
          setRecentPayments(listResult.allPayments || []);
        }
      } catch (e) {
        console.error("Polling Error:", e);
      }
    };

    const interval = setInterval(pollTable, 3000);
    pollTable(); 
    
    return () => clearInterval(interval);
  }, [slug]);

  // 3. Button Status Watcher
  useEffect(() => {
    if (!activePaymentId) return;

    const checkPushStatus = async () => {
      try {
        const result = await getPaymentStatusById(activePaymentId);
        if (result.success && result.data) {
          const mapped = mapUndaStatus(result.data.status);

          if (mapped === 'paid') {
            setStatus('paid');
            setActivePaymentId(null);
          } else if (mapped === 'failed') {
            setStatus('idle');
            setActivePaymentId(null);
          }
        }
      } catch (err) {
        console.error("STK poll error", err);
      }
    };

    const interval = setInterval(checkPushStatus, 2000);
    return () => clearInterval(interval);
  }, [activePaymentId]);

const handleSendSTK = async () => {
  if (!phoneNumber || phoneNumber.length < 10) return alert("Enter valid phone");
  
  // Since getBillFromUnda attaches active_channel, we get it here:
  const channel = bill?.active_channel; 
  
  if (!channel?.api_key) {
    return alert("This bill is not linked to a valid payment channel.");
  }

  setStatus('sending');

  const result = await triggerMpesaPush({
    amount: Number(bill.p_fk.per_person),
    phone: phoneNumber,
    reference: bill.slug,
    customer_name: customerName, 
    active_channel: channel, // FIXED: Corrected the 'cactive_channel' typo
    account_id: bill.id,
  });

  if (result.success) {
    setStatus('sent');
    const newId = result.data?.id || result.data?.data?.id;
    if (newId) setActivePaymentId(newId);
  } else {
    setStatus('idle');
    alert(`M-Pesa Error: ${result.error}`);
  }
};

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4 text-[#4caf50]" size={32} />
      <p className="font-bold tracking-widest uppercase text-xs opacity-50">Syncing...</p>
    </div>
  );

  if (error || !bill) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <p className="text-slate-400">{error || "Bill not found."}</p>
    </div>
  );

  if (status === 'paid') return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="bg-[#4caf50] w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} color="#0a0a0a" />
      </div>
      <h1 className="text-3xl font-black mb-2 tracking-tighter italic">PAID</h1>
      <button onClick={() => window.location.reload()} className="px-8 py-4 bg-[#1a1a1a] border border-[#333] rounded-2xl font-bold uppercase text-xs tracking-widest mt-4">Close</button>
    </div>
  );

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white p-6 font-sans">
      <div className="max-w-[480px] mx-auto">
        <div className="text-left mb-8">
          <p className="text-[#4caf50] text-[10px] font-black tracking-widest uppercase mb-2">Checkout</p>
          <h1 className="text-4xl font-black italic tracking-tighter">Your Share</h1>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 mb-8 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tight">{bill?.p_fk?.bill_name}</p>
            <h3 className="text-3xl font-black tracking-tighter italic">KES {bill?.p_fk?.per_person?.toLocaleString()}</h3>
          </div>
          <div className="bg-[#052111] border border-[#0a3d1d] px-3 py-1 rounded-full">
             <p className="text-[9px] text-[#4caf50] font-black uppercase">STK Ready</p>
          </div>
        </div>
        

        <div className="space-y-4 mb-8">
          <input 
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-5 bg-[#111] border border-[#222] rounded-2xl text-white outline-none focus:border-[#4caf50] transition-all"
          />
          <input 
            placeholder="M-Pesa Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-5 bg-[#111] border border-[#222] rounded-2xl text-white outline-none focus:border-[#4caf50] transition-all"
          />
        </div>

        <button 
          onClick={handleSendSTK}
          disabled={status === 'sending' || status === 'sent'}
          className={`w-full p-6 rounded-[22px] font-black text-lg flex items-center justify-center gap-3 transition-all ${
            status === 'sent' ? 'bg-[#1a1a1a] text-[#4caf50] border border-[#222]' : 'bg-[#4caf50] text-[#0a0a0a]'
          }`}
        >
          {status === 'sending' ? <Loader2 className="animate-spin" size={22} /> : <Smartphone size={22} />}
          {status === 'idle' && "Pay with M-Pesa"}
          {status === 'sending' && "Processing..."}
          {status === 'sent' && "Check Your Phone"}
        </button>

        {status === 'sent' && (
          <div className="mt-4 p-5 bg-[#052111] border border-[#0a3d1d] rounded-2xl text-center animate-pulse">
            <p className="text-[#4caf50] text-sm font-bold italic">Waiting for PIN entry...</p>
          </div>
        )}

       <div className="mt-12">
  <div className="flex justify-between items-center mb-6">
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Table Activity</p>
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#4caf50] animate-pulse" />
      <p className="text-[10px] font-black text-[#4caf50] uppercase tracking-widest">Live</p>
    </div>
  </div>

  <div className="space-y-4">
    {recentPayments.length > 0 ? (
      recentPayments.map((p, i) => {
        console.log("Payment Object Structure:", p);

        const displayName =
          p.idata?.customer_name ||
          p.idata?.details?.customer_name ||
          p.data?.details?.customer_name ||
          p.customer_name ||
          (p.customer_no ? `User ...${p.customer_no.slice(-4)}` : "Guest");

        const uiStatus = mapUndaStatus(p.status);

        return (
          <PaymentCard
            key={p.id || i}
            name={displayName}
            phone={p.customer_no || p.uid || "---"}
            amount={p.amount}
            status={uiStatus}
          />
        );
      })
    ) : (
      <div className="py-12 text-center border-2 border-dashed border-[#1a1a1a] rounded-[32px]">
        <p className="text-slate-600 text-sm italic">No activity yet. Be the first!</p>
      </div>
    )}
  </div>

  {/* --- QR Code Section --- */}
  <div className="mt-16 pt-12 border-t border-[#1a1a1a] flex flex-col items-center">
    <div className="bg-white p-3 rounded-[28px] shadow-[0_0_40px_rgba(76,175,80,0.15)] mb-6 transition-transform hover:scale-105">
      <QRCodeSVG
        value={typeof window !== 'undefined' ? window.location.href : ''}
        size={160}
        level="H"
        includeMargin={false}
      />
    </div>

    <div className="text-center">
      <h4 className="text-white font-black italic tracking-tighter text-xl mb-1 uppercase">
        Scan to Join Table
      </h4>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
        Share this bill with others at {bill?.p_fk?.bill_name || "the table"}
      </p>
    </div>

    <div className="mt-12 opacity-20">
      <p className="text-[8px] font-black tracking-[0.5em] uppercase">SplitBill x Unda</p>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}