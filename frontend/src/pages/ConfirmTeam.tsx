import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BASE_URL } from "@/config";

const ConfirmTeam = () => {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pplt_team_entry');
    if (!saved) {
      alert('No saved team data');
      navigate('/tournament-registration');
    } else {
      setTeamData(JSON.parse(saved));
    }
  }, []);

  const handleProceedToPay = () => {
    // ❗️Set payment amount + redirect to eSewa (you can customize pid/amt)
    const pid = 'PPLT20_TEAM_' + Date.now();
    const amt = 100;
    const successUrl = `${BASE_URL}/payment-success?pid=${pid}&amt=${amt}`;
    const failureUrl = `${BASE_URL}/payment-failed`;

    window.location.href = `https://uat.esewa.com.np/epay/main?amt=${amt}&scd=EPAYTEST&pid=${pid}&su=${successUrl}&fu=${failureUrl}`;
  };

  if (!teamData) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold mb-4">Confirm Your Team Details</h2>

      <div className="border rounded-lg p-4 space-y-2">
        <p><strong>Team Name:</strong> {teamData.teamName}</p>
        <p><strong>Captain:</strong> {teamData.captainName}</p>
        <p><strong>Contact:</strong> {teamData.contactNumber}</p>
        {teamData.teamLogo && (
          <img
            src={URL.createObjectURL(teamData.teamLogo)}
            alt="Team Logo"
            className="w-32 h-32 object-cover rounded"
          />
        )}

        <div>
          <strong>Players:</strong>
          <ul className="list-disc ml-5">
            {teamData.players.map((p, i) => (
              <li key={i}>
                {p.name} {p.playerCode && `(Code: ${p.playerCode})`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => navigate('/tournament-registration')}>
          Edit
        </Button>
        <Button onClick={handleProceedToPay}>Proceed to Payment</Button>
      </div>
    </div>
  );
};

export default ConfirmTeam;
