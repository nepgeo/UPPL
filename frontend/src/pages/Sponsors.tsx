import React from 'react';

const Sponsors = () => {
  // Sample sponsor data - replace with your actual data
  const organizationSponsors = [
    { id: 1, name: "TechCorp", logo: "/images/sponsors/techcorp.png" },
    { id: 2, name: "InnovateLab", logo: "/images/sponsors/innovatelab.png" },
    { id: 3, name: "StartupHub", logo: "/images/sponsors/startuphub.png" },
    { id: 4, name: "DevTools Inc", logo: "/images/sponsors/devtools.png" },
    { id: 5, name: "CloudFirst", logo: "/images/sponsors/cloudfirst.png" },
    { id: 6, name: "DataMind", logo: "/images/sponsors/datamind.png" },
    { id: 7, name: "AI Solutions", logo: "/images/sponsors/aisolutions.png" },
    { id: 8, name: "WebFlow Co", logo: "/images/sponsors/webflow.png" },
  ];

  const peopleSponsors = [
    { id: 1, name: "John Smith", avatar: "/images/sponsors/john.jpg", title: "CEO at TechCorp" },
    { id: 2, name: "Sarah Johnson", avatar: "/images/sponsors/sarah.jpg", title: "CTO at InnovateLab" },
    { id: 3, name: "Mike Chen", avatar: "/images/sponsors/mike.jpg", title: "Founder of StartupHub" },
    { id: 4, name: "Emily Davis", avatar: "/images/sponsors/emily.jpg", title: "VP Engineering" },
    { id: 5, name: "Alex Rodriguez", avatar: "/images/sponsors/alex.jpg", title: "Product Manager" },
    { id: 6, name: "Lisa Wang", avatar: "/images/sponsors/lisa.jpg", title: "Design Lead" },
    { id: 7, name: "David Kim", avatar: "/images/sponsors/david.jpg", title: "Tech Advisor" },
    { id: 8, name: "Maria Garcia", avatar: "/images/sponsors/maria.jpg", title: "Investor" },
  ];

  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Our Sponsors
        </h1>

        {/* Organizations Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-semibold mb-8 text-center text-muted-foreground">
            Partner Organizations
          </h2>
          <div className="relative overflow-hidden bg-card rounded-lg p-6 shadow-lg">
            <div className="flex gap-8 animate-scroll-x whitespace-nowrap">
              {/* Triple the array for seamless infinite loop */}
              {[...organizationSponsors, ...organizationSponsors, ...organizationSponsors].map((sponsor, i) => (
                <div
                  key={`${sponsor.id}-${Math.floor(i / organizationSponsors.length)}-${i}`}
                  className="flex-shrink-0 group cursor-pointer min-w-[140px]"
                >
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 h-24 flex flex-col justify-center">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="h-12 w-auto object-contain mx-auto filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/120x48/e5e7eb/374151?text=${sponsor.name}`;
                      }}
                    />
                    <p className="text-xs text-center mt-2 text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {sponsor.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* People Section */}
        <section>
          <h2 className="text-3xl font-semibold mb-8 text-center text-muted-foreground">
            Individual Sponsors
          </h2>
          <div className="relative overflow-hidden bg-card rounded-lg p-6 shadow-lg">
            <div className="flex gap-8 animate-scroll-x-reverse whitespace-nowrap">
              {/* Triple the array for seamless infinite loop - reverse direction */}
              {[...peopleSponsors, ...peopleSponsors, ...peopleSponsors].map((person, i) => (
                <div
                  key={`${person.id}-${Math.floor(i / peopleSponsors.length)}-${i}`}
                  className="flex-shrink-0 group cursor-pointer min-w-[160px]"
                >
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 text-center">
                    <div className="relative mx-auto w-fit">
                      <img
                        src={person.avatar}
                        className="w-16 h-16 rounded-full border-4 border-primary shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto"
                        alt={person.name}
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/64x64/8b5cf6/ffffff?text=${person.name.split(' ').map(n => n[0]).join('')}`;
                        }}
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {person.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-20 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Become a Sponsor</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our amazing community of sponsors and help us continue building incredible experiences. 
              Your support makes all the difference.
            </p>
            <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg hover:shadow-xl">
              Contact Us
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sponsors;