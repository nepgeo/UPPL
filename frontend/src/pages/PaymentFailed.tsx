import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentFailed = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    const saved = localStorage.getItem('pplt_team_entry');
    if (saved) {
      navigate('/tournament-registration');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Payment Failed or Cancelled</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        It looks like the payment process didn’t go through. If the problem persists, please contact support.
      </p>
      <Button variant="outline" onClick={handleRetry}>
        Try Again
      </Button>
    </div>
  );
};

export default PaymentFailed;
