import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DentistryTwin.css';

const DentistryTwin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('select');
  const [toothChart, setToothChart] = useState(Array(32).fill(null).map((_, i) => ({
    id: i + 1,
    status: 'healthy',
    notes: ''
  })));

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [procedure, setProcedure] = useState({
    type: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const procedures = [
    { id: 'filling', name: 'Filling' },
    { id: 'extraction', name: 'Extraction' },
    { id: 'crown', name: 'Crown' },
    { id: 'root_canal', name: 'Root Canal' },
    { id: 'cleaning', name: 'Cleaning' },
    { id: 'implant', name: 'Implant' }
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawToothChart(ctx, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [toothChart]);

  const drawToothChart = (ctx, width, height) => {
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw tooth chart
    const teethPerRow = 8;
    const toothWidth = width / (teethPerRow + 2);
    const toothHeight = height / 5;
    
    // Draw upper jaw
    for (let i = 0; i < teethPerRow; i++) {
      const tooth = toothChart[i];
      const x = (i + 1) * toothWidth;
      const y = toothHeight;
      
      drawTooth(ctx, x, y, toothWidth * 0.8, toothHeight * 0.8, tooth, i + 1);
    }
    
    // Draw lower jaw
    for (let i = 0; i < teethPerRow; i++) {
      const tooth = toothChart[i + 16];
      const x = (teethPerRow - i) * toothWidth;
      const y = toothHeight * 3;
      
      drawTooth(ctx, x, y, toothWidth * 0.8, toothHeight * 0.8, tooth, i + 17);
    }
  };

  const drawTooth = (ctx, x, y, width, height, tooth, number) => {
    // Save the current context state
    ctx.save();
    
    // Set tooth color based on status
    let fillColor = '#ffffff';
    let borderColor = '#333';
    
    if (tooth.status === 'cavity') fillColor = '#ffd700';
    else if (tooth.status === 'extracted') fillColor = '#ddd';
    else if (tooth.status === 'filling') fillColor = '#b0e0e6';
    else if (tooth.status === 'crown') fillColor = '#e6e6fa';
    else if (tooth.status === 'implant') fillColor = '#e0ffff';
    
    // Draw tooth
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    
    // Simple tooth shape (rectangle with rounded top)
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw tooth number
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, x + width/2, y + height/2);
    
    // Restore the context state
    ctx.restore();
  };

  const handleToothClick = (toothNumber) => {
    setSelectedTooth(toothNumber);
    setProcedure({
      type: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleProcedureSubmit = (e) => {
    e.preventDefault();
    if (!selectedTooth || !procedure.type) return;
    
    const updatedChart = [...toothChart];
    updatedChart[selectedTooth - 1] = {
      ...updatedChart[selectedTooth - 1],
      status: procedure.type,
      notes: procedure.notes,
      lastProcedure: {
        type: procedure.type,
        date: procedure.date,
        notes: procedure.notes
      }
    };
    
    setToothChart(updatedChart);
    setProcedure({
      type: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    showToast(`Procedure recorded for tooth #${selectedTooth}`);
  };

  const showToast = (message) => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => {
        toast.classList.remove('visible');
      }, 3000);
    }
  };

  return (
    <div className="dentistry-container">
      {/* Header */}
      <div className="dentistry-header">
        <h1>Dentistry - Patient #{id}</h1>
        <div>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Back to Patient
          </button>
        </div>
      </div>

      {/* Left Toolbar */}
      <div className="dentistry-toolbar">
        <button 
          className={`icon-btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
          title="Select"
        >
          ✋
        </button>
        <button 
          className={`icon-btn ${mode === 'cavity' ? 'active' : ''}`}
          onClick={() => setMode('cavity')}
          title="Mark Cavity"
        >
          🦷
        </button>
        <button 
          className={`icon-btn ${mode === 'extraction' ? 'active' : ''}`}
          onClick={() => setMode('extraction')}
          title="Mark Extraction"
        >
          🦷
        </button>
        <div className="divider"></div>
        <button 
          className="icon-btn"
          title="Zoom In"
        >
          ➕
        </button>
        <button 
          className="icon-btn"
          title="Zoom Out"
        >
          ➖
        </button>
        <div className="divider"></div>
        <button 
          className="icon-btn"
          title="Save"
        >
          💾
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="main-area">
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            onClick={(e) => {
              // In a real app, you would calculate which tooth was clicked
              // For now, we'll just select a random tooth for demonstration
              const toothNumber = Math.floor(Math.random() * 32) + 1;
              handleToothClick(toothNumber);
            }}
          ></canvas>
        </div>
        <div className="status-bar">
          <span>Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
          {selectedTooth && <span>Selected: Tooth #{selectedTooth}</span>}
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="properties-panel">
        <div className="panel-section">
          <h3>Patient Information</h3>
          <div className="form-group">
            <label>Name</label>
            <div className="form-control">John Doe</div>
          </div>
          <div className="form-group">
            <label>Age / Gender</label>
            <div className="form-control">35 / Male</div>
          </div>
          <div className="form-group">
            <label>Last Visit</label>
            <div className="form-control">2023-10-15</div>
          </div>
        </div>

        <div className="panel-section">
          <h3>Tooth Information</h3>
          {selectedTooth ? (
            <div>
              <div className="form-group">
                <label>Tooth #{selectedTooth}</label>
                <div className="tooth-status">
                  Status: <span className="status-badge">
                    {toothChart[selectedTooth - 1]?.status || 'Healthy'}
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleProcedureSubmit}>
                <div className="form-group">
                  <label>Procedure</label>
                  <select
                    className="form-control"
                    value={procedure.type}
                    onChange={(e) => setProcedure({...procedure, type: e.target.value})}
                    required
                  >
                    <option value="">Select a procedure</option>
                    {procedures.map(proc => (
                      <option key={proc.id} value={proc.id}>
                        {proc.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={procedure.date}
                    onChange={(e) => setProcedure({...procedure, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={procedure.notes}
                    onChange={(e) => setProcedure({...procedure, notes: e.target.value})}
                    placeholder="Procedure notes..."
                  ></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary w-full">
                  Record Procedure
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Click on a tooth to view details or record a procedure
            </div>
          )}
        </div>
        
        <div className="panel-section">
          <h3>Dental History</h3>
          <div className="history-list">
            {selectedTooth && toothChart[selectedTooth - 1]?.lastProcedure ? (
              <div className="history-item">
                <div className="history-date">
                  {toothChart[selectedTooth - 1].lastProcedure.date}
                </div>
                <div className="history-procedure">
                  {toothChart[selectedTooth - 1].lastProcedure.type}
                </div>
                <div className="history-notes">
                  {toothChart[selectedTooth - 1].lastProcedure.notes}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No procedures recorded for this tooth
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div id="toast" className="toast"></div>
    </div>
  );
};

export default DentistryTwin;
