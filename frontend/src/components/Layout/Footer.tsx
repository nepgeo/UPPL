import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Logo and Description */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 sm:mb-4 animate-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              UPPL T20
            </h1>
            <p className="text-gray-400 max-w-lg leading-relaxed text-sm sm:text-base">
              Udaydev Patan Premiere League T20. The ultimate cricket tournament
              bringing together the best talent in fast-paced, action-packed
              cricket entertainment.
            </p>
            <div className="flex space-x-3 sm:space-x-6 mt-4 sm:mt-6">
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-400 hover:text-blue-500 transition-transform transform hover:-translate-y-1 p-1.5 sm:p-2 -m-1.5 sm:-m-2"
              >
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://twitter.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-gray-400 hover:text-blue-400 transition-transform transform hover:-translate-y-1 p-1.5 sm:p-2 -m-1.5 sm:-m-2"
              >
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://instagram.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-pink-500 transition-transform transform hover:-translate-y-1 p-1.5 sm:p-2 -m-1.5 sm:-m-2"
              >
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a
                href="https://youtube.com/yourchannel"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-gray-400 hover:text-red-500 transition-transform transform hover:-translate-y-1 p-1.5 sm:p-2 -m-1.5 sm:-m-2"
              >
                <Youtube className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  to="/teams"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Teams
                </Link>
              </li>
              <li>
                <Link
                  to="/schedule"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Schedule
                </Link>
              </li>
              <li>
                <Link
                  to="/points-table"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Points Table
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  News
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h4 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="flex flex-col gap-3 sm:gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-colors text-sm sm:text-base"
                aria-label="Email address"
                required
              />
              <button
                type="submit"
                className="w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider and Copyright */}
        <div className="border-t border-gray-800 mt-8 sm:mt-12 lg:mt-16 pt-5 sm:pt-8 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            © {new Date().getFullYear()} UPPL-T20 - Udaydev Patan Premiere League
            T20. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
