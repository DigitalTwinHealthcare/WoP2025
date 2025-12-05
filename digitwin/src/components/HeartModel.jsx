import { useEffect } from 'react';

const HeartModel = () => {
  useEffect(() => {
    // Load the Spline viewer script dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.5/build/spline-viewer.js';
    script.type = 'module';
    document.body.appendChild(script);

    return () => {
      // Clean up the script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <spline-viewer 
        url="https://prod.spline.design/x4PhTLBZMW2HXBuM/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      ></spline-viewer>
    </div>
  );
};

export default HeartModel;
