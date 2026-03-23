// 'use client'

// import React, { useState, useEffect, use } from 'react';
// import { createBrowserClient } from '@supabase/ssr';
// import { QRCodeSVG } from 'qrcode.react'; 
// import { Smartphone, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
// import { getBillFromUnda, triggerMpesaPush } from '@/app/actions/unda';

// export default function ParticipantPayPage({ params }: { params: Promise<{ slug: string }> }) {
//   const supabase = createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );

//   // Unwrap params using the use() hook for Next.js 15 compatibility
//   const { slug } = use(params);

//   const [bill, setBill] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [customerName, setCustomerName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchBill = async () => {
//       if (!slug) return;

//       try {
//         const result = await getBillFromUnda(slug);

//         if (result.success && result.data) {
//           setBill(result.data);
//         } else {
//           console.error("Fetch error:", result.error);
//           setError(result.error || "Bill not found");
//         }
//       } catch (err) {
//         console.error("System error:", err);
//         setError("Failed to connect to payment system");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchBill();
//   }, [slug]);

// const handleSendSTK = async () => {
//   if (!phoneNumber || phoneNumber.length < 10) return alert("Please enter a valid phone number");
  
//   // This comes from the 'active_channel' we attached in the server action above
// const channelApiKey = bill?.active_channel?.api_key;
//   if (!channelApiKey) {
//     // Debugging: Log the bill object to see what's inside if it fails
//     console.log("Current Bill Data:", bill);
//     return alert("This merchant has no active payment channel.");
//   }

//   setStatus('sending');
  
//   const result = await triggerMpesaPush({
//     amount: Number(bill.p_fk.per_person),
//     phone: phoneNumber,
//     reference: bill.slug,
//     customer_name: customerName || "Customer",
//     channel_api_key: channelApiKey,
//     account_id: bill.id // CRITICAL: Pass the internal ID for reconciliation
//   });

//   if (result.success) {
//     setStatus('sent');
//   } else {
//     setStatus('failed');
//     alert(`Failed: ${result.error}`);
//   }
// };

//   if (loading) return (
//     <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
//       <Loader2 className="animate-spin mb-4" size={32} />
//       <p className="font-bold">Loading Bill...</p>
//     </div>
//   );

//   if (error || !bill) return (
//     <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
//       <AlertCircle className="text-red-500 mb-4" size={48} />
//       <h2 className="text-2xl font-bold mb-2">Oops!</h2>
//       <p className="text-slate-400">{error || "Bill not found."}</p>
//     </div>
//   );

//   return (
//     <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '24px', fontFamily: 'sans-serif' }}>
      
//       <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
//         <div style={{ textAlign: 'left' }}>
//           <p style={{ color: '#4caf50', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>PARTICIPANT - PAY</p>
//           <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0 24px 0' }}>Your Share</h1>
//         </div>

//         {/* MERCHANT INFO - NOW DYNAMIC */}
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
//           <div style={{ width: '48px', height: '48px', backgroundColor: '#1a1a1a', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', color: '#4caf50', border: '1px solid #333' }}>
//             {bill.p_fk?.bill_name?.charAt(0) || 'S'}
//           </div>
//           <div>
//           <h3 style={{ margin: 0, fontSize: '16px' }}>{bill.p_fk?.bill_name || "Merchant"}</h3>
//           <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
//             Verified merchant · {bill.active_channel?.name || "M-Pesa"} {bill.active_channel?.idata?.display_uid || ""}
//           </p>
//         </div>
//         </div>

//         {/* BILL SUMMARY CARD */}
//         <div style={{ backgroundColor: '#1a1a1d', border: '1px solid #333', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
//           <div>
//             <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px 0' }}>TOTAL BILL</p>
//             <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
//               <span style={{ fontSize: '14px', color: '#888' }}>KES</span>
//               <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{bill.balance?.toLocaleString()}</span>
//             </div>
//             <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Equal split - {bill.p_fk?.people_count} people</p>
//           </div>
//           <div style={{ backgroundColor: '#052111', border: '1px solid #0a3d1d', padding: '12px 16px', borderRadius: '12px', textAlign: 'right' }}>
//              <p style={{ fontSize: '10px', color: '#4caf50', margin: 0 }}>Your share</p>
//              <h3 style={{ fontSize: '20px', color: '#4caf50', margin: '4px 0' }}>KES {bill.p_fk?.per_person?.toLocaleString()}</h3>
//              <p style={{ fontSize: '9px', color: '#2e7d32', margin: 0 }}>Incl. service fee</p>
//           </div>
//         </div>

//         {/* QR CODE SECTION */}
//         <div style={{ textAlign: 'center', marginBottom: '32px' }}>
//           <p style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '16px' }}>SCAN TO SHARE</p>
//           <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block' }}>
//             <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={150} />
//           </div>
//         </div>

//         {/* INPUTS */}
//         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//           <div style={{ textAlign: 'left' }}>
//             <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>YOUR NAME</label>
//             <input 
//               placeholder="e.g. James, Amina..."
//               value={customerName}
//               onChange={(e) => setCustomerName(e.target.value)}
//               style={{ width: '100%', padding: '16px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white', marginTop: '8px', outline: 'none' }}
//             />
//           </div>

//           <div style={{ textAlign: 'left' }}>
//             <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>M-PESA NUMBER</label>
//             <input 
//               placeholder="07XX XXX XXX"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               style={{ width: '100%', padding: '16px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: 'white', marginTop: '8px', outline: 'none' }}
//             />
//             <p style={{ fontSize: '10px', color: '#555', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
//               <Lock size={10} /> Secure checkout · Encrypted
//             </p>
//           </div>
//         </div>

//         {/* ACTION BUTTON */}
//         <button 
//           onClick={handleSendSTK}
//           disabled={status === 'sending' || status === 'sent'}
//           style={{ width: '100%', padding: '20px', backgroundColor: status === 'sent' ? '#2e7d32' : '#4caf50', color: '#0a0a0a', border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
//         >
//           {status === 'sending' ? <Loader2 className="animate-spin" size={20} /> : status === 'sent' ? <CheckCircle2 size={20} /> : <Smartphone size={20} />}
//           {status === 'idle' && "Send STK Push Now"}
//           {status === 'sending' && "Processing..."}
//           {status === 'sent' && "STK Sent! Check Phone"}
//           {status === 'failed' && "Retry STK Push"}
//         </button>

//       </div>
//     </div>
//   );
// }



// "use client";

// import React, { useState, useEffect, use } from 'react';
// import { Smartphone, Lock, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
// import { getBillFromUnda, triggerMpesaPush, checkPaymentStatus } from '@/app/actions/unda';
// import { PaymentCard } from '@/app/components/PaymentCard';

// const mapUndaStatus = (undaStatus: string): 'paid' | 'pending' | 'failed' => {
//   if (!undaStatus) return 'pending';
//   const s = undaStatus.toUpperCase();
//   if (['COMPLETED', 'SUCCESS', 'PAID'].includes(s)) return 'paid';
//   if (['FAILED', 'EXPIRED', 'CANCELLED', 'REJECTED', 'DECLINED', 'ERROR'].includes(s)) return 'failed';
//   return 'pending'; 
// };

// export default function ParticipantPayPage({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = use(params);

//   const [bill, setBill] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [customerName, setCustomerName] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'paid'>('idle');
//   const [recentPayments, setRecentPayments] = useState<any[]>([]);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchBill = async () => {
//       if (!slug) return;
//       try {
//         const result = await getBillFromUnda(slug);
//         if (result.success && result.data) {
//           setBill(result.data);
//           console.log("Bill Loaded:", result.data);
//         } else {
//           setError(result.error || "Bill not found");
//         }
//       } catch (err) {
//         setError("Failed to connect to payment system");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchBill();
//   }, [slug]);

//   useEffect(() => {
//     let interval: NodeJS.Timeout;

//     const pollPayments = async () => {
//       const result = await checkPaymentStatus(slug);
      
//       if (result.success) {
//         const payments = result.allPayments || [];
//         setRecentPayments(payments);
        
//         console.log("Polling Table Data:", payments);

//         const simplifiedPhone = phoneNumber.replace(/\D/g, '').slice(-9);
//         const myAttempt = payments.find((p: any) => p.customer_no.includes(simplifiedPhone));

//         if (myAttempt) {
//           const mapped = mapUndaStatus(myAttempt.status);
//           console.log(`Your Payment (${simplifiedPhone}) Status:`, myAttempt.status, "-> Mapped to:", mapped);

//           if (mapped === 'paid') {
//             setStatus('paid');
//             clearInterval(interval);
//           } 
//           else if (mapped === 'failed' && status === 'sent') {
//             console.log("Payment Cancelled/Failed detected. Resetting UI.");
//             setStatus('idle');
//           }
//         }
//       } else {
//         console.error("Polling Error:", result.error);
//       }
//     };

//     interval = setInterval(pollPayments, 3000);
//     pollPayments(); 

//     return () => clearInterval(interval);
//   }, [slug, phoneNumber, status]);

//   const handleSendSTK = async () => {
//     if (!phoneNumber || phoneNumber.length < 10) return alert("Enter valid phone");
    
//     const channelApiKey = bill?.active_channel?.api_key;
//     if (!channelApiKey) return alert("No active payment channel.");

//     setStatus('sending');
    
//     const payload = {
//       amount: Number(bill.p_fk.per_person),
//       phone: phoneNumber,
//       reference: bill.slug,
//       customer_name: customerName || "Customer",
//       channel_api_key: channelApiKey,
//       account_id: bill.id 
//     };
    
//     console.log("Triggering STK Push Payload:", payload);

//     const result = await triggerMpesaPush(payload);

//     if (result.success) {
//       console.log("STK Request Accepted");
//       setStatus('sent');
//     } else {
//       console.error("STK Trigger Failed:", result.error);
//       setStatus('failed');
//       alert(`M-Pesa Error: ${result.error}`);
//       setStatus('idle');
//     }
//   };

//   if (loading) return (
//     <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
//       <Loader2 className="animate-spin mb-4 text-[#4caf50]" size={32} />
//       <p className="font-bold tracking-widest uppercase text-xs opacity-50">Syncing Bill...</p>
//     </div>
//   );

//   if (error || !bill) return (
//     <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
//       <AlertCircle className="text-red-500 mb-4" size={48} />
//       <h2 className="text-2xl font-bold mb-2">Error</h2>
//       <p className="text-slate-400">{error || "Bill not found."}</p>
//     </div>
//   );

//   if (status === 'paid') return (
//     <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6 text-center">
//       <div className="bg-[#4caf50] w-20 h-20 rounded-full flex items-center justify-center mb-6">
//         <CheckCircle2 size={40} color="#0a0a0a" />
//       </div>
//       <h1 className="text-3xl font-black mb-2">Paid Successfully</h1>
//       <p className="text-slate-400 mb-8">Contribution confirmed for {bill.p_fk?.bill_name}.</p>
//       <button onClick={() => window.location.reload()} className="px-8 py-4 bg-[#1a1a1a] border border-[#333] rounded-2xl font-bold">Done</button>
//     </div>
//   );

//   return (
//     <div className="bg-[#0a0a0a] min-h-screen text-white p-6 font-sans">
//       <div className="max-w-[480px] mx-auto">
        
//         <div className="text-left mb-8">
//           <p className="text-[#4caf50] text-[10px] font-black tracking-widest uppercase mb-2">Checkout</p>
//           <h1 className="text-4xl font-black italic">Your Share</h1>
//         </div>

//         <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 mb-8 flex justify-between items-center">
//           <div>
//             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{bill?.p_fk?.bill_name}</p>
//             <h3 className="text-3xl font-black">KES {bill?.p_fk?.per_person?.toLocaleString()}</h3>
//           </div>
//           <div className="bg-[#052111] border border-[#0a3d1d] px-3 py-1 rounded-full">
//              <p className="text-[9px] text-[#4caf50] font-black uppercase">STK Ready</p>
//           </div>
//         </div>

//         <div className="space-y-4 mb-8">
//           <input 
//             placeholder="Nickname"
//             value={customerName}
//             onChange={(e) => setCustomerName(e.target.value)}
//             className="w-full p-5 bg-[#111] border border-[#222] rounded-2xl text-white outline-none focus:border-[#4caf50]"
//           />
//           <input 
//             placeholder="M-Pesa Number"
//             value={phoneNumber}
//             onChange={(e) => setPhoneNumber(e.target.value)}
//             className="w-full p-5 bg-[#111] border border-[#222] rounded-2xl text-white outline-none focus:border-[#4caf50]"
//           />
//         </div>

//         <button 
//           onClick={handleSendSTK}
//           disabled={status === 'sending' || status === 'sent'}
//           className={`w-full p-6 rounded-[22px] font-black text-lg flex items-center justify-center gap-3 ${
//             status === 'sent' ? 'bg-[#1a1a1a] text-[#4caf50] border border-[#222]' : 'bg-[#4caf50] text-[#0a0a0a]'
//           }`}
//         >
//           {status === 'sending' ? <Loader2 className="animate-spin" size={22} /> : <Smartphone size={22} />}
//           {status === 'idle' && "Pay with M-Pesa"}
//           {status === 'sending' && "Processing..."}
//           {status === 'sent' && "Check Your Phone"}
//         </button>

//         {status === 'sent' && (
//           <div className="mt-4 p-5 bg-[#052111] border border-[#0a3d1d] rounded-2xl text-center">
//             <p className="text-[#4caf50] text-sm font-bold">Waiting for PIN entry...</p>
//           </div>
//         )}

//         <div className="mt-12">
//           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Table Activity</p>

//           <div className="space-y-4">
//             {recentPayments.length > 0 ? (
//               recentPayments.map((p, i) => (
//                 <PaymentCard 
//                   key={p.id || i}
//                   name={p.details?.customer_name || p.data?.details?.customer_name || "Guest"}
//                   phone={p.customer_no || p.uid}
//                   amount={p.amount}
//                   status={mapUndaStatus(p.status) === 'paid' ? 'Completed' : 'Pending'}
//                 />
//               ))
//             ) : (
//               <div className="py-12 text-center border-2 border-dashed border-[#1a1a1a] rounded-[32px]">
//                 <p className="text-slate-600 text-sm">No activity detected</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect, use } from 'react';
import { Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getBillFromUnda, triggerMpesaPush, checkPaymentStatus, getPaymentStatusById } from '@/app/actions/unda';
import { PaymentCard } from '@/app/components/PaymentCard';

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
  useEffect(() => {
    const fetchBill = async () => {
      if (!slug) return;
      try {
        const result = await getBillFromUnda(slug);
        if (result.success && result.data) {
          setBill(result.data);
        } else {
          setError(result.error || "Bill not found");
        }
      } catch (err) {
        setError("Connection failed");
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
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
    const channelApiKey = bill?.active_channel?.api_key;
    if (!channelApiKey) return alert("No active payment channel.");

    setStatus('sending');
    
    const result = await triggerMpesaPush({
      amount: Number(bill.p_fk.per_person),
      phone: phoneNumber,
      reference: bill.slug,
      customer_name: customerName || "Customer",
      channel_api_key: channelApiKey,
      account_id: bill.id 
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
            placeholder="Nickname (e.g., Glo)"
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
                const displayName = 
                p.idata?.customer_name ||      // Check the idata root (where STK push puts it)
                p.data?.customer_name ||       // Check the data object
                p.idata?.full_name ||          // Check for full_name
                "Guest";
                // Use the mapUndaStatus helper to clean the string for the component
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
        </div>
      </div>
    </div>
  );
}