import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-extrabold mb-4 animate-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              UPPL T20
            </h1>
            <p className="text-gray-400 max-w-lg leading-relaxed">
              Udaydev Patan Premiere League T20. The ultimate cricket tournament
              bringing together the best talent in fast-paced, action-packed
              cricket entertainment.
            </p>
            <div className="flex space-x-6 mt-6">
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-400 hover:text-blue-500 transition-transform transform hover:-translate-y-1"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-gray-400 hover:text-blue-400 transition-transform transform hover:-translate-y-1"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-pink-500 transition-transform transform hover:-translate-y-1"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://youtube.com/yourchannel"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="text-gray-400 hover:text-red-500 transition-transform transform hover:-translate-y-1"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/teams"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Teams
                </Link>
              </li>
              <li>
                <Link
                  to="/schedule"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Schedule
                </Link>
              </li>
              <li>
                <Link
                  to="/points-table"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Points Table
                </Link>
              </li>
              <li>
                <Link
                  to="/news"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  News
                </Link>
              </li>
              <li>
                <Link
                  to="/gallery"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h4 className="text-xl font-bold mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-5 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-500 transition-colors"
                aria-label="Email address"
                required
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-300 transform hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider and Copyright */}
        <div className="border-t border-gray-800 mt-16 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} PPLT20 - Udaydev Patan Premiere League
            T20. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
