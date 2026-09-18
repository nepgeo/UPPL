import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
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
      className={`py-6 sm:py-10 lg:py-16 bg-gradient-to-b from-amber-50 to-white text-foreground ${className}`}
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

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3 shadow-lg">
            <Award className="h-3.5 w-3.5" />
            Partners
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 uppercase">OUR SPONSORS</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mt-3 rounded-full" />
        </motion.div>

        {/* Partner Organizations */}
        <section className="mb-6 sm:mb-8 lg:mb-12">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-4 sm:mb-6 text-center text-gray-700 uppercase">Partner Organizations</h3>
          <div className="relative overflow-hidden rounded-lg px-2 py-3 sm:py-4">
            <div className="flex w-max animate-scroll-x gap-4 sm:gap-6 lg:gap-10 whitespace-nowrap">
              {[...organizationSponsors, ...organizationSponsors].map(
                (sponsor, i) => (
                  <div
                    key={`${sponsor._id}-${i}`}
                    className={`sponsor-card flex-shrink-0 cursor-pointer 
                      min-w-[80px] sm:min-w-[110px] lg:min-w-[140px] rounded-lg bg-white dark:bg-gray-800 p-2 sm:p-3 lg:p-4 
                      flex flex-col justify-between items-center transition-transform duration-300 
                      ${shadowClasses[i % shadowClasses.length]} 
                      ${zoomedId === sponsor._id ? "zoomed" : ""}`}
                    onClick={() => handleZoom(sponsor._id)}
                  >
                    <img
                      src={getProfileImageUrl(sponsor.logo)}
                      alt={sponsor.name}
                      className="h-[50px] sm:h-[70px] lg:h-[100px] w-auto object-contain mx-auto transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/120x80/e5e7eb/374151?text=${sponsor.name}`;
                      }}
                    />
                    <p className="text-[9px] sm:text-[11px] lg:text-xs text-center mt-1.5 sm:mt-2 text-gray-700 truncate">
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
          <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-4 sm:mb-6 text-center text-gray-700 uppercase">Individual Sponsors</h3>
          <div className="relative overflow-hidden rounded-lg px-2 py-3 sm:py-4">
            <div className="flex w-max animate-scroll-x-reverse gap-4 sm:gap-6 lg:gap-10 whitespace-nowrap">
              {[...peopleSponsors, ...peopleSponsors].map((person, i) => (
                <div
                  key={`${person._id}-${i}`}
                  className={`sponsor-card flex-shrink-0 cursor-pointer 
                    min-w-[80px] sm:min-w-[110px] lg:min-w-[140px] rounded-lg bg-white dark:bg-gray-800 p-2 sm:p-3 lg:p-4 
                    flex flex-col justify-between items-center transition-transform duration-300 
                    ${shadowClasses[i % shadowClasses.length]} 
                    ${zoomedId === person._id ? "zoomed" : ""}`}
                  onClick={() => handleZoom(person._id)}
                >
                  <img
                    src={getProfileImageUrl(person.avatar)}
                    className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] lg:w-[90px] lg:h-[90px] rounded-full mx-auto object-cover transition-transform duration-300"
                    alt={person.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/70x70/8b5cf6/ffffff?text=${person.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}`;
                    }}
                  />
                  <p className="text-[9px] sm:text-[11px] lg:text-xs font-semibold truncate mt-1.5 sm:mt-2">
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
