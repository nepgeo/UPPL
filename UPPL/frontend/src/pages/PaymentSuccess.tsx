import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { createTeam } from '@/services/teamService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handlePayment = async () => {
      const refId = searchParams.get('refId');
      const pid = searchParams.get('pid');
      const amt = searchParams.get('amt');

      if (!refId) {
        setStatus('error');
        setMessage('Missing payment reference ID.');
        return;
      }

      try {
        const esewaPending = localStorage.getItem('pplt_esewa_pending');
        const teamEntry = localStorage.getItem('pplt_team_entry');

        if (esewaPending) {
          // New flow: team already created, just verify and update
          const pending = JSON.parse(esewaPending);

          const verifyRes = await api.post('/payment/verify-esewa', {
            refId,
            pid: pid || pending.pid,
            amt: amt || pending.amt,
            teamId: pending.teamId,
          });

          if (!verifyRes.data.verified) {
            setStatus('error');
            setMessage('Payment verification failed. Please contact support.');
            return;
          }

          localStorage.removeItem('pplt_esewa_pending');
          setStatus('success');
          setMessage('Payment verified! Your team registration is pending admin approval.');
        } else if (teamEntry) {
          // Old flow: create team after payment verification
          const formData = JSON.parse(teamEntry);

          const verifyRes = await api.post('/payment/verify-esewa', {
            refId,
            pid: pid || formData.pid,
            amt: amt || 100,
          });

          if (!verifyRes.data.verified) {
            setStatus('error');
            setMessage('Payment verification failed.');
            return;
          }

          const payload = new FormData();
          payload.append('teamName', formData.teamName);
          payload.append('captainName', formData.captainName);
          payload.append('contactNumber', formData.contactNumber);
          payload.append('players', JSON.stringify(formData.players));
          if (formData.uploadedLogo) {
            const blob = dataURLToBlob(formData.uploadedLogo);
            payload.append('teamLogo', blob, 'logo.png');
          }
          payload.append('paymentMethod', 'esewa');

          await createTeam(payload);

          localStorage.removeItem('pplt_team_entry');
          setStatus('success');
          setMessage('Team registered successfully!');
        } else {
          setStatus('error');
          setMessage('No registration data found. Please register again.');
        }
      } catch (err: any) {
        console.error('Payment processing failed:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Something went wrong. Please contact support.');
      }
    };

    handlePayment();
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
          <h2 className="text-2xl font-bold mb-2">Payment Successful</h2>
          <p className="text-gray-700 mb-6">{message}</p>
          <Button onClick={() => navigate('/teams')}>View My Team</Button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button onClick={() => navigate('/tournament-registration')}>Try Again</Button>
        </>
      )}
    </div>
  );
};

function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default PaymentSuccess;
