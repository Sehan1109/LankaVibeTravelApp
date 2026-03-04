import React, { useState, useEffect } from 'react';
import { Plane, Map, Sun, Briefcase, Compass } from 'lucide-react';

const styles = `
    @keyframes fade-in-up {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fade-in-up 0.5s ease-out forwards;
    }
`;

const loadingMessages = [
    { text: "Finding the best hotels for you...", icon: <Briefcase className="w-6 h-6" /> },
    { text: "Checking local weather for your dates...", icon: <Sun className="w-6 h-6" /> },
    { text: "Packing your virtual bags...", icon: <Plane className="w-6 h-6" /> },
    { text: "Optimizing the best routes for your trip...", icon: <Map className="w-6 h-6" /> },
    { text: "Discovering hidden gems nearby...", icon: <Compass className="w-6 h-6" /> },
    { text: "Almost there! Finalizing your itinerary...", icon: <Compass className="w-6 h-6" /> }
];

const LoadingScreen = () => {
    const [index, setIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // මැසේජ් මාරු කිරීම
        const msgInterval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 3000);

        // Progress bar එක පාලනය කිරීම
        // මේකෙන් වෙන්නේ තත්පරයකට වරක් progress එක වැඩි කරන එක
        const progInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 92) return prev; // 92% දී නතර වෙනවා (සැබෑ දත්ත එනතෙක්)
                return prev + (prev < 50 ? 2 : 0.5); // මුලදි වේගයෙන් ගොස් පසුව හෙමින් යනවා
            });
        }, 300);

        return () => {
            clearInterval(msgInterval);
            clearInterval(progInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl shadow-sm border border-emerald-50 mt-10">
            <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping"></div>
                <div className="relative bg-emerald-600 p-5 rounded-full text-white animate-bounce">
                    {loadingMessages[index].icon}
                </div>
            </div>

            <div className="h-12 overflow-hidden">
                <h3 key={index} className="text-xl font-semibold text-gray-800 animate-fade-in-up">
                    {loadingMessages[index].text}
                </h3>
            </div>

            <p className="mt-4 text-gray-500 text-sm italic">
                Our AI is crafting a personalized travel experience just for you.
            </p>

            {/* Progress Bar Area */}
            <div className="w-64 mt-8">
                <div className="flex justify-between mb-1">
                    <span className="text-xs text-emerald-600 font-bold">{Math.round(progress)}%</span>
                    <span className="text-xs text-gray-400 font-medium">Generating...</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <style>{styles}</style>
        </div>
    );
};

export default LoadingScreen;