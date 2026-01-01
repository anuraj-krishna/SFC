"use client";

import Link from "next/link";
import { Logo } from "@/components/ui";
import { Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";

const socialLinks = [
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Youtube, label: "YouTube" },
];

const footerLinks = {
  Programs: [
    { href: "/programs?goal=weight_loss", label: "Weight Loss" },
    { href: "/programs?goal=muscle_gain", label: "Muscle Gain" },
    { href: "/programs?goal=flexibility", label: "Flexibility" },
    { href: "/programs?goal=endurance", label: "Endurance" },
  ],
  Company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/careers", label: "Careers" },
    { href: "/blog", label: "Blog" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-dark-900/50 border-t border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-dark-400 max-w-sm">
              Transform your body, elevate your mind. Join thousands achieving their fitness
              goals with personalized programs and expert guidance.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="mailto:hello@sfcfitness.com"
                className="flex items-center gap-3 text-dark-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@sfcfitness.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center gap-3 text-dark-400 hover:text-primary-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +1 (234) 567-890
              </a>
              <div className="flex items-start gap-3 text-dark-400">
                <MapPin className="w-4 h-4 mt-1" />
                <span>123 Fitness Street, Gym City, GC 12345</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-dark-400 hover:bg-primary-500/20 hover:text-primary-400 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-dark-100 mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dark-500 text-sm">
            © {new Date().getFullYear()} SFC Fitness. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-dark-500 hover:text-dark-300 text-sm">
              Privacy
            </Link>
            <Link href="/terms" className="text-dark-500 hover:text-dark-300 text-sm">
              Terms
            </Link>
            <Link href="/cookies" className="text-dark-500 hover:text-dark-300 text-sm">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

