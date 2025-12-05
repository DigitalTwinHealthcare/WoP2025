import React, { useEffect } from 'react';
import { api } from '../services/api';

const DrugSimulation = ({ patientId }) => {
    useEffect(() => {
        const handleMessage = async (event) => {
            // Log all messages to see if we are receiving anything
            // console.log("DrugSimulation received message:", event.data);

            if (event.data && event.data.type === 'SIMULATE_DRUG') {
                console.log("✅ SIMULATE_DRUG message received!", event.data.data);
                try {
                    const payload = {
                        patient_id: patientId || 1, // Fallback to 1 if not provided
                        drug_name: event.data.data.drug,
                        dose_mg: event.data.data.dosage,
                        duration_hours: 24.0,
                        // Patient Parameters
                        // Patient Parameters (Optional - backend will fetch if missing)
                        age: event.data.data.age || null,
                        sex: event.data.data.sex || null,
                        weight: event.data.data.weight || null,
                        height: event.data.data.height || null,
                        hr: event.data.data.hr || null,
                        sbp: event.data.data.sbp || null,
                        dbp: event.data.data.dbp || null
                    };

                    console.log("Sending simulation payload:", payload);
                    const response = await api.runSimulation(payload);
                    console.log("Simulation response:", response);

                    // Send result back to iframe
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.contentWindow) {
                        // Pass the raw data structure AND image paths to the iframe
                        iframe.contentWindow.postMessage({
                            type: 'SIMULATION_COMPLETE',
                            result: {
                                concentration: response.raw_data.pk.concentration,
                                effect: response.raw_data.pd.delta_hr, // Using HR change as the primary effect for now
                                time: response.raw_data.pk.time,
                                images: {
                                    pk: response.simulation.pk_plot_path,
                                    hr: response.simulation.hr_plot_path,
                                    bp: response.simulation.bp_plot_path,
                                    dashboard: response.simulation.dashboard_plot_path
                                }
                            }
                        }, '*');
                    }

                    // alert("Simulation started successfully! Check console for details.");
                } catch (error) {
                    console.error("Simulation failed:", error);
                    alert("Simulation failed. See console.");
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [patientId]);

    return (
        <div className="w-full h-screen bg-black overflow-hidden">
            <iframe
                src="/intheart3.html"
                className="w-full h-full border-0"
                title="Drug Simulation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        </div>
    );
};

export default DrugSimulation;
