import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import getProfileImageUrl from "@/utils/getProfileImageUrl";
import { BASE_URL } from "@/config";

interface SponsorsProps {
  className?: string;
  style?: React.CSSProperties;
}

const Sponsors: React.FC<SponsorsProps> = ({ className = "", style }) => {
  const [organizationSponsors, setOrganizationSponsors] = useState<any[]>([]);
  const [peopleSponsors, setPeopleSponsors] = useState<any[]>([]);
  const [zoomedId, setZoomedId] = useState<string | null>(null);

  const shadowClasses = [
    "shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_16px_rgba(59,130,246,0.35)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_16px_rgba(34,197,94,0.35)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_16px_rgba(239,68,68,0.35)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_16px_rgba(168,85,247,0.35)]",
    "shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_16px_rgba(249,115,22,0.35)]",
  ];

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const [orgRes, indRes] = await Promise.all([
          api.get("/sponsors/organizations"),
          api.get("/sponsors/individuals"),
        ]);
        setOrganizationSponsors(orgRes.data);
        setPeopleSponsors(indRes.data);
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      }
    };
    fetchSponsors();
  }, []);

  const handleZoom = (id: string) => {
    setZoomedId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className={`min-h-screen px-4 py-8 bg-background text-foreground bg-opacity-90 ${className}`}
      style={style}
    >
      <style>{`
        .sponsor-card {
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .sponsor-card:hover {
          transform: scale(1.08);
        }
        .zoomed {
          transform: scale(1.4);
          z-index: 20;
        }
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 40s linear infinite;
        }
        @keyframes scroll-x-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-x-reverse {
          animation: scroll-x-reverse 40s linear infinite;
        }
      `}</style>

      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Our Sponsors
        </h1>

        {/* Partner Organizations */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center text-muted-foreground">
            Partner Organizations
          </h2>
          <div className="relative overflow-hidden rounded-lg px-2 py-4">
            <div className="flex w-max animate-scroll-x gap-6 sm:gap-10 whitespace-nowrap">
              {[...organizationSponsors, ...organizationSponsors].map(
                (sponsor, i) => (
                  <div
                    key={`${sponsor._id}-${i}`}
                    className={`sponsor-card flex-shrink-0 cursor-pointer 
                      min-w-[100px] sm:min-w-[140px] rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 
                      flex flex-col justify-between items-center transition-transform duration-300 
                      ${shadowClasses[i % shadowClasses.length]} 
                      ${zoomedId === sponsor._id ? "zoomed" : ""}`}
                    onClick={() => handleZoom(sponsor._id)}
                  >
                    <img
                      src={getProfileImageUrl(sponsor.logo)}
                      alt={sponsor.name}
                      className="h-[80px] sm:h-[100px] w-auto object-contain mx-auto transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/120x80/e5e7eb/374151?text=${sponsor.name}`;
                      }}
                    />
                    <p className="text-[11px] sm:text-xs text-center mt-2 text-gray-700 truncate">
                      {sponsor.name}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Individual Sponsors */}
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center text-muted-foreground">
            Individual Sponsors
          </h2>
          <div className="relative overflow-hidden rounded-lg px-2 py-4">
            <div className="flex w-max animate-scroll-x-reverse gap-6 sm:gap-10 whitespace-nowrap">
              {[...peopleSponsors, ...peopleSponsors].map((person, i) => (
                <div
                  key={`${person._id}-${i}`}
                  className={`sponsor-card flex-shrink-0 cursor-pointer 
                    min-w-[100px] sm:min-w-[140px] rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 
                    flex flex-col justify-between items-center transition-transform duration-300 
                    ${shadowClasses[i % shadowClasses.length]} 
                    ${zoomedId === person._id ? "zoomed" : ""}`}
                  onClick={() => handleZoom(person._id)}
                >
                  <img
                    src={getProfileImageUrl(person.avatar)}
                    className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] rounded-full mx-auto object-cover transition-transform duration-300"
                    alt={person.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/70x70/8b5cf6/ffffff?text=${person.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}`;
                    }}
                  />
                  <p className="text-[11px] sm:text-xs font-semibold truncate mt-2">
                    {person.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sponsors;
