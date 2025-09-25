import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyAndSubmit = async () => {
      const refId = searchParams.get('refId');
      const pid = searchParams.get('pid');
      const amt = searchParams.get('amt');

      if (!refId || !pid || !amt) {
        setStatus('error');
        setMessage('Missing required payment parameters.');
        return;
      }

      try {
        // ✅ Step 1: Verify eSewa payment with backend
        const verifyRes = await api.post('/payment/verify-payment', {
          refId,
          pid,
          amt,
        });

        if (!verifyRes.data.verified) {
          setStatus('error');
          setMessage('Payment verification failed');
          return;
        }

        // ✅ Step 2: Load team form data from localStorage
        const saved = localStorage.getItem('pplt_team_entry');
        if (!saved) {
          setStatus('error');
          setMessage('No team data found. Please re-enter the form.');
          return;
        }

        const formData = JSON.parse(saved);

        const payload = new FormData();
        payload.append('teamName', formData.teamName);
        payload.append('captainName', formData.captainName);
        payload.append('contactNumber', formData.contactNumber);
        payload.append('players', JSON.stringify(formData.players));
        if (formData.teamLogo) payload.append('teamLogo', formData.teamLogo); // File
        payload.append('paymentDetails', JSON.stringify({ refId, pid, amount: amt }));

        // ✅ Step 3: Submit to /api/teams with auth
        const token = localStorage.getItem('pplt20_token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        };

        const response = await api.post('/teams', payload, config);

        setStatus('success');
        setMessage('🎉 Team registered successfully!');
        localStorage.removeItem('pplt_team_entry');
      } catch (err) {
        console.error('Submission failed:', err);
        setStatus('error');
        setMessage('Something went wrong. Please contact support.');
      }
    };

    verifyAndSubmit();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      {status === 'loading' && (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-lg">Verifying your payment...</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Payment Verified</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <Button onClick={() => navigate('/teams')}>View Teams</Button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
