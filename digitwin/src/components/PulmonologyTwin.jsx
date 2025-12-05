import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PulmonologyTwin.css';

const PulmonologyTwin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('select');
  const [lungStatus, setLungStatus] = useState({
    leftLung: {
      status: 'normal',
      notes: '',
      lastCheck: new Date().toISOString().split('T')[0]
    },
    rightLung: {
      status: 'normal',
      notes: '',
      lastCheck: new Date().toISOString().split('T')[0]
    }
  });

  const [respiratoryData, setRespiratoryData] = useState({
    spo2: 98,
    fvc: 3.2,
    fev1: 2.8,
    pefr: 450,
    lastUpdated: new Date().toISOString().split('T')[0]
  });

  const [selectedArea, setSelectedArea] = useState(null);
  const [examination, setExamination] = useState({
    type: '',
    findings: '',
    date: new Date().toISOString().split('T')[0]
  });

  const examinationTypes = [
    { id: 'auscultation', name: 'Auscultation' },
    { id: 'xray', name: 'X-Ray' },
    { id: 'ct_scan', name: 'CT Scan' },
    { id: 'spirometry', name: 'Spirometry' },
    { id: 'bronchoscopy', name: 'Bronchoscopy' }
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawLungDiagram(ctx, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [lungStatus]);

  const drawLungDiagram = (ctx, width, height) => {
    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw body outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Draw torso
    const torsoWidth = width * 0.6;
    const torsoHeight = height * 0.8;
    const torsoX = (width - torsoWidth) / 2;
    const torsoY = (height - torsoHeight) / 2;
    
    // Draw lungs
    const leftLungColor = lungStatus.leftLung.status === 'normal' ? '#a5d6a7' : '#ffcc80';
    const rightLungColor = lungStatus.rightLung.status === 'normal' ? '#a5d6a7' : '#ffcc80';
    
    // Left lung
    ctx.fillStyle = leftLungColor;
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoWidth * 0.3, torsoY + 10);
    ctx.quadraticCurveTo(torsoX, torsoY + torsoHeight * 0.3, torsoX, torsoY + torsoHeight * 0.7);
    ctx.quadraticCurveTo(torsoX + torsoWidth * 0.1, torsoY + torsoHeight * 0.9, torsoX + torsoWidth * 0.3, torsoY + torsoHeight * 0.9);
    ctx.quadraticCurveTo(torsoX + torsoWidth * 0.4, torsoY + torsoHeight * 0.6, torsoX + torsoWidth * 0.3, torsoY + 10);
    ctx.fill();
    ctx.stroke();
    
    // Right lung
    ctx.fillStyle = rightLungColor;
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoWidth * 0.7, torsoY + 10);
    ctx.quadraticCurveTo(torsoX + torsoWidth, torsoY + torsoHeight * 0.3, torsoX + torsoWidth, torsoY + torsoHeight * 0.7);
    ctx.quadraticCurveTo(torsoX + torsoWidth * 0.9, torsoY + torsoHeight * 0.9, torsoX + torsoWidth * 0.7, torsoY + torsoHeight * 0.9);
    ctx.quadraticCurveTo(torsoX + torsoWidth * 0.6, torsoY + torsoHeight * 0.6, torsoX + torsoWidth * 0.7, torsoY + 10);
    ctx.fill();
    ctx.stroke();
    
    // Draw trachea
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoWidth * 0.48, torsoY);
    ctx.lineTo(torsoX + torsoWidth * 0.52, torsoY);
    ctx.lineTo(torsoX + torsoWidth * 0.52, torsoY + torsoHeight * 0.2);
    ctx.lineTo(torsoX + torsoWidth * 0.48, torsoY + torsoHeight * 0.2);
    ctx.closePath();
    ctx.fillStyle = '#bbdefb';
    ctx.fill();
    ctx.stroke();
    
    // Draw bronchi
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoWidth * 0.5, torsoY + torsoHeight * 0.2);
    ctx.lineTo(torsoX + torsoWidth * 0.3, torsoY + torsoHeight * 0.3);
    ctx.moveTo(torsoX + torsoWidth * 0.5, torsoY + torsoHeight * 0.2);
    ctx.lineTo(torsoX + torsoWidth * 0.7, torsoY + torsoHeight * 0.3);
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Left Lung', torsoX + torsoWidth * 0.15, torsoY + torsoHeight * 0.5);
    ctx.fillText('Right Lung', torsoX + torsoWidth * 0.85, torsoY + torsoHeight * 0.5);
  };

  const handleLungClick = (lung) => {
    setSelectedArea(lung);
    setExamination({
      type: '',
      findings: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleExaminationSubmit = (e) => {
    e.preventDefault();
    if (!selectedArea || !examination.type) return;
    
    const updatedStatus = { ...lungStatus };
    updatedStatus[selectedArea] = {
      status: examination.findings.includes('abnormal') ? 'abnormal' : 'normal',
      notes: examination.findings,
      lastCheck: examination.date
    };
    
    setLungStatus(updatedStatus);
    setExamination({
      type: '',
      findings: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    showToast(`Examination recorded for ${selectedArea === 'leftLung' ? 'left' : 'right'} lung`);
  };

  const updateRespiratoryData = (field, value) => {
    setRespiratoryData({
      ...respiratoryData,
      [field]: value,
      lastUpdated: new Date().toISOString().split('T')[0]
    });
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
    <div className="pulmonology-container">
      {/* Header */}
      <div className="pulmonology-header">
        <h1>Pulmonology - Patient #{id}</h1>
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
      <div className="pulmonology-toolbar">
        <button 
          className={`icon-btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
          title="Select"
        >
          ✋
        </button>
        <button 
          className={`icon-btn ${mode === 'auscultate' ? 'active' : ''}`}
          onClick={() => setMode('auscultate')}
          title="Auscultate"
        >
          👂
        </button>
        <button 
          className={`icon-btn ${mode === 'measure' ? 'active' : ''}`}
          onClick={() => setMode('measure')}
          title="Measure"
        >
          📏
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
              // In a real app, you would calculate which area was clicked
              const rect = canvasRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              // Simple click detection (left or right half)
              if (x < rect.width / 2) {
                handleLungClick('leftLung');
              } else {
                handleLungClick('rightLung');
              }
            }}
          ></canvas>
        </div>
        <div className="status-bar">
          <span>Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
          {selectedArea && <span>Selected: {selectedArea === 'leftLung' ? 'Left Lung' : 'Right Lung'}</span>}
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
            <div className="form-control">45 / Male</div>
          </div>
          <div className="form-group">
            <label>Last Visit</label>
            <div className="form-control">2023-10-15</div>
          </div>
        </div>

        <div className="panel-section">
          <h3>Respiratory Data</h3>
          <div className="respiratory-data">
            <div className="data-item">
              <label>SpO₂</label>
              <div className="data-value">
                <input 
                  type="number" 
                  value={respiratoryData.spo2} 
                  onChange={(e) => updateRespiratoryData('spo2', e.target.value)}
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
            </div>
            <div className="data-item">
              <label>FVC</label>
              <div className="data-value">
                <input 
                  type="number" 
                  value={respiratoryData.fvc} 
                  onChange={(e) => updateRespiratoryData('fvc', e.target.value)}
                  step="0.1"
                  min="0"
                />
                <span>L</span>
              </div>
            </div>
            <div className="data-item">
              <label>FEV₁</label>
              <div className="data-value">
                <input 
                  type="number" 
                  value={respiratoryData.fev1} 
                  onChange={(e) => updateRespiratoryData('fev1', e.target.value)}
                  step="0.1"
                  min="0"
                />
                <span>L</span>
              </div>
            </div>
            <div className="data-item">
              <label>PEFR</label>
              <div className="data-value">
                <input 
                  type="number" 
                  value={respiratoryData.pefr} 
                  onChange={(e) => updateRespiratoryData('pefr', e.target.value)}
                  min="0"
                />
                <span>L/min</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Last updated: {respiratoryData.lastUpdated}
          </div>
        </div>

        <div className="panel-section">
          <h3>Lung Examination</h3>
          {selectedArea ? (
            <div>
              <div className="form-group">
                <label>Selected Area</label>
                <div className="status-badge">
                  {selectedArea === 'leftLung' ? 'Left Lung' : 'Right Lung'}
                </div>
                <div className="mt-2 text-sm">
                  Status: <span className="status-text">
                    {lungStatus[selectedArea]?.status || 'Not examined'}
                  </span>
                </div>
                {lungStatus[selectedArea]?.lastCheck && (
                  <div className="text-xs text-gray-400 mt-1">
                    Last check: {lungStatus[selectedArea].lastCheck}
                  </div>
                )}
              </div>
              
              <form onSubmit={handleExaminationSubmit}>
                <div className="form-group">
                  <label>Examination Type</label>
                  <select
                    className="form-control"
                    value={examination.type}
                    onChange={(e) => setExamination({...examination, type: e.target.value})}
                    required
                  >
                    <option value="">Select examination type</option>
                    {examinationTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={examination.date}
                    onChange={(e) => setExamination({...examination, date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Findings</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={examination.findings}
                    onChange={(e) => setExamination({...examination, findings: e.target.value})}
                    placeholder="Enter examination findings..."
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary w-full">
                  Record Examination
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Click on a lung area to examine
            </div>
          )}
        </div>
        
        <div className="panel-section">
          <h3>Examination History</h3>
          <div className="history-list">
            {selectedArea && lungStatus[selectedArea]?.notes ? (
              <div className="history-item">
                <div className="history-date">
                  {lungStatus[selectedArea].lastCheck}
                </div>
                <div className="history-notes">
                  {lungStatus[selectedArea].notes}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No examinations recorded for this area
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

export default PulmonologyTwin;
