// semana.js - Carga el contenido de una semana específica (VERSIÓN MEJORADA)
document.addEventListener('DOMContentLoaded', async function() {
  
  // Obtener ID de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const semanaId = urlParams.get('id') || sessionStorage.getItem('semanaActual');
  
  const container = document.getElementById('semanaContent');
  
  if (!semanaId) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
        <h3>No se especificó una semana</h3>
        <a href="unidad.html" class="btn-volver">Volver a Unidades</a>
      </div>
    `;
    return;
  }
  
  try {
    // Esperar a Supabase
    await esperarSupabase();
    
    // Cargar datos de la semana
    const { data: semana, error } = await supabase
      .from('semanas')
      .select(`
        *,
        unidades (*)
      `)
      .eq('id', semanaId)
      .single();
    
    if (error) throw error;
    
    if (!semana) {
      throw new Error('Semana no encontrada');
    }
    
    // Actualizar título del curso desde configuración
    const configCurso = JSON.parse(localStorage.getItem('configCurso') || '{}');
    const nombreCurso = configCurso.curso || 'Base de Datos II';
    document.title = `Semana ${semana.numero} - ${nombreCurso}`;
    
    // Renderizar contenido base (SIN descripción duplicada)
    container.innerHTML = `
      <div class="semana-header">
        <span class="badge-semana">
          <i class="fas fa-calendar-alt"></i> Semana ${semana.numero}
        </span>
        <h1 style="color: #00ffc3; margin-bottom: 10px;">${semana.titulo}</h1>
        <div class="semana-meta">
          <span><i class="fas fa-calendar"></i> ${formatearFecha(semana.created_at)}</span>
          <span><i class="fas fa-tag"></i> ${semana.estado}</span>
          <span><i class="fas fa-layer-group"></i> Unidad ${semana.unidades?.numero}: ${semana.unidades?.titulo}</span>
        </div>
      </div>
      
      <div id="contenido-dinamico" class="contenido-html">
        ${semana.contenido || '<p style="color: #cbd5e1;">El contenido está en desarrollo...</p>'}
      </div>
      
      <!-- Contenedor para recursos (se llenará dinámicamente) -->
      <div id="recursos-container"></div>
      
      <div style="text-align: center; margin-top: 40px;">
        <a href="unidad.html" class="btn-volver">
          <i class="fas fa-arrow-left"></i> Volver a Unidades
        </a>
      </div>
    `;
    
    // INYECTAR ESTILOS
    inyectarEstilosSemanas();
    
    // EXTRAER Y EJECUTAR SCRIPTS DEL CONTENIDO
    extraerYEjecutarScripts();
    
    // CARGAR RECURSOS DINÁMICAMENTE (PDF, Video, Archivos asociados)
    const recursosHTML = await renderRecursos(semana);
    if (recursosHTML) {
      document.getElementById('recursos-container').innerHTML = recursosHTML;
    }
    
  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem;"></i>
        <h3>Error al cargar el contenido</h3>
        <p>${error.message}</p>
        <a href="unidad.html" class="btn-volver">Volver a Unidades</a>
      </div>
    `;
  }
});

// ========== FUNCIÓN CLAVE: EXTRAER Y EJECUTAR SCRIPTS ==========
function extraerYEjecutarScripts() {
  const contenidoDinamico = document.getElementById('contenido-dinamico');
  if (!contenidoDinamico) return;
  
  const scripts = contenidoDinamico.querySelectorAll('script');
  
  scripts.forEach(oldScript => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
  
  console.log('✅ Scripts del contenido ejecutados');
}

// Esperar a que Supabase esté listo
async function esperarSupabase(maxIntentos = 10) {
  for (let i = 0; i < maxIntentos; i++) {
    if (typeof supabase !== 'undefined' && supabase) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Supabase no está disponible');
}

// Formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Renderizar recursos (PDF, Video, Archivos subidos) - VERSIÓN MEJORADA
async function renderRecursos(semana) {
  const recursos = [];
  
  // 1. PDF desde URL (campo pdf_url)
  if (semana.pdf_url) {
    recursos.push(`
      <div class="recurso-card">
        <i class="fas fa-file-pdf"></i>
        <h3>Material PDF</h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin: 5px 0;">Clase ${semana.numero}</p>
        <div style="display: flex; gap: 8px; justify-content: center; font-size: 0.9rem;">
          <a href="visor.html?file=${encodeURIComponent(semana.pdf_url)}&name=${encodeURIComponent('Material PDF - Semana ' + semana.numero)}" 
             style="color: #00ffc3; text-decoration: none; font-weight: bold;">
            <i class="fas fa-eye"></i> Ver
          </a>
          <span style="color: #334155;">|</span>
          <a href="${semana.pdf_url}" target="_blank" style="color: #00ffc3; text-decoration: none; font-weight: bold;">
            <i class="fas fa-download"></i> Descargar
          </a>
        </div>
      </div>
    `);
  }
  
  // 2. Video desde URL (campo video_url)
  if (semana.video_url) {
    recursos.push(`
      <div class="recurso-card">
        <i class="fas fa-video"></i>
        <h3>Video de Clase</h3>
        <p style="color: #94a3b8; font-size: 0.8rem; margin: 5px 0;">Grabación Semana ${semana.numero}</p>
        <div style="display: flex; gap: 8px; justify-content: center; font-size: 0.9rem;">
          <a href="visor.html?file=${encodeURIComponent(semana.video_url)}&name=${encodeURIComponent('Video Semana ' + semana.numero)}" 
             style="color: #00ffc3; text-decoration: none; font-weight: bold;">
            <i class="fas fa-eye"></i> Ver
          </a>
          <span style="color: #334155;">|</span>
          <a href="${semana.video_url}" target="_blank" style="color: #00ffc3; text-decoration: none; font-weight: bold;">
            <i class="fas fa-external-link-alt"></i> Abrir
          </a>
        </div>
      </div>
    `);
  }
  
  // 3. CARGAR ARCHIVOS SUBIDOS DESDE SUPABASE ASOCIADOS A ESTA SEMANA
  try {
    const { data: archivosSemana, error } = await supabase
      .from('archivos')
      .select('*')
      .eq('semana_id', semana.id)
      .order('created_at', { ascending: false });
    
    if (!error && archivosSemana && archivosSemana.length > 0) {
      archivosSemana.forEach(archivo => {
        let icono = 'fa-file';
        let tipoArchivo = 'Archivo';
        
        // Detectar tipo por extensión
        const nombreLower = archivo.nombre?.toLowerCase() || '';
        const urlLower = archivo.url?.toLowerCase() || '';
        
        if (nombreLower.includes('.pdf') || urlLower.includes('.pdf')) {
          icono = 'fa-file-pdf';
          tipoArchivo = 'PDF';
        } else if (nombreLower.includes('.doc') || urlLower.includes('.doc')) {
          icono = 'fa-file-word';
          tipoArchivo = 'Word';
        } else if (nombreLower.includes('.xls') || nombreLower.includes('.xlsx') || urlLower.includes('.xls')) {
          icono = 'fa-file-excel';
          tipoArchivo = 'Excel';
        } else if (nombreLower.includes('.ppt') || urlLower.includes('.ppt')) {
          icono = 'fa-file-powerpoint';
          tipoArchivo = 'PowerPoint';
        } else if (nombreLower.includes('.jpg') || nombreLower.includes('.png') || nombreLower.includes('.gif') || nombreLower.includes('.jpeg')) {
          icono = 'fa-file-image';
          tipoArchivo = 'Imagen';
        } else if (nombreLower.includes('.zip') || nombreLower.includes('.rar')) {
          icono = 'fa-file-archive';
          tipoArchivo = 'Comprimido';
        } else if (nombreLower.includes('.txt')) {
          icono = 'fa-file-alt';
          tipoArchivo = 'Texto';
        }
        
        // Icono de tipo (local o enlace)
        const tipoIcono = archivo.tipo === 'local' ? ' 💾' : ' 🔗';
        
        recursos.push(`
          <div class="recurso-card">
            <i class="fas ${icono}"></i>
            <h3>${archivo.nombre}</h3>
            <p style="color: #94a3b8; font-size: 0.8rem; margin: 5px 0;">${tipoArchivo}${tipoIcono}</p>
            <div style="display: flex; gap: 8px; justify-content: center; font-size: 0.9rem;">
              <a href="visor.html?file=${encodeURIComponent(archivo.url)}&name=${encodeURIComponent(archivo.nombre)}" 
                 style="color: #00ffc3; text-decoration: none; font-weight: bold;">
                <i class="fas fa-eye"></i> Ver
              </a>
              <span style="color: #334155;">|</span>
              <a href="${archivo.url}" target="_blank" style="color: #00ffc3; text-decoration: none; font-weight: bold;">
                <i class="fas fa-download"></i> Descargar
              </a>
            </div>
          </div>
        `);
      });
    }
  } catch (e) {
    console.error('Error cargando archivos de la semana:', e);
  }
  
  // SI NO HAY RECURSOS, NO MOSTRAR LA SECCIÓN
  if (recursos.length === 0) return '';
  
  // SI HAY RECURSOS, MOSTRAR LA SECCIÓN COMPLETA
  return `
    <div class="contenido-seccion">
      <h2><i class="fas fa-paperclip"></i> Recursos y Materiales</h2>
      <p style="color: #94a3b8; margin-bottom: 20px;">Material complementario para esta semana</p>
      <div class="recursos-grid">
        ${recursos.join('')}
      </div>
    </div>
  `;
}

// Inyectar estilos necesarios para las semanas (VERSIÓN COMPLETA MANTENIENDO DISEÑO ORIGINAL)
function inyectarEstilosSemanas() {
  if (document.getElementById('estilos-semanas')) return;
  
  const style = document.createElement('style');
  style.id = 'estilos-semanas';
  style.textContent = `
    .badge-semana {
      display: inline-block;
      background: linear-gradient(135deg, #00ffc3, #00cfa3);
      color: #0f172a;
      padding: 8px 20px;
      border-radius: 30px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .semana-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin: 15px 0;
      color: #94a3b8;
    }
    
    .semana-meta span {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .semana-meta i {
      color: #00ffc3;
    }
    
    .contenido-seccion {
      background: rgba(30, 41, 59, 0.7);
      padding: 30px;
      border-radius: 15px;
      margin: 30px 0;
      border: 1px solid #334155;
    }
    
    .contenido-seccion h2 {
      color: #00ffc3;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .contenido-html {
      color: #cbd5e1;
      line-height: 1.8;
    }
    
    .contenido-html h2, .contenido-html h3 {
      color: #00ffc3;
      margin: 25px 0 15px;
    }
    
    .contenido-html pre {
      background: #0f172a;
      padding: 20px;
      border-radius: 10px;
      overflow-x: auto;
    }
    
    .contenido-html code {
      color: #00ffc3;
    }
    
    .btn-volver {
      display: inline-block;
      background: rgba(0, 255, 195, 0.1);
      color: #00ffc3;
      padding: 12px 30px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: bold;
      border: 1px solid #00ffc3;
      transition: all 0.3s ease;
    }
    
    .btn-volver:hover {
      background: #00ffc3;
      color: #0f172a;
      transform: translateY(-3px);
    }
    
    .error-message {
      text-align: center;
      padding: 60px 20px;
      color: #ff6b6b;
    }
    
    .error-message h3 {
      margin: 20px 0;
    }
    
    .recursos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .recurso-card {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      transition: all 0.3s ease;
      border: 1px solid #334155;
    }
    
    .recurso-card:hover {
      transform: translateY(-5px);
      border-color: #00ffc3;
      box-shadow: 0 10px 25px rgba(0, 255, 195, 0.2);
    }
    
    /* ========== ICONOS DE RECURSOS MÁS PEQUEÑOS ========== */
    .recurso-card i {
      font-size: 1.8rem !important;
      color: #00ffc3;
      margin-bottom: 10px;
    }
    
    .recurso-card a {
      font-size: 0.85rem !important;
    }
    
    .recurso-card div a {
      font-size: 0.8rem !important;
    }
    /* ========== FIN ICONOS MÁS PEQUEÑOS ========== */
    
    .recurso-card h3 {
      color: white;
      margin-bottom: 10px;
      font-size: 1rem;
      word-break: break-word;
    }
    
    .recurso-card a {
      color: #00ffc3;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.2s ease;
    }
    
    .recurso-card a:hover {
      color: #00cfa3;
      text-decoration: underline;
    }
    
    /* Estilos para diagramas y elementos interactivos */
    .header-actividad {
      background: linear-gradient(135deg, rgba(0, 255, 195, 0.1), rgba(0, 207, 163, 0.05));
      padding: 25px;
      border-radius: 15px;
      border-left: 5px solid #00ffc3;
      margin: 30px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin: 25px 0;
    }
    
    .info-card {
      background: rgba(30, 41, 59, 0.9);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #334155;
      text-align: center;
      transition: all 0.3s ease;
    }
    
    .info-card:hover {
      transform: translateY(-5px);
      border-color: #00ffc3;
      box-shadow: 0 10px 25px rgba(0, 255, 195, 0.2);
    }
    
    .info-card i {
      font-size: 2.5rem;
      color: #00ffc3;
      margin-bottom: 15px;
    }
    
    .info-card h4 {
      color: white;
      margin-bottom: 10px;
    }
    
    .info-card p {
      color: #94a3b8;
      font-size: 0.9rem;
    }
    
    .arquitecturas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 25px;
      margin: 30px 0;
    }
    
    .arquitectura-card {
      background: rgba(30, 41, 59, 0.9);
      border-radius: 15px;
      padding: 25px;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .arquitectura-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 5px;
      height: 100%;
      background: #00ffc3;
    }
    
    .arquitectura-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 30px rgba(0, 255, 195, 0.2);
      border-color: #00ffc3;
    }
    
    .arquitectura-icon {
      font-size: 3rem;
      color: #00ffc3;
      margin-bottom: 15px;
    }
    
    .arquitectura-card h3 {
      color: #00ffc3;
      margin-bottom: 15px;
      font-size: 1.4rem;
    }
    
    .arquitectura-card h4 {
      color: white;
      margin: 15px 0 10px;
    }
    
    .arquitectura-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .arquitectura-card li {
      color: #cbd5e1;
      padding: 5px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .arquitectura-card li i {
      color: #00ffc3;
      font-size: 0.9rem;
    }
    
    .tabla-comparativa {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: rgba(30, 41, 59, 0.9);
      border-radius: 15px;
      overflow: hidden;
    }
    
    .tabla-comparativa thead {
      background: linear-gradient(135deg, #00ffc3, #00cfa3);
    }
    
    .tabla-comparativa th {
      padding: 15px;
      text-align: left;
      color: #0f172a;
      font-weight: bold;
    }
    
    .tabla-comparativa td {
      padding: 12px 15px;
      color: #cbd5e1;
      border-bottom: 1px solid #334155;
    }
    
    .rubrica-table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(30, 41, 59, 0.9);
      border-radius: 15px;
      overflow: hidden;
      min-width: 800px;
    }
    
    .rubrica-table th {
      background: #1e293b;
      color: #00ffc3;
      padding: 15px;
      text-align: center;
      border: 1px solid #334155;
    }
    
    .rubrica-table td {
      padding: 12px;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    
    .recomendacion-box {
      background: linear-gradient(135deg, rgba(0, 255, 195, 0.15), rgba(0, 207, 163, 0.05));
      padding: 25px;
      border-radius: 15px;
      border: 2px solid #00ffc3;
      margin: 30px 0;
    }
    
    .recomendacion-box h3 {
      color: #00ffc3;
      margin-bottom: 15px;
    }
    
    .recomendacion-box p, .recomendacion-box ul {
      color: #cbd5e1;
      line-height: 1.8;
    }
    
    .diagrama-container {
      background: rgba(15, 23, 42, 0.8);
      padding: 30px;
      border-radius: 15px;
      margin: 20px 0;
      text-align: center;
    }
    
    .diagrama {
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
      padding: 20px;
    }
    
    .diagrama-item {
      text-align: center;
      padding: 20px;
      background: rgba(0, 255, 195, 0.1);
      border-radius: 12px;
      min-width: 140px;
      border: 2px dashed #00ffc3;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .diagrama-item:hover {
      background: rgba(0, 255, 195, 0.2);
      transform: scale(1.05);
    }
    
    .diagrama-item i {
      font-size: 2.5rem;
      color: #00ffc3;
      margin-bottom: 10px;
    }
    
    .diagrama-item h4 {
      color: #00ffc3;
      margin-bottom: 5px;
    }
    
    .diagrama-item p, .diagrama-item small {
      color: #94a3b8;
    }
    
    .diagrama-flecha {
      font-size: 2rem;
      color: #00ffc3;
    }
    
    .entregables-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    
    .entregables-list li {
      padding: 12px;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #334155;
    }
    
    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #00ffc3;
      border-radius: 4px;
      display: inline-block;
      margin-right: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .checkbox-custom.checked {
      background: #00ffc3;
      position: relative;
    }
    
    .checkbox-custom.checked::after {
      content: '✓';
      color: #0f172a;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 14px;
    }
    
    #modalDiagrama {
      transition: all 0.3s ease;
    }
    
    .slide-arquitectura {
      animation: fadeIn 0.4s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .dot {
      transition: all 0.3s ease;
    }
    
    .dot:hover {
      background: #00ffc3 !important;
      transform: scale(1.3);
    }
  `;
  document.head.appendChild(style);
}