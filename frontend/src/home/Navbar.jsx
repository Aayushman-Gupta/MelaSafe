import React, { useState } from "react";

const navLinks = [
    { name: "Home", link: "#home" },
    { name: "Travel", link: "#travel" },
    { name: "Live Data", link: "#live-data" },
    { name: "Future Hotspots", link: "#future-hotspots" },
    { name: "About your location", link: "#about-your-location" },
    { name: "Nearby Services", link: "#nearby-services" },
    { name: "For Emergency Personnel", link: "#emergency-personell" },
];

// Smooth scroll with animation
const handleNavClick = (e, link) => {
    e.preventDefault();
    const target = document.querySelector(link);
    if (target) {
        target.scrollIntoView({ 
            behavior: "smooth",
            block: "start",
            inline: "nearest"
        });
        // Add highlight animation to the target section
        target.classList.add("animate-section-highlight");
        setTimeout(() => {
            target.classList.remove("animate-section-highlight");
        }, 1500);
    }
};

const Navbar = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            {/* Add custom CSS for the highlight animation */}
            <style jsx>{`
                @keyframes sectionHighlight {
                    0% {
                        background-color: rgba(254, 93, 38, 0.1);
                        transform: scale(1);
                    }
                    50% {
                        background-color: rgba(254, 93, 38, 0.2);
                        transform: scale(1.02);
                    }
                    100% {
                        background-color: transparent;
                        transform: scale(1);
                    }
                }
                
                .animate-section-highlight {
                    animation: sectionHighlight 1.5s ease-in-out;
                    border: 2px solid rgba(254, 93, 38, 0.3);
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }
            `}</style>
            
            <nav className="fixed top-0 left-0 w-full flex items-center justify-between bg-[#FE5D26] text-white px-6 py-4 shadow-md z-40">
                <div 
                    className="text-2xl font-bold cursor-pointer hover:text-blue-300 transition-colors duration-200"
                    onClick={(e) => handleNavClick(e, "#home")}
                >
                    HackZilla
                </div>
                <button
                    className="md:hidden text-3xl focus:outline-none hover:text-blue-300 transition-colors duration-200"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle navigation"
                >
                    <span>&#9776;</span>
                </button>
                <ul className="hidden md:flex space-x-6">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <a
                                href={link.link}
                                className="hover:text-blue-300 transition-all duration-200 hover:scale-105 cursor-pointer"
                                onClick={(e) => handleNavClick(e, link.link)}
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:hidden`}
            >
                <button
                    className="absolute top-4 right-4 text-3xl text-gray-700 focus:outline-none hover:text-red-500 transition-colors duration-200"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    &times;
                </button>
                <ul className="mt-16 space-y-4 px-6">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <a
                                href={link.link}
                                className="block text-lg text-gray-800 hover:text-blue-600 transition-all duration-200 hover:scale-105 hover:translate-x-2 cursor-pointer py-2 px-3 rounded-md hover:bg-gray-100"
                                onClick={(e) => {
                                    handleNavClick(e, link.link);
                                    setSidebarOpen(false);
                                }}
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-40 z-20 transition-opacity duration-300 ${
                    sidebarOpen ? "block opacity-100" : "hidden opacity-0"
                } md:hidden`}
                onClick={() => setSidebarOpen(false)}
            />
            
            {/* Spacer to prevent content from being hidden behind navbar */}
            <div className="h-20 md:h-20" />
        </>
    );
};

export default Navbar;