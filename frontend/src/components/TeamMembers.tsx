// frontend/src/components/TeamMembers.tsx
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { BASE_URL } from "@/config";

// ✅ Helper to build profile image URL
const getProfileImageUrl = (path: string | null) => {
  if (!path) return `${BASE_URL}/uploads/teamMembers/default-avatar.png`;
  if (path.startsWith("http")) return path;

  let cleanPath = path.replace(/\/+/g, "/");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

  return `${BASE_URL}${cleanPath}`;
};

const TeamMembers: React.FC = () => {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.get("/team-members");
        setTeam(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch team members:", err);
      }
    };
    fetchTeam();
  }, []);

  // ✅ Fixed member
  const fixedMember = {
    _id: "fixed-member",
    name: "Madhur Bist",
    position: "Developer",
    avatar: `${BASE_URL}/uploads/photo.jpg`,
  };

  // ✅ Append fixed member to fetched team
  const teamWithFixed = [...team, fixedMember];

  return (
    <section className="bg-gray-50 py-10 relative">
      <style>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-scroll-x {
          animation: scroll-x 40s linear infinite;
        }
      `}</style>

      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Meet Our Team
      </h2>

      {teamWithFixed.length === 0 ? (
        <p className="text-center text-gray-500">No team members found.</p>
      ) : (
        <div className="relative overflow-hidden rounded-lg px-10 py-4">
          <div className="flex w-max animate-scroll-x gap-8 whitespace-nowrap">
            {[...teamWithFixed, ...teamWithFixed, ...teamWithFixed].map(
              (member, i) => (
                <div
                  key={`${member._id || "dup"}-${i}`}
                  className="flex-shrink-0 flex flex-col items-center text-center min-w-[110px] group"
                >
                  <img
                    src={getProfileImageUrl(member.avatar)}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover border transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-400/40"
                  />
                  <p className="text-sm font-semibold mt-2 truncate w-full">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.position}</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default TeamMembers;
