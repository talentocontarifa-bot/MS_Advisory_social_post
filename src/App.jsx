import React, { useState, useRef, useEffect } from 'react';
import { 
  Instagram, Facebook, Twitter, Linkedin, MonitorPlay, 
  Download, Image as ImageIcon, LayoutTemplate, 
  Type, Upload, Sparkles, AlignCenter, AlignLeft, 
  PanelLeft, Columns, Smartphone, Palette
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
      { id: 'ig-sq', name: 'Square Post', width: 1080, height: 1080, aspect: '1:1' },
      { id: 'ig-pt', name: 'Portrait Post', width: 1080, height: 1350, aspect: '4:5' },
      { id: 'ig-st', name: 'Story/Reel', width: 1080, height: 1920, aspect: '9:16' },
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook size={20} />,
    formats: [
      { id: 'fb-ls', name: 'Landscape', width: 1200, height: 630, aspect: '1.91:1' },
      { id: 'fb-sq', name: 'Square', width: 1080, height: 1080, aspect: '1:1' },
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin size={20} />,
    formats: [
      { id: 'li-ls', name: 'Article Image', width: 1200, height: 627, aspect: '1.91:1' },
      { id: 'li-sq', name: 'Square Post', width: 1080, height: 1080, aspect: '1:1' },
    ]
  }
];

const PRESET_THEMES = [
  { id: 'ms-dark-purple', name: 'Morado MS', color1: '#2b1540', color2: '#3a205a', textColor: '#ffffff', accentColor: '#d2baf3' },
  { id: 'ms-navy', name: 'Navy MS', color1: '#1e2533', color2: '#2b3547', textColor: '#ffffff', accentColor: '#8f7bb0' },
  { id: 'ms-light-lavender', name: 'Lavanda Claro', color1: '#e8def7', color2: '#cdb1ee', textColor: '#2b1540', accentColor: '#8f7bb0' },
  { id: 'ms-denim', name: 'Azul MS', color1: '#54667a', color2: '#6b7f94', textColor: '#ffffff', accentColor: '#d2baf3' },
  { id: 'ms-white', name: 'Blanco Limpio', color1: '#ffffff', color2: '#f0f0f5', textColor: '#1e2533', accentColor: '#2b1540' }
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
  
  // Smart Content constraints
  const [content, setContent] = useState({
    title: 'Lanza Tu Próxima Gran Idea',
    description: 'Descubre cómo dominar el mercado con estrategias modernas y diseño excepcional. Únete a nuestra masterclass hoy mismo.',
    logo: MS_LOGOS[2].src // base64 or path
  });

  const [activeLayout, setActiveLayout] = useState('modern-bottom');
  const [activeTheme, setActiveTheme] = useState(PRESET_THEMES[0]);
  const [activeBg, setActiveBg] = useState(MS_BACKGROUNDS[0]);
  const [activeLogoId, setActiveLogoId] = useState('ms-col-1');
  
  const [zoom, setZoom] = useState(0.4); 

  const canvasRef = useRef(null);
  const contentRef = useRef(null);

  // Auto-adapt format when network changes
  useEffect(() => {
    setActiveFormat(activeNetwork.formats[0]);
  }, [activeNetwork]);
  
  // Auto-fit zoom
  useEffect(() => {
    if (activeFormat) {
      if (activeFormat.width > 2000) setZoom(0.3);
      else if (activeFormat.width > 1200) setZoom(0.35);
      else if (activeFormat.width > 800) setZoom(0.45);
      else setZoom(0.6);
    }
  }, [activeFormat]);

  const currentWidth = activeFormat.width;
  const currentHeight = activeFormat.height;

  // SMART CALCULATIONS (A prueba de tontos)
  const baseDim = Math.min(currentWidth, currentHeight);
  const padding = baseDim * 0.085; // safe margin
  const logoMaxWidth = currentWidth * 0.28; // Max width rule
  
  // Font sizes auto-escalonados preventively smaller
  const titleSize = baseDim * 0.07;
  const descSize = baseDim * 0.035;

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
        link.download = `postGenius-${activeNetwork.name}-${activeFormat.name}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to export image", err);
        alert("Hubo un error al exportar la imagen.");
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

  // SMART RENDERER
  const renderCanvas = () => {
    const commonTitle = {
      fontFamily: 'var(--font-display)',
      fontSize: `${titleSize}px`,
      fontWeight: 800,
      lineHeight: 1.1,
      margin: 0,
      color: activeTheme.textColor,
      wordWrap: 'break-word',
      letterSpacing: '-0.02em',
      textWrap: 'balance'
    };
    
    const commonDesc = {
      fontFamily: 'var(--font-body)',
      fontSize: `${descSize}px`,
      fontWeight: 400,
      lineHeight: 1.5,
      margin: 0,
      color: activeTheme.textColor,
      opacity: 0.85,
      wordWrap: 'break-word',
      textWrap: 'pretty'
    };

    const logoStyle = {
      maxWidth: `${logoMaxWidth}px`,
      maxHeight: `${baseDim * 0.15}px`,
      objectFit: 'contain'
    };

    if (activeLayout === 'center') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: `${padding * 0.4}px`,
          overflow: 'hidden'
        }}>
          {content.logo && <img src={content.logo} style={{...logoStyle, flexShrink: 0}} alt="Logo" />}
          <div style={{display: 'flex', flexDirection: 'column', gap: `${padding * 0.15}px`, alignItems: 'center'}}>
            <h1 style={commonTitle}>{content.title}</h1>
            <p style={{...commonDesc, maxWidth: '85%'}}>{content.description}</p>
          </div>
        </div>
      );
    } 
    else if (activeLayout === 'modern-bottom') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', flexShrink: 0 }}>
            {content.logo && <img src={content.logo} style={{...logoStyle}} alt="Logo" />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${padding * 0.25}px`, maxWidth: '90%', justifyContent: 'flex-end', flex: 1, paddingBottom: `${padding * 0.2}px` }}>
            <h1 style={{...commonTitle, textAlign: 'left'}}>{content.title}</h1>
            <p style={{...commonDesc, textAlign: 'left', maxWidth: '95%'}}>{content.description}</p>
          </div>
        </div>
      );
    } 
    else if (activeLayout === 'corporate-top') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          padding: `${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          justifyContent: 'flex-start'
        }}>
          {content.logo && <div style={{flexShrink: 0, marginBottom: `${padding * 0.6}px`}}><img src={content.logo} style={{...logoStyle, alignSelf: 'flex-start'}} alt="Logo" /></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${padding * 0.25}px`, maxWidth: '90%' }}>
            <h1 style={{...commonTitle, textAlign: 'left'}}>{content.title}</h1>
            <p style={{...commonDesc, textAlign: 'left', maxWidth: '95%'}}>{content.description}</p>
          </div>
        </div>
      );
    } 
    else if (activeLayout === 'editorial-split') {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: '1',
            padding: `${padding}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}>
             {content.logo && <img src={content.logo} style={{...logoStyle, alignSelf: 'flex-start', marginBottom: 'auto', flexShrink: 0}} alt="Logo" />}
             <div style={{marginBottom: 'auto', display: 'flex', flexDirection: 'column', gap: `${padding * 0.15}px`, minHeight: '50%', justifyContent: 'center'}}>
               <h1 style={{...commonTitle, textAlign: 'left', color: activeTheme.textColor}}>{content.title}</h1>
               <div style={{width: '60px', height: '8px', backgroundColor: activeTheme.accentColor, borderRadius: '4px', margin: `${padding*0.1}px 0`}}></div>
               <p style={{...commonDesc, textAlign: 'left', maxWidth: '95%'}}>{content.description}</p>
             </div>
          </div>
          <div style={{
            width: '32%',
            backgroundColor: activeTheme.accentColor,
            opacity: 0.95,
            flexShrink: 0
          }}></div>
        </div>
      );
    }
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
          <button className="btn btn-primary" onClick={handleExport} style={{padding: '12px 24px', fontSize: '16px'}}>
            <Download size={20} />
            Exportar Diseño
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="main-layout">
        
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
              <Type size={18} /> 2. Contenido Inteligente
            </h2>
            <div className="editor-panel" style={{marginTop: 0, display: 'flex', flexDirection: 'column', gap: '16px'}}>
              
              <div className="input-group" style={{marginBottom: 0}}>
                <label className="input-label">Título Principal</label>
                <textarea 
                  className="form-control" 
                  rows={2}
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

          <div 
            className="post-canvas-wrapper" 
            ref={canvasRef}
            style={{ 
              width: currentWidth, 
              height: currentHeight,
              transform: `scale(${zoom})`,
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
                background: activeBg.src ? `url(${activeBg.src}) center/cover no-repeat` : `linear-gradient(135deg, ${activeTheme.color1}, ${activeTheme.color2})`,
              }}
            >
              {renderCanvas()}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - Aesthetics */}
        <aside className="sidebar" style={{ borderRight: 'none', borderLeft: '1px solid var(--panel-border)', width: '320px' }}>
          
          <div className="sidebar-section">
            <h2 className="sidebar-title" style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
              <LayoutTemplate size={18} /> 3. Diseño & Layout
            </h2>
            <p style={{fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px'}}>
              El contenido se auto-jerarquiza y respeta los márgenes óptimos de seguridad.
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
