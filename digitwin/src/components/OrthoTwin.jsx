import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './OrthoTwin.css';



const OrthoTwin = () => {
    const navigate = useNavigate();
    // --- REFS ---
    const canvasRef = useRef(null);
    const mainAreaRef = useRef(null);
    const imgRef = useRef(new Image());

    // Viewport
    const viewRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
    const isPanningRef = useRef(false);
    const startPanRef = useRef({ x: 0, y: 0 });

    // Interaction
    const clicksRef = useRef([]);
    const cursorRef = useRef({ x: 0, y: 0 });

    // Implant State
    const implantRef = useRef({
        active: false,
        x: 0, y: 0,
        mmWidth: 0, mmHeight: 0,
        rotation: 0,
        holes: 8,
        screws: [],
        dragging: false,
        dragStart: { x: 0, y: 0 }
    });

    // --- STATE ---
    const [mode, setMode] = useState('IDLE'); // IDLE, CALIBRATE, MEASURE, ANGLE, CIRCLE, OSTEOTOMY
    const [scaleFactor, setScaleFactor] = useState(0);
    const [annotations, setAnnotations] = useState([]); // History
    const [filters, setFilters] = useState({ invert: false, contrast: false, brightness: 100 });

    // UI & Feedback
    const [toastMsg, setToastMsg] = useState('');
    const [isToastVisible, setIsToastVisible] = useState(false);

    // Implant Properties
    const [implantSystem, setImplantSystem] = useState('large');
    const [implantPlate, setImplantPlate] = useState('8');
    const [implantRotation, setImplantRotation] = useState(0);
    const [isImplantVisible, setIsImplantVisible] = useState(false);

    // --- ENGINE ---
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const view = viewRef.current;
        const img = imgRef.current;
        const implant = implantRef.current;

        // 1. Setup
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Fill black
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!img.src) {
            ctx.fillStyle = "#888"; ctx.font = "18px Segoe UI"; ctx.textAlign = "center";
            ctx.fillText("Drag & Drop or Upload X-Ray", canvas.width / 2, canvas.height / 2);
            return;
        }

        // 2. Transform
        ctx.translate(view.offsetX, view.offsetY);
        ctx.scale(view.scale, view.scale);

        // 3. Image & Filters
        ctx.save();
        let filterStr = `brightness(${filters.brightness}%) `;
        if (filters.invert) filterStr += "invert(1) ";
        if (filters.contrast) filterStr += "contrast(1.5) ";
        ctx.filter = filterStr;
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        // 4. Annotations
        annotations.forEach(ann => {
            ctx.lineWidth = 3 / view.scale;
            ctx.strokeStyle = ann.color;
            ctx.fillStyle = ann.color;

            if (ann.type === 'line' || ann.type === 'osteotomy') {
                if (ann.type === 'osteotomy') ctx.setLineDash([10 / view.scale, 5 / view.scale]);
                drawLine(ctx, ann.p1, ann.p2);
                ctx.setLineDash([]);
                if (ann.text) drawTextLabel(ctx, ann.text, ann.p1, ann.p2, view.scale, ann.color);
            }
            else if (ann.type === 'angle') {
                drawAngle(ctx, ann.p1, ann.p2, ann.p3);
                drawTextLabel(ctx, ann.text, ann.p1, ann.p3, view.scale, ann.color); // Approx label pos
            }
            else if (ann.type === 'circle') {
                ctx.beginPath(); ctx.arc(ann.center.x, ann.center.y, ann.radius, 0, Math.PI * 2); ctx.stroke();
                drawTextLabel(ctx, ann.text, ann.center, ann.edge, view.scale, ann.color);
            }
        });

        // 5. Implant
        if (implant.active) drawImplant(ctx, implant, scaleFactor, view.scale);

        // 6. Active Tool Drawing
        if (mode !== 'IDLE' && clicksRef.current.length > 0) {
            const mouse = cursorRef.current;
            const clicks = clicksRef.current;
            const p1 = clicks[clicks.length - 1];

            ctx.lineWidth = 2 / view.scale;
            ctx.strokeStyle = (mode === 'CALIBRATE') ? '#ff4d4d' : '#00e5ff';
            ctx.setLineDash([5 / view.scale, 5 / view.scale]);

            if (mode === 'CIRCLE') {
                const r = Math.hypot(mouse.x - p1.x, mouse.y - p1.y);
                ctx.beginPath(); ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                if (mode === 'ANGLE' && clicks.length === 2) drawLine(ctx, clicks[0], clicks[1]);
            }
            ctx.setLineDash([]);
        }

        // 7. Click Markers
        clicksRef.current.forEach(p => {
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 4 / view.scale, 0, Math.PI * 2); ctx.fill();
        });

    }, [filters, annotations, scaleFactor, mode]);

    // --- DRAW HELPERS ---
    const drawLine = (ctx, p1, p2) => { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); };
    const drawAngle = (ctx, p1, p2, p3) => { ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.stroke(); };
    const drawTextLabel = (ctx, text, p1, p2, scale, color) => {
        const midX = (p1.x + p2.x) / 2; const midY = (p1.y + p2.y) / 2;
        const fs = 14 / scale;
        ctx.font = `bold ${fs}px Arial`;
        const w = ctx.measureText(text).width;
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(midX - w / 2 - 4, midY - fs, w + 8, fs + 6);
        ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(text, midX, midY);
    };

    // BETTER SCREWS
    const drawImplant = (ctx, imp, scaleFactor, viewScale) => {
        ctx.save();
        ctx.translate(imp.x, imp.y);
        ctx.rotate(imp.rotation * Math.PI / 180);
        const pxPerMm = (scaleFactor > 0) ? scaleFactor : 2;
        const w = imp.mmWidth * pxPerMm;
        const h = imp.mmHeight * pxPerMm;
        const r = h / 2;

        // Plate Body
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#d0d0d0"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 / viewScale;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r); else ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill(); ctx.globalAlpha = 1.0; ctx.stroke();

        // Screws
        const holeSpacing = w / (imp.holes + 0.6);
        const startX = -w / 2 + (w - (imp.holes - 1) * holeSpacing) / 2;
        const holeRad = (h * 0.35);

        for (let i = 0; i < imp.holes; i++) {
            const cx = startX + (i * holeSpacing);

            if (imp.screws[i]) {
                // FILLED SCREW (Metallic look)
                ctx.fillStyle = "#a0a0a0"; ctx.beginPath(); ctx.arc(cx, 0, holeRad, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#444"; ctx.lineWidth = 1 / viewScale; ctx.stroke();
                // Cross head
                ctx.beginPath(); ctx.moveTo(cx - holeRad * 0.6, 0); ctx.lineTo(cx + holeRad * 0.6, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, -holeRad * 0.6); ctx.lineTo(cx, holeRad * 0.6); ctx.stroke();
            } else {
                // EMPTY HOLE (Dark void)
                ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(cx, 0, holeRad * 0.8, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#000"; ctx.lineWidth = 1 / viewScale; ctx.stroke();
            }
        }
        ctx.restore();
    };

    // --- ACTIONS ---
    const fitImage = useCallback(() => {
        if (!imgRef.current.width || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;

        // Calculate strict fit
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scale = Math.min(scaleX, scaleY) * 0.9; // 90% fit

        viewRef.current = {
            scale: scale,
            offsetX: (canvas.width - img.width * scale) / 2,
            offsetY: (canvas.height - img.height * scale) / 2
        };

        // Reset implant to center
        implantRef.current.x = img.width / 2;
        implantRef.current.y = img.height / 2;
        draw();
    }, [draw]);

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            imgRef.current.src = ev.target.result;
            imgRef.current.onload = fitImage; // Trigger fit on load
        };
        r.readAsDataURL(f);
    };

    const handleTool = (m) => {
        if ((m === 'MEASURE' || m === 'ANGLE' || m === 'CIRCLE' || m === 'OSTEOTOMY') && scaleFactor === 0) {
            alert("⚠️ Please Calibrate First!"); return;
        }
        setMode(m); clicksRef.current = [];
        setToastMsg(m === 'CALIBRATE' ? "Click Start & End of Reference" : "Click Points to Define");
        setIsToastVisible(true);
    };

    const cancelTool = () => {
        setMode('IDLE'); clicksRef.current = []; setIsToastVisible(false); draw();
    };

    const finishTool = () => {
        const clicks = clicksRef.current;
        const p1 = clicks[0]; const p2 = clicks[1];

        if (mode === 'CALIBRATE') {
            const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const mm = prompt("Enter real size (mm):", "25");
            if (mm && !isNaN(mm)) {
                setScaleFactor(px / parseFloat(mm));
                setAnnotations(p => [...p, { type: 'line', p1, p2, text: `${mm}mm (Ref)`, color: '#ff4d4d' }]);
                cancelTool();
            }
        } else if (mode === 'MEASURE' || mode === 'OSTEOTOMY') {
            const px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const mm = (px / scaleFactor).toFixed(1);
            setAnnotations(p => [...p, {
                type: mode === 'OSTEOTOMY' ? 'osteotomy' : 'line',
                p1, p2, text: mode === 'OSTEOTOMY' ? `Cut: ${mm}mm` : `${mm}mm`,
                color: mode === 'OSTEOTOMY' ? '#ffaa00' : '#00ff9d'
            }]);
        } else if (mode === 'CIRCLE') {
            const r = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const mm = (r / scaleFactor).toFixed(1);
            setAnnotations(p => [...p, { type: 'circle', center: p1, edge: p2, radius: r, text: `R:${mm}mm`, color: '#00e5ff' }]);
        } else if (mode === 'ANGLE') {
            const p3 = clicks[2];
            const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }; const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
            const ang = (Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))) * 180 / Math.PI).toFixed(1);
            setAnnotations(p => [...p, { type: 'angle', p1, p2, p3, text: `${ang}°`, color: '#ffee00' }]);
        }
        clicksRef.current = []; draw();
    };

    // --- MOUSE HANDLERS ---
    const toImg = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const v = viewRef.current;
        return { x: (e.clientX - rect.left - v.offsetX) / v.scale, y: (e.clientY - rect.top - v.offsetY) / v.scale };
    };

    const onDown = (e) => {
        if (e.button === 2) { isPanningRef.current = true; startPanRef.current = { x: e.clientX, y: e.clientY }; return; }
        const pos = toImg(e);
        const imp = implantRef.current;

        // Implant Logic
        if (imp.active) {
            const pxMm = scaleFactor || 2;
            const w = imp.mmWidth * pxMm; const h = imp.mmHeight * pxMm;
            // Check if clicked near implant
            if (Math.hypot(pos.x - imp.x, pos.y - imp.y) < w / 2) {
                // Check holes
                const holeSpacing = w / (imp.holes + 0.6);
                const startX = -w / 2 + (w - (imp.holes - 1) * holeSpacing) / 2;
                // Rotate click to local
                const rad = -imp.rotation * Math.PI / 180;
                const dx = pos.x - imp.x; const dy = pos.y - imp.y;
                const lx = dx * Math.cos(rad) - dy * Math.sin(rad);

                let hitHole = -1;
                for (let i = 0; i < imp.holes; i++) {
                    if (Math.hypot(lx - (startX + i * holeSpacing), 0) < h / 3) hitHole = i;
                }

                if (hitHole !== -1) { imp.screws[hitHole] = !imp.screws[hitHole]; }
                else { imp.dragging = true; imp.dragStart = { x: pos.x - imp.x, y: pos.y - imp.y }; }
                draw(); return;
            }
        }

        // Tool Logic
        if (mode !== 'IDLE') {
            clicksRef.current.push(pos);
            const n = clicksRef.current.length;
            if ((mode !== 'ANGLE' && n === 2) || (mode === 'ANGLE' && n === 3)) finishTool();
            draw();
        }
    };

    const onMove = (e) => {
        if (isPanningRef.current) {
            viewRef.current.offsetX += e.clientX - startPanRef.current.x;
            viewRef.current.offsetY += e.clientY - startPanRef.current.y;
            startPanRef.current = { x: e.clientX, y: e.clientY };
            draw(); return;
        }
        cursorRef.current = toImg(e);
        if (implantRef.current.dragging) {
            implantRef.current.x = cursorRef.current.x - implantRef.current.dragStart.x;
            implantRef.current.y = cursorRef.current.y - implantRef.current.dragStart.y;
        }
        draw();
    };

    // --- INIT & EFFECTS ---
    useEffect(() => {
        const cvs = canvasRef.current;
        const rs = () => { cvs.width = mainAreaRef.current.clientWidth; cvs.height = mainAreaRef.current.clientHeight; draw(); };
        window.addEventListener('resize', rs); rs();

        const onWheel = (e) => { e.preventDefault(); viewRef.current.scale *= e.deltaY > 0 ? 0.9 : 1.1; draw(); };
        cvs.addEventListener('wheel', onWheel, { passive: false });

        const onKey = (e) => { if (e.key === 'Escape') cancelTool(); };
        document.addEventListener('keydown', onKey);

        return () => { window.removeEventListener('resize', rs); cvs.removeEventListener('wheel', onWheel); document.removeEventListener('keydown', onKey); };
    }, [draw]);

    // Update Implant Specs
    useEffect(() => {
        const imp = implantRef.current;
        let p = 18, h = 13.5;
        if (implantSystem === 'mini') { p = 7; h = 5; } else if (implantSystem === 'small') { p = 14; h = 10; }
        imp.holes = parseInt(implantPlate);
        imp.mmWidth = (imp.holes - 1) * p + (p * 1.6);
        imp.mmHeight = h;
        imp.rotation = parseInt(implantRotation);
        imp.active = isImplantVisible;
        if (imp.screws.length !== imp.holes) imp.screws = new Array(imp.holes).fill(false);
        draw();
    }, [implantSystem, implantPlate, implantRotation, isImplantVisible, draw]);


    return (
        <div className="ortho-container">
            {/* 1. HEADER */}
            <header className="ortho-header">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white border border-zinc-700">
                    <ArrowLeft size={20} />
                </button>
                <h1>OrthoTwin <span style={{ fontSize: '0.6em', opacity: 0.5 }}>WORKSTATION</span></h1>
                <div className="header-actions">
                    <label className="btn-secondary">📂 Load X-Ray <input type="file" hidden onChange={handleFile} /></label>
                    <button className="btn-primary" onClick={() => {
                        const a = document.createElement('a'); a.href = canvasRef.current.toDataURL(); a.download = 'Plan.png'; a.click();
                    }}>💾 Export</button>
                </div>
            </header>

            {/* 2. TOOLBAR (Left) */}
            <aside className="ortho-toolbar">
                <button className={`icon-btn ${mode === 'CALIBRATE' ? 'active' : ''}`} onClick={() => handleTool('CALIBRATE')} title="Calibrate (Requires Known Size)">📏</button>
                <button className={`icon-btn ${mode === 'MEASURE' ? 'active' : ''}`} onClick={() => handleTool('MEASURE')} title="Ruler">📐</button>
                <button className={`icon-btn ${mode === 'ANGLE' ? 'active' : ''}`} onClick={() => handleTool('ANGLE')} title="Cobb Angle">∠</button>
                <button className={`icon-btn ${mode === 'CIRCLE' ? 'active' : ''}`} onClick={() => handleTool('CIRCLE')} title="Circle (Head/Glenoid)">⭕</button>
                <button className={`icon-btn ${mode === 'OSTEOTOMY' ? 'active' : ''}`} onClick={() => handleTool('OSTEOTOMY')} title="Osteotomy Cut Line">✂️</button>
                <div style={{ height: '20px' }}></div>
                <button className="icon-btn" onClick={fitImage} title="Reset View">⤢</button>
                <button className="icon-btn" onClick={() => { setAnnotations(prev => prev.slice(0, -1)); draw(); }} title="Undo">↩</button>
                <button className="icon-btn" style={{ color: '#ff4d4d' }} onClick={() => { setAnnotations([]); draw(); }} title="Clear All">🗑</button>
            </aside>

            {/* 3. MAIN CANVAS */}
            <main className="main-area" ref={mainAreaRef}>
                <canvas ref={canvasRef}
                    onMouseDown={onDown}
                    onMouseMove={onMove}
                    onMouseUp={() => implantRef.current.dragging = false}
                    onContextMenu={e => e.preventDefault()}
                />
                {mode !== 'IDLE' && (
                    <button className="floating-stop-btn" onClick={cancelTool}>
                        <span>🚫 STOP TOOL (ESC)</span>
                    </button>
                )}
                <div className="instruction-toast" style={{ opacity: isToastVisible ? 1 : 0 }}>{toastMsg}</div>
            </main>

            {/* 4. PROPERTIES (Right) */}
            <aside className="ortho-sidebar-right">

                <div className="panel-section">
                    <div className="section-title">Image Adjustments</div>
                    <div className="slider-group">
                        <span>Brightness: {filters.brightness}%</span>
                        <input type="range" min="50" max="150" value={filters.brightness} onChange={e => setFilters({ ...filters, brightness: e.target.value })} />
                    </div>
                    <div className="slider-group" style={{ flexDirection: 'row' }}>
                        <button className={`btn-secondary ${filters.invert ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setFilters({ ...filters, invert: !filters.invert })}>Invert</button>
                        <button className={`btn-secondary ${filters.contrast ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setFilters({ ...filters, contrast: !filters.contrast })}>Contrast</button>
                    </div>
                </div>

                <div className="panel-section">
                    <div className="section-title">Digital Templating</div>
                    <button className={`btn-secondary ${isImplantVisible ? 'btn-primary' : ''}`} onClick={() => setIsImplantVisible(!isImplantVisible)}>
                        {isImplantVisible ? 'Hide Template' : 'Show Implant Template'}
                    </button>

                    {isImplantVisible && (
                        <>
                            <select className="ortho-select" value={implantSystem} onChange={e => setImplantSystem(e.target.value)}>
                                <option value="large">Large Frag (Femur/Tibia)</option>
                                <option value="small">Small Frag (Forearm)</option>
                                <option value="mini">Mini Frag (Hand/Foot)</option>
                            </select>
                            <select className="ortho-select" value={implantPlate} onChange={e => setImplantPlate(e.target.value)}>
                                <option value="4">4-Hole Plate</option>
                                <option value="6">6-Hole Plate</option>
                                <option value="8">8-Hole Plate</option>
                                <option value="10">10-Hole Plate</option>
                            </select>
                            <div className="slider-group">
                                <span style={{ color: '#fff' }}>Rotation: {implantRotation}°</span>
                                <input type="range" min="0" max="360" value={implantRotation} onChange={e => setImplantRotation(e.target.value)} />
                            </div>
                        </>
                    )}
                </div>

                <div className="panel-section" style={{ marginTop: 'auto' }}>
                    <div className="section-title">History / Layers</div>
                    {annotations.length === 0 && <div style={{ color: '#666', fontSize: '0.8rem' }}>No measurements yet.</div>}
                    {annotations.map((ann, i) => (
                        <div key={i} className="history-item">
                            <span>{i + 1}. {ann.type.toUpperCase()}</span>
                            <span className="val">{ann.text}</span>
                        </div>
                    ))}
                </div>

            </aside>
        </div>
    );
};

export default OrthoTwin;
