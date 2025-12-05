import React from 'react';

const CardiologyTwin = () => {
    return (
        <div className="w-full h-screen bg-black overflow-hidden">
            <iframe
                src="/heart5.html"
                className="w-full h-full border-0"
                title="MRI Analysis"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        </div>
    );
};

export default CardiologyTwin;
