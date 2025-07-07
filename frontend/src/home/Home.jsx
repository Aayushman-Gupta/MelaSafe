import { useState, useEffect, useRef } from "react";
import travelImg1 from "../assets/img/home/travelImg1.png";
import travelImg2 from "../assets/img/home/travelImg2.png";
import travelImg3 from "../assets/img/home/travelImg3.png";
import travelImg4 from "../assets/img/home/travelImg4.png";

const images = [travelImg1, travelImg2, travelImg3, travelImg4];

const Home = () => {
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearTimeout(timeoutRef.current);
    }, [current]);

    const prevImage = () => {
        setCurrent((prev) => (prev - 1 + images.length) % images.length);
    };

    const nextImage = () => {
        setCurrent((prev) => (prev + 1) % images.length);
    };

    return (
        <div className="w-screen h-screen flex flex-col md:flex-row overflow-hidden relative -mt-4">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-purple-600"></div>
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 z-1">
                <div className="particle absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full opacity-60 animate-float"></div>
                <div className="particle absolute top-3/4 left-1/3 w-1 h-1 bg-yellow-200 rounded-full opacity-80 animate-float animation-delay-1000"></div>
                <div className="particle absolute top-1/2 left-1/5 w-3 h-3 bg-orange-200 rounded-full opacity-50 animate-float animation-delay-2000"></div>
                <div className="particle absolute top-1/3 left-2/3 w-2 h-2 bg-red-200 rounded-full opacity-70 animate-float animation-delay-3000"></div>
                <div className="particle absolute top-2/3 left-1/2 w-1 h-1 bg-purple-200 rounded-full opacity-60 animate-float animation-delay-4000"></div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                .animation-delay-1000 { animation-delay: 1s; }
                .animation-delay-3000 { animation-delay: 3s; }
            `}</style>

            {/* Left Section (hidden on mobile, visible on md+) */}
            <div className="hidden md:flex w-1/2 h-full flex-col justify-center items-center pr-16 z-10 relative">
                {/* Decorative elements */}
                <div className="absolute top-20 left-10 w-16 h-16 border-4 border-white/30 rounded-full animate-spin"></div>
                <div className="absolute bottom-32 right-20 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-8 w-12 h-12 border-2 border-white/40 rotate-45 animate-bounce"></div>

                <div className="max-w-md text-center relative">
                    {/* Glowing background for text */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl"></div>
                    
                    <div className="relative p-8">
                        <div className="mb-6">
                            <span className="inline-block text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-white via-yellow-100 to-orange-100 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                                Predict.
                            </span>
                        </div>
                        <div className="mb-6">
                            <span className="inline-block text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-orange-100 via-white to-purple-100 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                                Prevent.
                            </span>
                        </div>
                        <div className="mb-8">
                            <span className="inline-block text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-purple-100 via-pink-100 to-white bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                                Protect.
                            </span>
                        </div>
                        
                        <div className="space-y-4 text-white/90">
                            <p className="text-lg lg:text-xl leading-relaxed drop-shadow-lg">
                                🌍 Discover new destinations with peace of mind. Our platform ensures your journeys are secure and comfortable.
                            </p>
                            <p className="text-lg lg:text-xl leading-relaxed drop-shadow-lg">
                                📅 Plan ahead, stay informed, and enjoy seamless travel experiences every time.
                            </p>
                            <p className="text-lg lg:text-xl leading-relaxed drop-shadow-lg">
                                🛡️ Your safety is our top priority—explore the world with confidence.
                            </p>
                        </div>

                        {/* Call to action button */}
                        <div className="mt-8">
                            <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-8 rounded-full border border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
                                Start Your Journey
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section with Slideshow */}
            <div className="w-full md:w-1/2 h-full flex items-center justify-end z-10 relative overflow-hidden transition-transform duration-500 ease-in-out hover:scale-105">
                <img
                    src={images[current]}
                    alt="Travel"
                    className="w-full h-full object-cover shadow-xl transition-all duration-700 [clip-path:ellipse(90%_100%_at_15%_50%)] md:[clip-path:ellipse(90%_100%_at_100%_15%)] [clip-path:none]:sm"
                />
                
                {/* Mobile Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 md:hidden bg-gradient-to-b from-black/60 via-black/30 to-transparent z-20">
                    <h1 className="text-4xl xs:text-5xl font-extrabold mb-4 text-white text-center drop-shadow-lg">Travel safely</h1>
                    <p className="text-lg xs:text-xl font-bold text-white mb-2 text-center drop-shadow">
                        🌍 Discover new destinations with peace of mind. Our platform ensures your journeys are secure and comfortable.
                    </p>
                    <p className="text-lg xs:text-xl font-bold text-white mb-2 text-center drop-shadow">
                        📅 Plan ahead, stay informed, and enjoy seamless travel experiences every time.
                    </p>
                    <p className="text-lg xs:text-xl font-bold text-white text-center drop-shadow">
                        🛡️ Your safety is our top priority—explore the world with confidence.
                    </p>
                </div>
                
                {/* Enhanced Arrows with better styling */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 z-30">
                    <button
                        onClick={prevImage}
                        className="bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-300 hover:scale-110 hover:shadow-xl backdrop-blur-sm"
                        aria-label="Previous image"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={nextImage}
                        className="bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-300 hover:scale-110 hover:shadow-xl backdrop-blur-sm"
                        aria-label="Next image"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                            <path d="M9 6l6 6-6 6" />
                        </svg>
                    </button>
                </div>

                {/* Image indicators */}
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                current === index 
                                    ? 'bg-white shadow-lg scale-125' 
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;