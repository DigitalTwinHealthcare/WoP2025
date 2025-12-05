import './style.css'
import Chart from 'chart.js/auto';

let pkChart = null;

document.querySelector('#sim-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        patient_id: "1",
        drug_name: formData.get('drug'),
        dose_mg: parseFloat(formData.get('dose')),
        weight_kg: parseFloat(formData.get('weight')),
        dosing_interval_h: parseFloat(formData.get('interval')),
        duration_h: parseFloat(formData.get('duration')) * 24
    };

    try {
        const response = await fetch('http://localhost:8000/ml/pkpd-simulate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Simulation failed');

        const result = await response.json();
        updateUI(result);
    } catch (error) {
        console.error('Error:', error);
        alert('Simulation failed. Check console for details.');
    }
});

function updateUI(result) {
    const simData = result.simulation_data;
    if (!simData) return;

    // Update Stats
    document.getElementById('cmax').textContent = simData.parameters.Cmax_ss.toFixed(2);
    document.getElementById('cmin').textContent = simData.parameters.Cmin_ss.toFixed(2);
    document.getElementById('auc').textContent = simData.parameters.AUC_ss.toFixed(2);
    document.getElementById('fluctuation').textContent = simData.parameters.fluctuation_percent.toFixed(1);

    // Update Chart
    const ctx = document.getElementById('pkChart').getContext('2d');

    if (pkChart) {
        pkChart.destroy();
    }

    pkChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: simData.time_hours,
            datasets: [{
                label: `${result.drug_name} Concentration (mg/L)`,
                data: simData.concentration_mg_L,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#a1a1aa'
                    }
                },
                tooltip: {
                    backgroundColor: '#1e1e1e',
                    titleColor: '#ffffff',
                    bodyColor: '#a1a1aa',
                    borderColor: '#333333',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#333333'
                    },
                    ticks: {
                        color: '#a1a1aa'
                    },
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        color: '#a1a1aa'
                    }
                },
                y: {
                    grid: {
                        color: '#333333'
                    },
                    ticks: {
                        color: '#a1a1aa'
                    },
                    title: {
                        display: true,
                        text: 'Concentration (mg/L)',
                        color: '#a1a1aa'
                    }
                }
            }
        }
    });
}
