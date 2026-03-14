import React, { useState, useRef, useEffect } from 'react';
import { 
  Instagram, Facebook, Linkedin, MonitorPlay, 
  Download, Image as ImageIcon, LayoutTemplate, 
  Type, Upload, Sparkles, AlignCenter, AlignLeft, 
  PanelLeft, Columns, Palette, Wand2, Pointer
} from 'lucide-react';
import { toPng } from 'html-to-image';
import './index.css';

// Preloaded generic models
const NETWORKS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram size={20} />,
    formats: [
      { id: 'ig-sq', name: 'Post Cuadrado', width: 1080, height: 1080, aspect: '1:1' },
      { id: 'ig-pt', name: 'Post Retrato', width: 1080, height: 1350, aspect: '4:5' },
      { id: 'ig-st', name: 'Story/Reel', width: 1080, height: 1920, aspect: '9:16' },
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook size={20} />,
    formats: [
      { id: 'fb-ls', name: 'Horizontal', width: 1200, height: 630, aspect: '1.91:1' },
      { id: 'fb-sq', name: 'Cuadrado', width: 1080, height: 1080, aspect: '1:1' },
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin size={20} />,
    formats: [
      { id: 'li-ls', name: 'Artículo', width: 1200, height: 627, aspect: '1.91:1' },
      { id: 'li-sq', name: 'Post Cuadrado', width: 1080, height: 1080, aspect: '1:1' },
    ]
  }
];

const PRESET_THEMES = [
  { id: 'ms-solid-purple', name: 'Morado Oscuro', color1: '#3B1E54', color2: '#3B1E54', textColor: '#ffffff', accentColor: '#E1B26E' },
  { id: 'ms-solid-lavender', name: 'Lavanda Clara', color1: '#9B7EBD', color2: '#9B7EBD', textColor: '#3B1E54', accentColor: '#3B1E54' },
  { id: 'ms-solid-slate', name: 'Gris Pizarra', color1: '#64748B', color2: '#64748B', textColor: '#ffffff', accentColor: '#9B7EBD' },
  { id: 'ms-grad-emerald', name: 'Morado a Esmeralda', color1: '#3B1E54', color2: '#006052', textColor: '#ffffff', accentColor: '#E1B26E' },
  { id: 'ms-grad-gold', name: 'Morado a Dorado', color1: '#3B1E54', color2: '#E1B26E', textColor: '#ffffff', accentColor: '#9B7EBD' }
];

const MS_LOGOS = [
  { id: 'none', label: 'Sin Logo', src: '' },
  { id: 'escudo', label: 'Escudo', src: '/recursos/A_escudo.svg' },
  { id: 'ms-col-1', label: 'MS Logo 1', src: '/recursos/MS_advisory_logo_col_1.svg' },
  { id: 'ms-col-2', label: 'MS Logo 2', src: '/recursos/MS_advisory_logo_col_2.svg' }
];

const MS_BACKGROUNDS = [
  { id: 'none', label: 'Sin Fondo (Color)', src: '' },
  { id: 'fondo1', label: 'Fondo Visual 1', src: '/recursos/fondo_vacio.jpg' },
  { id: 'fondo2', label: 'Fondo Visual 2', src: '/recursos/fondo_vacio_2.jpg' }
];

const SMART_LAYOUTS = [
  { id: 'center', name: 'Centrado Elegante', icon: <AlignCenter size={24} /> },
  { id: 'modern-bottom', name: 'Moderno Inferior', icon: <AlignLeft size={24} /> },
  { id: 'corporate-top', name: 'Corporativo', icon: <PanelLeft size={24} /> },
  { id: 'editorial-split', name: 'Editorial Dividido', icon: <Columns size={24} /> }
];

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState(NETWORKS[0]);
  const [activeFormat, setActiveFormat] = useState(NETWORKS[0].formats[0]);
  
  const [content, setContent] = useState({
    title: 'Lanza Tu Próxima Gran Idea',
    description: 'Descubre cómo dominar el mercado con estrategias modernas y diseño excepcional. Únete a nuestra masterclass hoy mismo.',
    logo: MS_LOGOS[2].src,
    signature: ''
  });

  const [activeLayout, setActiveLayout] = useState('modern-bottom');
  const [activeTheme, setActiveTheme] = useState(PRESET_THEMES[0]);
  const [activeBg, setActiveBg] = useState(MS_BACKGROUNDS[0]);
  const [activeLogoId, setActiveLogoId] = useState('ms-col-1');
  
  const [logoScale, setLogoScale] = useState(15);
  const [logoColor, setLogoColor] = useState('original');
  const [signatureScale, setSignatureScale] = useState(15);
  const [signatureColor, setSignatureColor] = useState('original');
  
  const [zoom, setZoom] = useState(0.4); 

  // --- DRAG & DROP STATE ---
  // Elements store: { id, x, y, fixedLayout? } 
  // We apply layout "presets" which just overwrite X, Y coordinates, but user can manually move them later.
  const [positions, setPositions] = useState({
    logo: { x: 0, y: 0 },
    signature: { x: 0, y: 0 },
    titleGroup: { x: 0, y: 0 } // Grouping text elements for easier layout logic
  });
  
  const [dragState, setDragState] = useState(null); // 'logo' | 'titleGroup' | 'signature' | null
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Smart Guides
  const [guides, setGuides] = useState({ vX: null, hY: null }); // Coordinates of active magnetic lines

  const canvasRef = useRef(null);
  const contentRef = useRef(null);

  const [dims, setDims] = useState({ titleW: 600, titleH: 300, logoW: 200, logoH: 100, signatureW: 200, signatureH: 100 });
  const titleGroupRef = useRef(null);
  const logoRef = useRef(null);
  const signatureRef = useRef(null);

  // Measure element dimensions after render for proper boundary limiting
  useEffect(() => {
    setDims(prevDims => {
      let changed = false;
      const newDims = { ...prevDims };
      
      if (titleGroupRef.current) {
        if (newDims.titleW !== titleGroupRef.current.offsetWidth) changed = true;
        if (newDims.titleH !== titleGroupRef.current.offsetHeight) changed = true;
        newDims.titleW = titleGroupRef.current.offsetWidth;
        newDims.titleH = titleGroupRef.current.offsetHeight;
      }
      if (logoRef.current) {
        if (newDims.logoW !== logoRef.current.offsetWidth) changed = true;
        if (newDims.logoH !== logoRef.current.offsetHeight) changed = true;
        newDims.logoW = logoRef.current.offsetWidth;
        newDims.logoH = logoRef.current.offsetHeight;
      }
      if (signatureRef.current) {
        if (newDims.signatureW !== signatureRef.current.offsetWidth) changed = true;
        if (newDims.signatureH !== signatureRef.current.offsetHeight) changed = true;
        newDims.signatureW = signatureRef.current.offsetWidth;
        newDims.signatureH = signatureRef.current.offsetHeight;
      }
      
      return changed ? newDims : prevDims;
    });
  }, [content, activeFormat, activeLayout, activeTheme, logoScale, signatureScale]);

  // Calculations
  const currentWidth = activeFormat.width;
  const currentHeight = activeFormat.height;
  const baseDim = Math.min(currentWidth, currentHeight);
  // strict boundaries
  const padding = baseDim * 0.085; 
  const logoMaxWidth = currentWidth * (logoScale / 100); 
  const signatureMaxWidth = currentWidth * (signatureScale / 100);
  
  const titleSize = baseDim * 0.07;
  const descSize = baseDim * 0.035;

  // Formatting effect limits
  const safeMinX = padding;
  const safeMaxX = Math.max(padding, currentWidth - padding);
  const safeMinY = padding;
  const safeMaxY = Math.max(padding, currentHeight - padding);

  // Apply layout PRESETS automatically when ActiveLayout changes or Format changes
  useEffect(() => {
    applyLayoutPreset(activeLayout);
  }, [activeLayout, activeFormat]);

  const applyLayoutPreset = (layoutPrefix) => {
    // We estimate width dynamically but can use rough values immediately before next tick gets perfect bounds.
    let logoX = padding, logoY = padding;
    let textX = padding, textY = currentHeight - padding - dims.titleH;
    let sigX = currentWidth - padding - dims.signatureW, sigY = currentHeight - padding - dims.signatureH;

    switch(layoutPrefix) {
      case 'center':
        logoX = currentWidth / 2 - dims.logoW / 2;
        logoY = currentHeight * 0.25;
        textX = currentWidth / 2 - dims.titleW / 2;
        textY = currentHeight * 0.45;
        sigX = currentWidth / 2 - dims.signatureW / 2;
        sigY = currentHeight - padding - dims.signatureH;
        break;
      case 'modern-bottom':
        logoX = currentWidth - padding - dims.logoW;
        logoY = padding;
        textX = padding;
        textY = currentHeight - padding - dims.titleH;
        sigX = currentWidth - padding - dims.signatureW;
        sigY = padding;
        break;
      case 'corporate-top':
        logoX = padding;
        logoY = padding;
        textX = padding;
        textY = padding + dims.logoH + padding;
        sigX = currentWidth - padding - dims.signatureW;
        sigY = currentHeight - padding - dims.signatureH;
        break;
      case 'editorial-split':
        logoX = padding;
        logoY = padding;
        textX = padding;
        textY = currentHeight / 2 - dims.titleH / 2;
        sigX = currentWidth - padding - dims.signatureW;
        sigY = padding;
        break;
    }

    setPositions({
      logo: { x: logoX, y: logoY },
      signature: { x: sigX, y: sigY },
      titleGroup: { x: textX, y: textY }
    });
  };

  // ZOOM automatico
  useEffect(() => {
    if (activeFormat) {
      if (activeFormat.width > 1500) setZoom(0.3);
      else if (activeFormat.width > 900) setZoom(0.4);
      else setZoom(0.5);
    }
  }, [activeFormat]);

  const [isGenerating, setIsGenerating] = useState(false);

  // Gemini AI / Brand Voice Text Assistant
  const handleAIGenerate = async () => {
    const topic = window.prompt("🤖 Redactor AI de MS Advisory\nDescribe brevemente de qué tratará la publicación (ej: Cierre fiscal de marzo, Protección patrimonial, etc.)");
    if (!topic) return;

    setIsGenerating(true);
    try {
      // 1. Send instruction to Gemini AI (acting as MS Consultoría Integral)
      const promptText = `
        Actúa como el Social Media Manager de "MS Consultoría Integral", una Firma en Inteligencia Fiscal Empresarial.
        Tono de voz: Profesional, estratégico, preventivo y muy directo (ej: "Te leo como te lee el SAT").
        Temática principal: Protección del patrimonio, crecimiento con cimientos estables, estrategias preventivas ante el SAT y evitar riesgos fiscales.
        
        Tu tarea: Escribe el texto para una imagen de publicación de redes sobre esta idea: "${topic}"
        
        Devuelve ÚNICAMENTE un objeto JSON estrictamente válido, sin texto adicional, con este formato:
        {
          "title": "TÍTULO CORTO Y DE IMPACTO AQUÍ",
          "description": "2 a 3 líneas de descripción persuasiva o reflexiva, con el tono de MS Advisory."
        }
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      
      // Clean up markdown markers if any
      const cleanJsonStr = textResponse.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const aiContent = JSON.parse(cleanJsonStr);

      setContent({
        ...content,
        title: aiContent.title,
        description: aiContent.description
      });
      
    } catch (err) {
      console.error(err);
      alert("Hubo un error contactando a la IA. Verifica que tu LLM API Key (VITE_GEMINI_API_KEY) esté bien configurada en .env");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (contentRef.current) {
      try {
        const dataUrl = await toPng(contentRef.current, {
          quality: 1,
          pixelRatio: 2,
          width: currentWidth,
          height: currentHeight,
          style: {
            transform: 'none',
            transformOrigin: 'top left',
            width: `${currentWidth}px`,
            height: `${currentHeight}px`
          }
        });
        
        const link = document.createElement('a');
        link.download = `MS_Advisory_${activeNetwork.name}_${activeFormat.name}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to export image", err);
        alert("Hubo un error al exportar la imagen. Verifica si hay tipografías que sigan cargando.");
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setContent({...content, logo: event.target.result});
      reader.readAsDataURL(file);
    }
  };

  // Drag Handlers
  const startDrag = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate raw mouse offset inside the element properly factoring zoom
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragState(id);
    setDragOffset({ x: mouseX / zoom, y: mouseY / zoom });
  };

  const onMouseMove = (e) => {
    if (!dragState || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    let rawX = (e.clientX - canvasRect.left) / zoom - dragOffset.x;
    let rawY = (e.clientY - canvasRect.top) / zoom - dragOffset.y;

    const elW = dragState === 'logo' ? dims.logoW : dragState === 'signature' ? dims.signatureW : dims.titleW;
    const elH = dragState === 'logo' ? dims.logoH : dragState === 'signature' ? dims.signatureH : dims.titleH;

    let snapVX = null;
    let snapHY = null;
    const snapThreshold = 30; // pixels to snap

    // Center X snap
    const centerX = currentWidth / 2 - elW / 2;
    if (Math.abs(rawX - centerX) < snapThreshold) {
      rawX = centerX;
      snapVX = currentWidth / 2;
    }
    
    // Left padding snap
    if (Math.abs(rawX - padding) < snapThreshold) {
      rawX = padding;
      snapVX = padding;
    }

    // Right padding snap
    if (Math.abs(rawX - (currentWidth - padding - elW)) < snapThreshold) {
      rawX = currentWidth - padding - elW;
      snapVX = currentWidth - padding;
    }

    // Top padding snap
    if (Math.abs(rawY - padding) < snapThreshold) {
      rawY = padding;
      snapHY = padding;
    }

    // Center Y snap
    const centerY = currentHeight / 2 - elH / 2;
    if (Math.abs(rawY - centerY) < snapThreshold) {
      rawY = centerY;
      snapHY = currentHeight / 2;
    }

    // Bottom padding snap
    if (Math.abs(rawY - (currentHeight - padding - elH)) < snapThreshold) {
      rawY = currentHeight - padding - elH;
      snapHY = currentHeight - padding;
    }

    // Strict absolute boundaries enforcement
    rawX = Math.max(padding, Math.min(rawX, currentWidth - padding - elW));
    rawY = Math.max(padding, Math.min(rawY, currentHeight - padding - elH));

    setGuides({ vX: snapVX, hY: snapHY });

    setPositions({
       ...positions,
       [dragState]: { x: rawX, y: rawY }
    });
  };

  const stopDrag = () => {
    setDragState(null);
    setGuides({ vX: null, hY: null });
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-title">
          <Sparkles className="text-indigo-400" color="#6366f1" size={28} />
          <span style={{fontWeight: 800}}>PostGenius <span style={{fontSize: '12px', padding: '4px 8px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '6px', color: '#818cf8', marginLeft: '8px', verticalAlign: 'middle'}}>Smart AI</span></span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button 
            className="btn btn-outline" 
            onClick={handleAIGenerate} 
            disabled={isGenerating}
            style={{border: '1px solid rgba(255,255,255,0.3)', position: 'relative', overflow: 'hidden'}}
          >
             <Wand2 size={18} className={isGenerating ? 'spin-anim' : ''} /> 
             {isGenerating ? 'Generando MS Advisory...' : 'Redactor IA Mágico'}
          </button>
          <button className="btn btn-primary" onClick={handleExport} style={{padding: '12px 24px', fontSize: '16px'}}>
            <Download size={20} />
            Exportar Diseño
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="main-layout" onMouseMove={onMouseMove} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
        
        {/* LEFT SIDEBAR - Smart Settings */}
        <aside className="sidebar" style={{width: '340px'}}>
          <div className="sidebar-section">
            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <MonitorPlay size={18} /> 1. Plataforma & Medidas
            </h2>
            <div className="input-group" style={{marginBottom: '16px'}}>
              <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                <div style={{position: 'absolute', left: '12px', pointerEvents: 'none', display: 'flex', color: 'var(--primary)'}}>
                  {activeNetwork.icon}
                </div>
                <select 
                  className="form-control" 
                  style={{paddingLeft: '40px', fontWeight: 600, fontSize: '14px', cursor: 'pointer'}}
                  value={activeNetwork.id}
                  onChange={(e) => setActiveNetwork(NETWORKS.find(n => n.id === e.target.value))}
                >
                  {NETWORKS.map(network => (
                    <option key={network.id} value={network.id}>{network.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="animate-fade-in format-grid" style={{marginTop: 0}}>
              {activeNetwork.formats.map(format => (
                <div 
                  key={format.id}
                  className={`format-card ${activeFormat.id === format.id ? 'active' : ''}`}
                  onClick={() => setActiveFormat(format)}
                  style={{padding: '12px'}}
                >
                  <span style={{fontSize: '13px', fontWeight: 'bold'}}>{format.name}</span>
                  <span className="badge" style={{marginTop: '4px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff'}}>{format.aspect}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <Type size={18} /> 2. Textos (Arrastrables)
            </h2>
            <div className="editor-panel" style={{marginTop: 0, display: 'flex', flexDirection: 'column', gap: '16px'}}>
              
              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Título Principal</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  spellCheck="true"
                  style={{fontSize: '16px', fontWeight: 600}}
                  value={content.title} 
                  onChange={(e) => setContent({...content, title: e.target.value})}
                />
              </div>

              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Descripción Atractiva</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  spellCheck="true"
                  value={content.description} 
                  onChange={(e) => setContent({...content, description: e.target.value})}
                />
              </div>

              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Logo MS Advisory</label>
                <select 
                  className="form-control"
                  value={activeLogoId}
                  onChange={(e) => {
                    setActiveLogoId(e.target.value);
                    const lg = MS_LOGOS.find(l => l.id === e.target.value);
                    if(lg) setContent({...content, logo: lg.src});
                  }}
                >
                  {MS_LOGOS.map(lg => (
                    <option key={lg.id} value={lg.id}>{lg.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Subir Logo Extra</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <label className="btn btn-outline" style={{flex: 1, cursor: 'pointer', textAlign: 'center'}}>
                    <Upload size={16} /> Subir Logo
                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                      setActiveLogoId('none');
                      handleLogoUpload(e);
                    }} />
                  </label>
                  {content.logo && activeLogoId === 'none' && (
                    <button className="btn btn-ghost text-red-400" onClick={() => setContent({...content, logo: ''})}>Quitar</button>
                  )}
                </div>
              </div>

              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span>Tamaño del Logo ({logoScale}%)</span>
                </label>
                <input 
                  type="range" 
                  min="10" max="30" step="1"
                  value={logoScale} 
                  onChange={(e) => setLogoScale(Number(e.target.value))} 
                  style={{width: '100%', cursor: 'pointer', accentColor: 'var(--primary)'}} 
                />
              </div>

              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Color del Logo</label>
                <select 
                  className="form-control"
                  value={logoColor}
                  onChange={(e) => setLogoColor(e.target.value)}
                >
                  <option value="original">Color Original</option>
                  <option value="#ffffff">Blanco Puro</option>
                  <option value="#000000">Negro Puro</option>
                  <option value={activeTheme.accentColor}>Acento (Tema)</option>
                </select>
              </div>

              {/* NEW: Signature Section */}
              <div className="input-group" style={{marginBottom: 0, marginTop: '16px'}}>
                <label className="input-label" style={{color: 'var(--primary)'}}>Subir Firma (Opcional)</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <label className="btn btn-outline" style={{flex: 1, cursor: 'pointer', textAlign: 'center'}}>
                    <Upload size={16} /> Subir Firma
                    <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setContent({...content, signature: event.target.result});
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                  {content.signature && (
                    <button className="btn btn-ghost text-red-400" onClick={() => setContent({...content, signature: ''})}>Quitar</button>
                  )}
                </div>
              </div>

              {content.signature && (
                <>
                  <div className="input-group" style={{marginBottom: 0}}>
                    <label className="input-label" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <span>Tamaño de la Firma ({signatureScale}%)</span>
                    </label>
                    <input 
                      type="range" 
                      min="10" max="40" step="1"
                      value={signatureScale} 
                      onChange={(e) => setSignatureScale(Number(e.target.value))} 
                      style={{width: '100%', cursor: 'pointer', accentColor: 'var(--primary)'}} 
                    />
                  </div>
                  
                  <div className="input-group" style={{marginBottom: 0, marginTop: '16px'}}>
                    <label className="input-label">Color de la Firma</label>
                    <select 
                      className="form-control"
                      value={signatureColor}
                      onChange={(e) => setSignatureColor(e.target.value)}
                    >
                      <option value="original">Color Original</option>
                      <option value="#ffffff">Blanco Puro</option>
                      <option value="#000000">Negro Puro</option>
                      <option value={activeTheme.accentColor}>Acento (Tema)</option>
                    </select>
                  </div>
                </>
              )}

            </div>
          </div>
        </aside>

        {/* MIDDLE CANVAS AREA */}
        <div className="canvas-area" style={{background: '#090a0f', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 60%)'}}>
          <div className="zoom-controls" style={{background: 'rgba(25, 28, 36, 0.8)'}}>
            <button className="btn-ghost" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>-</button>
            <span style={{fontSize: '14px', fontWeight: 'bold', width: '48px', textAlign: 'center', color: '#fff'}}>{Math.round(zoom * 100)}%</span>
            <button className="btn-ghost" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</button>
          </div>

          <div style={{ width: currentWidth * zoom, height: currentHeight * zoom, position: 'relative' }}>
            <div 
              className="post-canvas-wrapper" 
              ref={canvasRef}
              style={{ 
                width: currentWidth, 
                height: currentHeight,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
              }}
            >
            {/* The actual exportable content container */}
            <div 
              className="post-canvas"
              ref={contentRef}
              style={{
                width: currentWidth,
                height: currentHeight,
                position: 'relative',
                background: activeBg.src ? `url(${activeBg.src}) center/cover no-repeat` : `linear-gradient(135deg, ${activeTheme.color1}, ${activeTheme.color2})`,
                overflow: 'hidden'
              }}
            >
              
              {/* Image Overlay Filter to Make Text Pop */}
              {activeBg.src && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(20, 15, 35, 0.55)', // Dark premium overlay
                  pointerEvents: 'none',
                  zIndex: 0
                }} />
              )}
              
              {/* Optional editorial split line visually rendered if preset needs it, though dragging makes it obsolete. 
                  We will keep the editorial background half if that theme is selected */}
              {activeLayout === 'editorial-split' && (
                 <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, 
                    width: '32%', backgroundColor: activeTheme.accentColor, opacity: 0.95
                 }} />
              )}

              {/* Magnetic Guides Rendering */}
              {guides.vX !== null && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: guides.vX, 
                  width: '2px', background: 'rgba(255, 100, 255, 0.8)', zIndex: 50, pointerEvents: 'none',
                  boxShadow: '0 0 8px rgba(255, 100, 255, 1)'
                }} />
              )}
              {guides.hY !== null && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: guides.hY, 
                  height: '2px', background: 'rgba(255, 100, 255, 0.8)', zIndex: 50, pointerEvents: 'none',
                  boxShadow: '0 0 8px rgba(255, 100, 255, 1)'
                }} />
              )}
              
              {/* Visual Padding Border Debugger during Drag */}
              {dragState && (
                <div style={{
                  position: 'absolute',
                  top: padding, left: padding,
                  right: padding, bottom: padding,
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  pointerEvents: 'none',
                  zIndex: 0
                }} />
              )}

              {/* LOGO NODE */}
              {content.logo && (
                <div
                  ref={logoRef}
                  onMouseDown={(e) => startDrag(e, 'logo')}
                  style={{
                    position: 'absolute',
                    left: positions.logo.x,
                    top: positions.logo.y,
                    cursor: dragState === 'logo' ? 'grabbing' : 'grab',
                    zIndex: 10,
                    outline: dragState === 'logo' ? '2px dashed var(--primary)' : 'none',
                    width: `${logoMaxWidth}px`
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <img 
                      src={content.logo} 
                      alt="Logo" 
                      onLoad={(e) => {
                        if (logoRef.current) {
                          setDims(prev => ({
                            ...prev,
                            logoW: logoRef.current.offsetWidth,
                            logoH: logoRef.current.offsetHeight
                          }));
                        }
                      }}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        opacity: logoColor === 'original' ? 1 : 0
                      }} 
                    />
                    {logoColor !== 'original' && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: logoColor,
                        WebkitMaskImage: `url("${content.logo}")`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url("${content.logo}")`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center'
                      }} />
                    )}
                  </div>
                </div>
              )}

              {/* SIGNATURE NODE */}
              {content.signature && (
                <div
                  ref={signatureRef}
                  onMouseDown={(e) => startDrag(e, 'signature')}
                  style={{
                    position: 'absolute',
                    left: positions.signature.x,
                    top: positions.signature.y,
                    cursor: dragState === 'signature' ? 'grabbing' : 'grab',
                    zIndex: 10,
                    outline: dragState === 'signature' ? '2px dashed var(--primary)' : 'none',
                    width: `${signatureMaxWidth}px`
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <img 
                      src={content.signature} 
                      alt="Firma" 
                      onLoad={(e) => {
                        if (signatureRef.current) {
                          setDims(prev => ({
                            ...prev,
                            signatureW: signatureRef.current.offsetWidth,
                            signatureH: signatureRef.current.offsetHeight
                          }));
                        }
                      }}
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        opacity: signatureColor === 'original' ? 1 : 0
                      }} 
                    />
                    {signatureColor !== 'original' && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: signatureColor,
                        WebkitMaskImage: `url("${content.signature}")`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url("${content.signature}")`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center'
                      }} />
                    )}
                  </div>
                </div>
              )}

              {/* TEXTS NODE */}
              <div
                  ref={titleGroupRef}
                  onMouseDown={(e) => startDrag(e, 'titleGroup')}
                  style={{
                    position: 'absolute',
                    left: positions.titleGroup.x,
                    top: positions.titleGroup.y,
                    maxWidth: '85%',
                    cursor: dragState === 'titleGroup' ? 'grabbing' : 'grab',
                    zIndex: 10,
                    outline: dragState === 'titleGroup' ? '2px dashed var(--primary)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: `${padding * 0.15}px`,
                    alignItems: activeLayout === 'center' ? 'center' : 'flex-start',
                    textAlign: activeLayout === 'center' ? 'center' : 'left'
                  }}
              >
                  <h1 style={{
                     fontFamily: 'var(--font-display)',
                     fontSize: `${titleSize}px`,
                     fontWeight: 800,
                     lineHeight: 1.1,
                     margin: 0,
                     color: activeTheme.textColor,
                     wordWrap: 'break-word',
                     whiteSpace: 'pre-wrap',
                     letterSpacing: '-0.02em',
                     pointerEvents: 'none'
                  }}>
                    {content.title}
                  </h1>
                  
                  {activeLayout === 'editorial-split' && (
                     <div style={{
                       width: '60px', height: '8px', 
                       backgroundColor: activeTheme.accentColor, 
                       borderRadius: '4px', margin: `${padding*0.1}px 0`
                     }}></div>
                  )}

                  <p style={{
                    fontFamily: 'var(--font-body)',
                     fontSize: `${descSize}px`,
                     fontWeight: 400,
                     lineHeight: 1.5,
                     margin: 0,
                     color: activeTheme.textColor,
                     opacity: 0.85,
                     wordWrap: 'break-word',
                     whiteSpace: 'pre-wrap',
                     maxWidth: '100%',
                     pointerEvents: 'none'
                  }}>
                    {content.description}
                  </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* RIGHT SIDEBAR - Aesthetics */}
        <aside className="sidebar" style={{ borderRight: 'none', borderLeft: '1px solid var(--panel-border)', width: '320px' }}>
          
          <div className="sidebar-section">
            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <LayoutTemplate size={18} /> 3. Layouts Rápidos
            </h2>
            <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px'}}>
              Selecciona un diseño base. Ahora puedes <strong>arrastrar y mover libremente</strong> todos los elementos en pantalla para afinar el resultado.
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {SMART_LAYOUTS.map(ly => (
                <div 
                  key={ly.id}
                  className={`network-card ${activeLayout === ly.id ? 'active' : ''}`}
                  style={{margin: 0, padding: '16px'}}
                  onClick={() => setActiveLayout(ly.id)}
                >
                  <div style={{color: activeLayout === ly.id ? 'var(--primary)' : 'var(--text-muted)'}}>
                    {ly.icon}
                  </div>
                  <span style={{fontWeight: '600', fontSize: '14px', marginLeft: '12px'}}>{ly.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section" style={{borderBottom: 'none'}}>
            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <ImageIcon size={18} /> 4. Fondo MS Advisory
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px'}}>
               {MS_BACKGROUNDS.map(bg => (
                <button 
                  key={bg.id}
                  className={`btn ${activeBg.id === bg.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{justifyContent: 'flex-start', padding: '10px'}}
                  onClick={() => setActiveBg(bg)}
                >
                  {bg.label}
                </button>
              ))}
              
              <label className={`btn ${activeBg.id === 'custom' ? 'btn-primary' : 'btn-outline'}`} style={{justifyContent: 'flex-start', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center'}}>
                <Upload size={16} style={{marginRight: '8px'}} /> Subir Imagen Custom
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => setActiveBg({ id: 'custom', label: 'Fondo Custom', src: event.target.result });
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>

            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <Palette size={18} /> 5. Paleta de Color
            </h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {PRESET_THEMES.map(themeOption => (
                <div 
                  key={themeOption.id}
                  onClick={() => setActiveTheme(themeOption)}
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: activeTheme.id === themeOption.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${themeOption.color1}, ${themeOption.color2})`,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
                    marginRight: '12px'
                  }}></div>
                  <span style={{fontSize: '14px', fontWeight: 500, flex: 1}}>{themeOption.name}</span>
                  {activeTheme.id === themeOption.id && <Sparkles size={16} color="var(--primary)" />}
                </div>
              ))}
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}
