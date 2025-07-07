import React, { useState, useEffect } from 'react'
import Card from './Card'

import IconHome from '../assets/img/home/IconHome.png';
import IconLiveData from '../assets/img/home/IconLiveData.png';
import IconTravel from '../assets/img/home/IconTravel.png';
import IconFutureHotspots from '../assets/img/home/IconFutureHotSpots.png';
import IconNearbyServices from '../assets/img/home/IconNearbyServices.png';
import IconEmergencyPersonnel from '../assets/img/home/IconEmergencyPersonell.png';

const cardData = [
    { name: "Home", href: "#home", img: IconHome, delay: "0ms" },
    { name: "Live Data", href: "#live-data", img: IconLiveData, delay: "100ms" },
    { name: "Travel", href: "#travel", img: IconTravel, delay: "200ms" },
    { name: "Future Hotspots", href: "#future-hotspots", img: IconFutureHotspots, delay: "300ms" },
    { name: "Nearby Services", href: "#nearby-services", img: IconNearbyServices, delay: "400ms" },
    { name: "For Emergency Personnel", href: "emergency-personell", img: IconEmergencyPersonnel, delay: "500ms" },
];

export default function Links() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const scrollToComponent = (componentId) => {
        const element = document.getElementById(componentId.replace('#', ''));
        if (element) {
            element.scrollIntoView({ 
                behavior: "smooth",
                block: "start",
                inline: "nearest"
            });
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-orange-50 via-white to-orange-50">
            {/* Subtle background accent */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/60 to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-100/40 to-transparent rounded-full transform -translate-x-24 translate-y-24"></div>
            </div>

            {/* Clean header section */}
            <div className="relative z-10 mt-16 mb-12 text-center">
                <div className={`transition-all duration-800 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-800 mb-3">
                        Explore
                        <span className="font-medium text-orange-600 ml-3">Features</span>
                    </h1>
                    <p className="text-gray-600 text-lg font-light max-w-md mx-auto leading-relaxed">
                        Discover powerful tools designed for your needs
                    </p>
                    <div className="mt-6 w-16 h-0.5 bg-orange-500 mx-auto"></div>
                </div>
            </div>
            
            {/* Clean cards grid */}
            <div className="relative z-10 w-full max-w-6xl px-6 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cardData.map((card, idx) => (
                        <div
                            key={idx}
                            className={`group cursor-pointer transition-all duration-500 ease-out ${
                                isVisible 
                                    ? 'opacity-100 translate-y-0' 
                                    : 'opacity-0 translate-y-8'
                            }`}
                            style={{
                                transitionDelay: card.delay
                            }}
                            onClick={() => scrollToComponent(card.href)}
                        >
                            <div className="relative bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
                                {/* Subtle hover accent */}
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Clean border accent on hover */}
                                <div className="absolute inset-0 border-2 border-orange-200/0 group-hover:border-orange-200/60 rounded-xl transition-all duration-300"></div>
                                
                                {/* Card content */}
                                <div className="relative z-10">
                                    <Card {...card} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Minimalist footer accent */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
        </div>
    )
}