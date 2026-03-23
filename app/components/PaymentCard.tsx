// import React from 'react';
// import { Clock, CheckCircle2 } from 'lucide-react';

// interface PaymentCardProps {
//   name: string;
//   phone: string;
//   amount: number;
//   status: string;
// }

// export const PaymentCard = ({ name, phone, amount, status }: PaymentCardProps) => {
//   const isPaid = ['completed', 'paid', 'success'].includes(status.toLowerCase());
//   return (
//     <div style={{ 
//       backgroundColor: '#111', 
//       border: '1px solid #222',
//       borderRadius: '20px', 
//       padding: '16px', 
//       display: 'flex', 
//       alignItems: 'center', 
//       justifyContent: 'space-between', 
//       marginBottom: '10px'
//     }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//         <div style={{ 
//           width: '40px', height: '40px', 
//           backgroundColor: isPaid ? '#4caf50' : '#333', 
//           borderRadius: '12px', 
//           display: 'flex', alignItems: 'center', justifyContent: 'center', 
//           color: isPaid ? '#0a0a0a' : '#888', 
//           fontSize: '16px', fontWeight: 'bold' 
//         }}>
//           {name.charAt(0).toUpperCase()}
//         </div>
        
//         <div style={{ textAlign: 'left' }}>
//           <h4 style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '600' }}>{name}</h4>
//           <p style={{ color: '#666', margin: 0, fontSize: '11px' }}>{phone}</p>
//         </div>
//       </div>

//       <div style={{ textAlign: 'right' }}>
//         <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>
//           <span style={{ fontSize: '10px', color: '#666', marginRight: '4px' }}>KES</span>
//           {amount.toLocaleString()}
//         </div>
//         <div style={{ 
//           display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px'
//         }}>
//           {isPaid ? (
//             <span style={{ color: '#4caf50', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Paid</span>
//           ) : (
//             <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Pending</span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };


import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PaymentCardProps {
  name: string;
  phone: string;
  amount: number;
  status: string;
}

export const PaymentCard = ({ name, phone, amount, status }: PaymentCardProps) => {
  const s = (status || "").toLowerCase();
  
  // 1. Identify the three possible states
  const isPaid = ['completed', 'paid', 'success'].includes(s);
  const isFailed = ['failed', 'cancelled', 'rejected', 'declined'].includes(s);

  // 2. Dynamic Colors based on status
  const accentColor = isPaid ? '#4caf50' : isFailed ? '#ef4444' : '#f59e0b';
  const iconBg = isPaid ? '#4caf50' : isFailed ? '#ef4444' : '#333';
  const textColor = isPaid ? '#0a0a0a' : isFailed ? '#fff' : '#888';

  return (
    <div style={{ 
      backgroundColor: '#111', 
      border: `1px solid ${isFailed ? '#450a0a' : '#222'}`, 
      borderRadius: '20px', 
      padding: '16px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', height: '40px', 
          backgroundColor: iconBg, 
          borderRadius: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: textColor, 
          fontSize: '16px', fontWeight: 'bold' 
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '600' }}>{name}</h4>
          <p style={{ color: '#666', margin: 0, fontSize: '11px' }}>{phone}</p>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '10px', color: '#666', marginRight: '4px' }}>KES</span>
          {amount.toLocaleString()}
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px'
        }}>
          {/* 3. Render the correct label and color */}
          {isPaid ? (
            <span style={{ color: '#4caf50', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Paid</span>
          ) : isFailed ? (
            <span style={{ color: '#ef4444', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Failed</span>
          ) : (
            <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Pending</span>
          )}
        </div>
      </div>
    </div>
  );
};