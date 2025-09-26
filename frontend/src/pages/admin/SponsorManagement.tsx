import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SponsorForm from '@/components/SponsorForm';
import PaymentQRForm from "@/components/PaymentQRForm";
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { API_BASE, BASE_URL } from '@/config';

const SponsorManagement = () => {
  const [orgs, setOrgs] = useState([]);
  const [people, setPeople] = useState([]);
  const [modal, setModal] = useState<{ type: 'organization' | 'individual'; sponsor?: any } | null>(null);

  // 🔹 Team states
  const [team, setTeam] = useState([]);
  const [teamModal, setTeamModal] = useState(false); // main list modal
  const [editMember, setEditMember] = useState<any | null>(null); // edit/add modal
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [orgPage, setOrgPage] = useState(1);
const [indPage, setIndPage] = useState(1);
const itemsPerPage = 5; // adjust as needed


  // 🔹 Sponsors fetch
  const fetchData = async () => {
    const token = localStorage.getItem('pplt20_token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [orgRes, indRes] = await Promise.all([
        api.get('/api/sponsors/organizations', config),
        api.get('/api/sponsors/individuals', config),
      ]);

      // console.log('✅ Organizations Data:', orgRes.data);
      // console.log('✅ Individuals Data:', indRes.data);

      setOrgs(orgRes.data);
      setPeople(indRes.data);
    } catch (err) {
      console.error('❌ Failed to fetch sponsors', err);
    }
  };

  const handleDelete = async (type: 'organization' | 'individual', id: string) => {
    const endpoint = `/api/sponsors/${type === 'organization' ? 'organizations' : 'individuals'}/${id}`;
    const token = localStorage.getItem('pplt20_token');

    try {
      await api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      console.error('❌ Delete error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Team fetch
  const fetchTeam = async () => {
    const token = localStorage.getItem('pplt20_token');
    try {
      setLoadingTeam(true);
      const res = await api.get('/api/team-members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch team members", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // 🔹 Delete member
  const handleDeleteMember = async (id: string) => {
    const token = localStorage.getItem('pplt20_token');
    try {
      await api.delete(`/api/team-members/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTeam();
    } catch (err) {
      console.error("❌ Failed to delete member", err);
    }
  };

  // 🔹 Save (Add/Edit) member
  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem('pplt20_token');

    try {
      if (editMember._id) {
        await api.put(`/api/team-members/${editMember._id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/api/team-members`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      setEditMember(null);
      fetchTeam();
    } catch (err) {
      console.error("❌ Failed to save member", err);
    }
  };

  const addMember = async (formData: FormData) => {
    const token = localStorage.getItem("pplt20_token");
    await api.post(`/team-members`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    fetchTeam(); // refresh list
  };

  const getProfileImageUrl = (path: string | null) => {

  if (!path) {
    return `${BASE_URL}/uploads/teamMembers/default-avatar.png`;
  }

  // If already a full URL, return as is
  if (path.startsWith('http')) return path;

  // 🧹 Clean & normalize path
  let cleanPath = path
    .replace(/\/+/g, '/')                        // collapse multiple slashes
    .replace(/^\/uploads\/team\//, '/uploads/teamMembers/') // fix old DB paths
    .replace(/^\/uploads\/uploads\//, '/uploads/')          // double uploads fix
    .replace(/^uploads\//, '/uploads/');                   // ensure /uploads/

  // Ensure it starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  const finalUrl = `${BASE_URL}${cleanPath}`;
  console.log("🖼 Final image URL:", finalUrl);
  return finalUrl;
};




  return (
    <div className="p-3">
      {/* 🔹 Team Section */}
      <div
        className="
          bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500
          rounded-xl p-6 shadow-sm hover:shadow-lg
          transition-all duration-300 cursor-pointer
          border border-transparent hover:border-blue-100
          mb-6
        "
        onClick={() => setTeamModal(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              UPPL Team Members
            </h1>
            <p className="text-sm text-white/80">Click to view team members</p>
          </div>
          <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {teamModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full relative shadow-xl">
            <button
              onClick={() => setTeamModal(false)}
              className="absolute top-2 right-3 text-gray-600 text-xl font-bold hover:text-red-500"
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold mb-4">UPPL Team Members</h2>

            {loadingTeam ? (
              <p className="text-center py-4">Loading team members...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {team.map((member: any, index: number) => (
                  <div
                    key={member._id}
                    className="border p-3 rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-3 hover:shadow-md transition"
                  >
                    {/* Avatar */}
                    {index + 1}. {member.avatar && (
                      <img
                        src={getProfileImageUrl(member.avatar)}
                        alt={member.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-bold text-base sm:text-lg">
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-500">{member.position}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button
                        className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm"
                        onClick={() => setEditMember(member)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                        onClick={() => handleDeleteMember(member._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="flex justify-end">
              <button
                onClick={() => setEditMember({})}
                className="mt-4 bg-green-600 text-white px-5 py-2 rounded shadow hover:bg-green-700 transition"
              >
                + Add New Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Add/Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm sm:max-w-md relative shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setEditMember(null)}
              className="absolute top-2 right-3 text-gray-600 text-xl font-bold hover:text-red-500"
            >
              ×
            </button>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center sm:text-left">
              {editMember._id ? "Edit Member" : "Add Member"}
            </h2>

            {/* Form */}
            <form onSubmit={handleSaveMember} className="flex flex-col gap-3">
              <input
                type="text"
                name="name"
                defaultValue={editMember.name}
                placeholder="Name"
                className="border p-2 rounded text-sm sm:text-base"
                required
              />
              <input
                type="text"
                name="position"
                defaultValue={editMember.position}
                placeholder="Position"
                className="border p-2 rounded text-sm sm:text-base"
                required
              />
              <input
                type="file"
                name="teamMember"
                className="border p-2 rounded text-sm sm:text-base"
              />

              {/* Preview if editing and image exists */}
              {editMember.avatar && (
                <img
                  src={getProfileImageUrl(editMember.avatar || null)}
                  alt="preview"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded mt-2 border mx-auto sm:mx-0"
                />
              )}

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition text-sm sm:text-base"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}



      {/* 🔹 QR Form */}
      <div className="mb-10">
        <PaymentQRForm />
      </div>

      {/* 🔹 Sponsors Section */}
      {/* 🔹 Sponsors Section */}
<h1 className="text-2xl font-bold mb-5">Sponsor Management</h1>

<div className="mb-6 flex gap-4">
  <button
    onClick={() => setModal({ type: 'organization' })}
    className="bg-green-600 px-4 py-2 text-white rounded"
  >
    Add Organization
  </button>
  <button
    onClick={() => setModal({ type: 'individual' })}
    className="bg-purple-600 px-4 py-2 text-white rounded"
  >
    Add Individual
  </button>
</div>

<div className="grid md:grid-cols-2 gap-8">
  {/* Organizations */}
  <div>
    <h2 className="text-xl font-semibold mb-2">Organizations</h2>
    {orgs.length > 0 && (
      <>
        {orgs
          .slice((orgPage - 1) * itemsPerPage, orgPage * itemsPerPage)
          .map((sponsor, index) => (
            <div
              key={sponsor._id}
              className="border p-4 mb-2 rounded shadow-sm flex items-center gap-4"
            >
              <span className="font-bold">{(orgPage - 1) * itemsPerPage + index + 1}.</span>
              {sponsor.logo && (
                <img
                  src={`${BASE_URL}/${sponsor.logo?.replace(/^\/+/, '')}`}
                  alt={sponsor.name}
                  className="w-16 h-16 object-cover rounded-full"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold">{sponsor.name}</h3>
                <p className="text-sm text-gray-500">
                  Donation: NRs. {Number(sponsor.donationAmount || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setModal({ type: 'organization', sponsor })}
                className="text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete('organization', sponsor._id)}
                className="text-red-600 ml-2"
              >
                Delete
              </button>
            </div>
          ))}

          

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(orgs.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setOrgPage(i + 1)}
              className={`px-3 py-1 rounded ${
                orgPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </>
    )}
  </div>

  {/* Individuals */}
  <div>
    <h2 className="text-xl font-semibold mb-2">Individuals</h2>
    {people.length > 0 && (
      <>
        {people
          .slice((indPage - 1) * itemsPerPage, indPage * itemsPerPage)
          .map((sponsor, index) => (
            <div
              key={sponsor._id}
              className="border p-4 mb-2 rounded shadow-sm flex items-center gap-4"
            >
              <span className="font-bold">{(indPage - 1) * itemsPerPage + index + 1}.</span>
              {sponsor.avatar && (
                <img
                  src={`${BASE_URL}/${sponsor.avatar?.replace(/^\/+/, '')}`}
                  alt={sponsor.name}
                  className="w-16 h-16 object-cover rounded-full"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold">{sponsor.name}</h3>
                <p className="text-sm text-gray-500">{sponsor.title}</p>
                <p className="text-sm text-gray-500">
                  Donation: NRs. {Number(sponsor.donationAmount || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setModal({ type: 'individual', sponsor })}
                className="text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete('individual', sponsor._id)}
                className="text-red-600 ml-2"
              >
                Delete
              </button>
            </div>
          ))}

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: Math.ceil(people.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => setIndPage(i + 1)}
              className={`px-3 py-1 rounded ${
                indPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </>
    )}
  </div>
</div>


{/* 🔹 Total Donation Summary */}
<div className="mt-6 p-4 bg-gray-100 rounded-lg shadow-inner flex flex-col sm:flex-row justify-between gap-4 text-gray-800">
  <div>
    <span className="font-semibold">Organizations:</span>{" "}
    NRs. {orgs.reduce((sum, o) => sum + (o.donationAmount || 0), 0).toLocaleString()}
  </div>
  <div>
    <span className="font-semibold">Individuals:</span>{" "}
    NRs. {people.reduce((sum, p) => sum + (p.donationAmount || 0), 0).toLocaleString()}
  </div>
  <div>
    <span className="font-semibold">Total:</span>{" "}
    NRs. {(
      orgs.reduce((sum, o) => sum + (o.donationAmount || 0), 0) +
      people.reduce((sum, p) => sum + (p.donationAmount || 0), 0)
    ).toLocaleString()}
  </div>
</div>



      {/* 🔹 Sponsor Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative shadow-xl">
            <button
              onClick={() => setModal(null)}
              className="absolute top-2 right-3 text-gray-600 text-xl font-bold hover:text-red-500"
            >
              ×
            </button>
            <SponsorForm
              type={modal.type}
              initialData={modal.sponsor}
              onSuccess={() => {
                setModal(null);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorManagement;
