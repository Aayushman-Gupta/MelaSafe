import React from "react";

const Card = ({ name, href, img }) => {
  const handleClick = () => {
    // Check if href is an actual ID selector (starts with #)
    if (href && href.startsWith('#')) {
      const section = document.getElementById(href.substring(1));
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else if (href && href !== '#') {
      // Handle regular navigation
      window.location.href = href;
    }
  };

  return (
    <div
      className="cursor-pointer bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102 flex flex-col justify-center items-center p-4 sm:p-6 w-full max-w-xs mx-auto h-32 sm:h-36"
      onClick={handleClick}
    >
      <img
        src={img}
        alt={name}
        className="w-8 h-8 sm:w-15 sm:h-15 object-contain mb-2 sm:mb-3 flex-shrink-0"
      />
      <h3 className="text-sm sm:text-lg font-semibold text-gray-800 text-center leading-tight">{name}</h3>
    </div>
  );
};

export default Card;