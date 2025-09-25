import React, { useEffect, useState } from "react";
import axios from "axios";

import { BASE_URL,api } from "@/lib/api";

const Sponsors = () => {
  const [organizationSponsors, setOrganizationSponsors] = useState<any[]>([]);
  const [peopleSponsors, setPeopleSponsors] = useState<any[]>([]);

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
          api.get("/api/sponsors/organizations"),
          api.get("/api/sponsors/individuals"),
        ]);
        setOrganizationSponsors(orgRes.data);
        setPeopleSponsors(indRes.data);
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      }
    };
    fetchSponsors();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 bg-background text-foreground bg-opacity-90">
      <style>{`
        .sponsor-card {
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .sponsor-card:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(255,255,255,0.5), 0 0 25px rgba(255,255,255,0.4);
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

        {/* Organizations */}
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
                      min-w-[90px] min-h-[120px] sm:min-w-[120px] sm:min-h-[160px] 
                      rounded-lg bg-white dark:bg-gray-800 p-2 sm:p-3 
                      flex flex-col justify-between items-center 
                      ${shadowClasses[i % shadowClasses.length]}`}
                  >
                    <img
                      src={`${BASE_URL}/${sponsor.logo?.replace(
                        /^\/+/,
                        ""
                      )}`}
                      alt={sponsor.name}
                      className="h-[70px] sm:h-[100px] w-auto object-contain mx-auto filter grayscale hover:grayscale-0 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/90x70/e5e7eb/374151?text=${sponsor.name}`;
                      }}
                    />
                    <p className="text-[10px] sm:text-xs text-center mt-2 text-muted-foreground truncate">
                      {sponsor.name}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Individuals */}
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
                    min-w-[90px] min-h-[120px] sm:min-w-[120px] sm:min-h-[160px] 
                    rounded-lg bg-white dark:bg-gray-800 p-2 sm:p-3 
                    flex flex-col justify-between items-center 
                    ${shadowClasses[i % shadowClasses.length]}`}
                >
                  <img
                    src={`${BASE_URL}/${person.avatar?.replace(
                      /^\/+/,
                      ""
                    )}`}
                    className="w-[65px] h-[65px] sm:w-[90px] sm:h-[90px] rounded-full mx-auto object-cover"
                    alt={person.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/65x65/8b5cf6/ffffff?text=${person.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}`;
                    }}
                  />
                  <p className="text-[10px] sm:text-xs font-semibold truncate mt-2">
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
