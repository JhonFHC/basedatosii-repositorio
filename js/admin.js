// admin.js - Panel de Administración CONECTADO A SUPABASE

// ========== DATOS EN MEMORIA (Caché local) ==========
let appData = {
  unidades: [],
  semanas: [],
  archivos: [],
  actividad: []
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Panel de Administración iniciado');
  
  if (sessionStorage.getItem('isAdminLogged') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const adminName = sessionStorage.getItem('adminName') || 'Administrador';
  const welcomeElement = document.getElementById('welcomeName');
  if (welcomeElement) welcomeElement.textContent = adminName;
  
  await esperarSupabase();
  await cargarDatosDesdeSupabase();
  cargarSelectUnidades();
  
  console.log('✅ Panel listo');
});

// ========== ESPERAR A SUPABASE ==========
async function esperarSupabase(maxIntentos = 15) {
  for (let i = 0; i < maxIntentos; i++) {
    if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
      console.log('✅ Supabase listo');
      return true;
    }
    console.log(`⏳ Esperando Supabase... (${i + 1}/${maxIntentos})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('❌ Supabase no está disponible');
}

// ========== CARGAR DATOS DESDE SUPABASE ==========
async function cargarDatosDesdeSupabase() {
  try {
    console.log('📡 Cargando datos desde Supabase...');
    
    const { data: unidades, error: errorU } = await supabase
      .from('unidades')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorU) throw errorU;
    appData.unidades = unidades || [];
    console.log('✅ Unidades cargadas:', appData.unidades.length);
    
    const { data: semanas, error: errorS } = await supabase
      .from('semanas')
      .select('*')
      .order('numero', { ascending: true });
    
    if (errorS) throw errorS;
    appData.semanas = semanas || [];
    console.log('✅ Semanas cargadas:', appData.semanas.length);
    
    const { data: archivos, error: errorA } = await supabase
      .from('archivos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (errorA) throw errorA;
    appData.archivos = archivos || [];
    console.log('✅ Archivos cargados:', appData.archivos.length);
    
    const { data: actividad, error: errorAct } = await supabase
      .from('actividad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!errorAct) {
      appData.actividad = actividad || [];
    }
    
    cargarDashboard();
    cargarTablaSemanas();
    cargarTablaUnidades();
    cargarTablaArchivos();
    cargarSelectSemanas();
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    showToast('Error al cargar datos: ' + error.message, 'error');
  }
}

// ========== NAVEGACIÓN ==========
function switchPage(pageName) {
  console.log('🔄 Cambiando a:', pageName);
  
  const pageMap = {
    'dashboard': 'dashboard',
    'unidades': 'unidades',
    'semanas': 'editarSemana',
    'archivos': 'archivos',
    'crearSemana': 'crearSemana',
    'editarSemana': 'editarSemana',
    'configuracion': 'configuracion'
  };
  
  const targetPageName = pageMap[pageName] || pageName;
  
  document.querySelectorAll('.admin-page').forEach(page => {
    page.classList.remove('active');
  });
  
  const targetPage = document.getElementById(`page-${targetPageName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    console.warn('⚠️ Página no encontrada:', `page-${targetPageName}`);
  }
  
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });
  
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const span = link.querySelector('span');
    if (span) {
      const text = span.textContent.toLowerCase();
      if ((pageName === 'semanas' && text.includes('editar')) ||
          (pageName === 'crearSemana' && text.includes('crear')) ||
          (pageName === 'unidades' && text.includes('unidades')) ||
          (pageName === 'archivos' && text.includes('archivos')) ||
          (pageName === 'configuracion' && text.includes('config')) ||
          text.includes(pageName.toLowerCase())) {
        link.classList.add('active');
      }
    }
  });
  
  document.querySelectorAll('.admin-nav a').forEach(link => {
    link.classList.remove('active');
    const text = link.textContent.toLowerCase();
    if (text.includes(pageName.toLowerCase()) || 
        (pageName === 'semanas' && text.includes('semanas')) ||
        (pageName === 'crearSemana' && text.includes('dashboard')) ||
        (pageName === 'editarSemana' && text.includes('semanas'))) {
      link.classList.add('active');
    }
  });
  
  if (pageName === 'dashboard') {
    const navDashboard = document.getElementById('navDashboard');
    if (navDashboard) navDashboard.classList.add('active');
  }
}

// ========== DASHBOARD ==========
function cargarDashboard() {
  const dashUnidades = document.getElementById('dashUnidades');
  const dashSemanas = document.getElementById('dashSemanas');
  const dashPDFs = document.getElementById('dashPDFs');
  
  if (dashUnidades) dashUnidades.textContent = appData.unidades.length;
  if (dashSemanas) dashSemanas.textContent = appData.semanas.length;
  if (dashPDFs) dashPDFs.textContent = appData.archivos.length;
  
  const tbody = document.getElementById('actividadReciente');
  if (tbody) {
    const actividadHTML = appData.actividad.slice(0, 5).map(item => `
      <tr>
        <td>${item.accion}</td>
        <td>${item.elemento}</td>
        <td>${new Date(item.created_at).toLocaleString()}</td>
        <td><span class="badge badge-success">Completado</span></td>
      </tr>
    `).join('');
    tbody.innerHTML = actividadHTML || '<tr><td colspan="4" class="empty-state">No hay actividad</td></tr>';
  }
}

// ========== CARGAR SELECTS ==========
function cargarSelectSemanas() {
  const select = document.getElementById('fileSemana');
  if (!select) return;
  
  select.innerHTML = '<option value="">Ninguna (General)</option>' + 
    appData.semanas.map(s => `<option value="${s.id}">Semana ${s.numero}: ${s.titulo}</option>`).join('');
}

function cargarSelectUnidades() {
  const select = document.getElementById('createUnidad');
  if (!select) return;
  
  select.innerHTML = '<option value="">Seleccionar unidad...</option>' + 
    appData.unidades.map(u => `<option value="${u.id}">Unidad ${u.numero}: ${u.titulo}</option>`).join('');
}

// ========== CARGAR TABLAS ==========
function cargarTablaSemanas() {
  const tbody = document.getElementById('tablaSemanas');
  if (!tbody) return;
  
  const html = appData.semanas.map(semana => {
    const unidad = appData.unidades.find(u => u.id === semana.unidad_id);
    return `
      <tr>
        <td>${semana.id}</td>
        <td>${unidad?.titulo || 'N/A'}</td>
        <td>${semana.numero}</td>
        <td>${semana.titulo}</td>
        <td><span class="badge ${semana.estado === 'disponible' ? 'badge-success' : 'badge-warning'}">${semana.estado}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="editarSemana(${semana.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete" onclick="eliminarSemana(${semana.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="6" class="empty-state">No hay semanas</td></tr>';
}

function cargarTablaUnidades() {
  const tbody = document.getElementById('tablaUnidades');
  if (!tbody) return;
  
  const html = appData.unidades.map(unidad => {
    const semanasCount = appData.semanas.filter(s => s.unidad_id === unidad.id).length;
    return `
      <tr>
        <td>${unidad.id}</td>
        <td>${unidad.numero}</td>
        <td>${unidad.titulo}</td>
        <td>${semanasCount} semanas</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" onclick="editarUnidad(${unidad.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-icon delete" onclick="eliminarUnidad(${unidad.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html;
}

function cargarTablaArchivos() {
  const tbody = document.getElementById('tablaArchivos');
  if (!tbody) return;
  
  const html = appData.archivos.map(archivo => {
    const semana = appData.semanas.find(s => s.id === archivo.semana_id);
    const iconoTipo = archivo.tipo === 'local' ? '💾' : '🔗';
    return `
      <tr>
        <td>${iconoTipo} ${archivo.nombre}</td>
        <td><a href="${archivo.url}" target="_blank" style="color: #00ffc3;">Ver archivo</a></td>
        <td>${semana ? `Semana ${semana.numero}` : 'General'}</td>
        <td>
          <button class="btn-icon delete" onclick="eliminarArchivo(${archivo.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html || '<tr><td colspan="4" class="empty-state">No hay archivos</td></tr>';
}

// ========== CREAR / ACTUALIZAR SEMANA ==========
document.getElementById('formCrearSemana')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = this.querySelector('button[type="submit"]');
  const editingId = this.dataset.editingId;
  
  if (!submitBtn.dataset.originalText) {
    submitBtn.dataset.originalText = submitBtn.innerHTML;
  }
  
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (editingId ? 'Actualizando...' : 'Guardando...');
  submitBtn.disabled = true;
  
  try {
    const nuevaSemana = {
      unidad_id: parseInt(document.getElementById('createUnidad').value),
      numero: parseInt(document.getElementById('createNumero').value),
      titulo: document.getElementById('createTitulo').value,
      descripcion: document.getElementById('createDescripcion').value,
      contenido: document.getElementById('createContenido').value || '',
      pdf_url: document.getElementById('createPDF').value || null,
      video_url: document.getElementById('createVideo').value || null,
      estado: document.getElementById('createEstado').value
    };
    
    let result;
    if (editingId) {
      result = await supabase
        .from('semanas')
        .update(nuevaSemana)
        .eq('id', editingId)
        .select();
      
      showToast('✅ Semana actualizada correctamente', 'success');
    } else {
      result = await supabase
        .from('semanas')
        .insert([nuevaSemana])
        .select();
      
      await supabase.from('actividad').insert([{
        accion: 'Creación',
        elemento: `Semana ${nuevaSemana.numero}: ${nuevaSemana.titulo}`,
        usuario: sessionStorage.getItem('adminName') || 'Admin'
      }]);
      
      showToast('✅ Semana creada correctamente', 'success');
    }
    
    if (result.error) throw result.error;
    
    await cargarDatosDesdeSupabase();
    
    this.reset();
    
    const htmlPaste = document.getElementById('createHTMLPaste');
    if (htmlPaste) htmlPaste.value = '';
    
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Crear Semana';
    submitBtn.disabled = false;
    delete submitBtn.dataset.originalText;
    delete this.dataset.editingId;
    
    cargarSelectUnidades();
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
    
    submitBtn.innerHTML = editingId ? 
      '<i class="fas fa-save"></i> Actualizar Semana' : 
      '<i class="fas fa-save"></i> Crear Semana';
    submitBtn.disabled = false;
    delete submitBtn.dataset.originalText;
  }
});

// ========== ELIMINAR SEMANA ==========
async function eliminarSemana(id) {
  if (!confirm('¿Eliminar esta semana permanentemente?')) return;
  
  try {
    const semana = appData.semanas.find(s => s.id === id);
    
    const { error } = await supabase
      .from('semanas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await supabase.from('actividad').insert([{
      accion: 'Eliminación',
      elemento: `Semana ${semana?.numero}: ${semana?.titulo}`,
      usuario: sessionStorage.getItem('adminName') || 'Admin'
    }]);
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Semana eliminada', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR UNIDAD ==========
async function eliminarUnidad(id) {
  if (!confirm('¿Eliminar esta unidad y TODAS sus semanas?')) return;
  
  try {
    await supabase.from('semanas').delete().eq('unidad_id', id);
    
    const { error } = await supabase
      .from('unidades')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    cargarSelectUnidades();
    showToast('✅ Unidad eliminada', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== ELIMINAR ARCHIVO ==========
async function eliminarArchivo(id) {
  if (!confirm('¿Eliminar este archivo?')) return;
  
  try {
    const { error } = await supabase
      .from('archivos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    await cargarDatosDesdeSupabase();
    showToast('✅ Archivo eliminado', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== EDITAR SEMANA ==========
function editarSemana(id) {
  const semana = appData.semanas.find(s => s.id === id);
  if (!semana) {
    showToast('Semana no encontrada', 'error');
    return;
  }
  
  switchPage('crearSemana');
  
  document.getElementById('createUnidad').value = semana.unidad_id;
  document.getElementById('createNumero').value = semana.numero;
  document.getElementById('createTitulo').value = semana.titulo;
  document.getElementById('createDescripcion').value = semana.descripcion || '';
  document.getElementById('createContenido').value = semana.contenido || '';
  document.getElementById('createPDF').value = semana.pdf_url || '';
  document.getElementById('createVideo').value = semana.video_url || '';
  document.getElementById('createEstado').value = semana.estado;
  
  const htmlPaste = document.getElementById('createHTMLPaste');
  if (htmlPaste) htmlPaste.value = '';
  
  const form = document.getElementById('formCrearSemana');
  form.dataset.editingId = id;
  
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Semana';
  }
  
  showToast('✏️ Editando: ' + semana.titulo, 'success');
}

// ========== EDITAR UNIDAD ==========
function editarUnidad(id) {
  const unidad = appData.unidades.find(u => u.id === id);
  if (!unidad) {
    showToast('Unidad no encontrada', 'error');
    return;
  }
  
  document.getElementById('modalUnidadTitle').textContent = 'Editar Unidad';
  document.getElementById('unidadId').value = unidad.id;
  document.getElementById('unidadNumero').value = unidad.numero;
  document.getElementById('unidadTitulo').value = unidad.titulo;
  document.getElementById('unidadDescripcion').value = unidad.descripcion || '';
  document.getElementById('unidadIcono').value = unidad.icono || '📚';
  
  openModal('modalUnidad');
}

// ========== ABRIR MODAL NUEVA UNIDAD ==========
function abrirModalUnidad() {
  document.getElementById('modalUnidadTitle').textContent = 'Nueva Unidad';
  document.getElementById('unidadId').value = '';
  document.getElementById('formUnidad').reset();
  openModal('modalUnidad');
}

// ========== GUARDAR UNIDAD (CON LÍMITE DE 4) ==========
document.getElementById('formUnidad')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const id = document.getElementById('unidadId').value;
  
  // Si es nueva y ya hay 4 unidades, no permitir
  if (!id && appData.unidades.length >= 4) {
    showToast('⚠️ Solo se permiten 4 unidades. Edita las existentes.', 'error');
    return;
  }
  
  const unidadData = {
    numero: parseInt(document.getElementById('unidadNumero').value),
    titulo: document.getElementById('unidadTitulo').value,
    descripcion: document.getElementById('unidadDescripcion').value,
    icono: document.getElementById('unidadIcono').value || '📚'
  };
  
  try {
    let result;
    if (id) {
      result = await supabase.from('unidades').update(unidadData).eq('id', id);
      showToast('✅ Unidad actualizada', 'success');
    } else {
      result = await supabase.from('unidades').insert([unidadData]);
      showToast('✅ Unidad creada', 'success');
    }
    
    if (result.error) throw result.error;
    
    await cargarDatosDesdeSupabase();
    cargarSelectUnidades();
    closeModal('modalUnidad');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
});

// ========== GUARDAR ARCHIVO (CON SUBIDA LOCAL) ==========
async function guardarArchivo() {
  let nombre = document.getElementById('fileName')?.value;
  let url = document.getElementById('fileUrl')?.value;
  const semanaId = document.getElementById('fileSemana')?.value;
  const localFile = document.getElementById('localFile')?.files[0];
  
  let finalUrl = url;
  
  // Si hay archivo local, "simular" subida
  if (localFile) {
    finalUrl = `almacenado/${localFile.name}`;
    
    if (!nombre) {
      nombre = localFile.name;
      document.getElementById('fileName').value = localFile.name;
    }
  }
  
  if (!nombre) {
    showToast('❌ El nombre del archivo es obligatorio', 'error');
    return;
  }
  
  if (!finalUrl && !localFile) {
    showToast('❌ Debes proporcionar un enlace o subir un archivo', 'error');
    return;
  }
  
  if (!finalUrl && localFile) {
    finalUrl = `almacenado/${localFile.name}`;
  }
  
  try {
    const { error } = await supabase
      .from('archivos')
      .insert([{
        nombre: nombre,
        url: finalUrl,
        semana_id: semanaId || null,
        tipo: localFile ? 'local' : 'enlace'
      }]);
    
    if (error) throw error;
    
    await supabase.from('actividad').insert([{
      accion: 'Subida',
      elemento: `Archivo: ${nombre}`,
      usuario: sessionStorage.getItem('adminName') || 'Admin'
    }]);
    
    await cargarDatosDesdeSupabase();
    
    document.getElementById('fileName').value = '';
    document.getElementById('fileUrl').value = '';
    document.getElementById('localFile').value = '';
    
    showToast('✅ Archivo guardado correctamente', 'success');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ========== IMPORTAR DATOS ==========
function importarDatos() {
  document.getElementById('importFile')?.click();
}

document.getElementById('importFile')?.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    showToast('✅ Función en desarrollo', 'success');
    
  } catch (error) {
    showToast('❌ Error al importar: ' + error.message, 'error');
  }
  
  this.value = '';
});

// ========== MODALES ==========
function openModal(modalId) {
  document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('active');
}

// ========== TOAST ==========
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== CERRAR SESIÓN ==========
function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}

// ========== GENERAR CÓDIGO HTML ==========
function generateHTMLCode() {
  const titulo = document.getElementById('createTitulo').value;
  const numero = document.getElementById('createNumero').value;
  const descripcion = document.getElementById('createDescripcion').value;
  const contenido = document.getElementById('createContenido').value;
  const pdfUrl = document.getElementById('createPDF').value;
  const videoUrl = document.getElementById('createVideo').value;
  
  const htmlCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Semana ${numero} - ${titulo}</title>
  <link rel="stylesheet" href="../../css/style1.css">
</head>
<body class="dark-theme">
  <canvas id="particles"></canvas>
  <main class="container" style="margin-top: 100px;">
    <h1 style="color: #00ffc3;">Semana ${numero}: ${titulo}</h1>
    <div class="seccion-contenido">
      <h2>Descripción</h2>
      <p>${descripcion}</p>
    </div>
    <div class="seccion-contenido">
      <h2>Contenido</h2>
      ${contenido || '<p>En desarrollo...</p>'}
    </div>
    ${pdfUrl ? `<a href="${pdfUrl}" target="_blank">Descargar PDF</a>` : ''}
  </main>
  <script src="../../js/particles.js"></script>
</body>
</html>`;
  
  document.getElementById('generatedCode').value = htmlCode;
  openModal('modalCode');
}

// ========== COPIAR CÓDIGO ==========
function copyGeneratedCode() {
  const textarea = document.getElementById('generatedCode');
  textarea.select();
  document.execCommand('copy');
  showToast('✅ Código copiado', 'success');
}

function copyToClipboard() {
  const content = document.getElementById('previewContent')?.innerText || '';
  navigator.clipboard?.writeText(content).then(() => {
    showToast('✅ Contenido copiado', 'success');
  });
}

// ========== DESCARGAR HTML ==========
function downloadHTML() {
  const code = document.getElementById('generatedCode').value;
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `semana_${document.getElementById('createNumero').value}.html`;
  a.click();
  showToast('✅ HTML descargado', 'success');
}

// ========== EXPORTAR DATOS ==========
function exportarDatos() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'basedatosii_backup.json';
  a.click();
  showToast('✅ Datos exportados', 'success');
}

// ========== GUARDAR CONFIGURACIÓN ==========
function guardarConfiguracion() {
  const curso = document.getElementById('configCurso')?.value;
  const profesor = document.getElementById('configProfesor')?.value;
  const ciclo = document.getElementById('configCiclo')?.value;
  
  localStorage.setItem('configCurso', JSON.stringify({ curso, profesor, ciclo }));
  showToast('✅ Configuración guardada', 'success');
}

// ========== APLICAR HTML PEGADO ==========
function aplicarHTMLPegado() {
  const htmlCode = document.getElementById('createHTMLPaste').value;
  if (!htmlCode || htmlCode.trim() === '') {
    showToast('❌ Pega un código HTML primero', 'error');
    return;
  }
  
  try {
    const titleMatch = htmlCode.match(/<h1[^>]*>([^<]+)<\/h1>/) || htmlCode.match(/<title>([^<]+)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      const titulo = titleMatch[1].trim();
      document.getElementById('createTitulo').value = titulo;
      
      const semanaMatch = titulo.match(/Semana\s*(\d+)/i);
      if (semanaMatch) {
        document.getElementById('createNumero').value = parseInt(semanaMatch[1]);
      }
    }
    
    const paragraphs = htmlCode.match(/<p[^>]*>([^<]+)<\/p>/g);
    if (paragraphs) {
      for (let p of paragraphs) {
        const content = p.replace(/<[^>]+>/g, '').trim();
        if (content.length > 20) {
          document.getElementById('createDescripcion').value = content;
          break;
        }
      }
    }
    
    const pdfMatch = htmlCode.match(/href=["']([^"']*\.pdf[^"']*)["']/i) || 
                     htmlCode.match(/drive\.google\.com[^"'\s]*/i) ||
                     htmlCode.match(/href=["']([^"']*download[^"']*)["']/i);
    if (pdfMatch) {
      const pdfUrl = pdfMatch[1] || pdfMatch[0];
      document.getElementById('createPDF').value = pdfUrl.startsWith('http') ? pdfUrl : 'https://' + pdfUrl;
    }
    
    const videoMatch = htmlCode.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i) ||
                       htmlCode.match(/href=["']([^"']*(?:youtube|youtu\.be)[^"']*)["']/i);
    if (videoMatch) {
      const videoUrl = videoMatch[1] || videoMatch[0];
      document.getElementById('createVideo').value = videoUrl.startsWith('http') ? videoUrl : 'https://' + videoUrl;
    }
    
    if (htmlCode.includes('disponible') || htmlCode.includes('badge-success')) {
      document.getElementById('createEstado').value = 'disponible';
    } else if (htmlCode.includes('proximo') || htmlCode.includes('badge-warning')) {
      document.getElementById('createEstado').value = 'proximo';
    }
    
    document.getElementById('createContenido').value = htmlCode;
    
    if (typeof ClassicEditor !== 'undefined') {
      const editorElement = document.querySelector('#createContenido');
      if (editorElement && editorElement.ckeditorInstance) {
        editorElement.ckeditorInstance.setData(htmlCode);
      }
    }
    
    showToast('✅ HTML aplicado correctamente', 'success');
    
  } catch (error) {
    console.error('Error al procesar HTML:', error);
    showToast('❌ Error al procesar el HTML', 'error');
  }
}

// ========== LIMPIAR HTML PEGADO ==========
function limpiarHTMLPegado() {
  document.getElementById('createHTMLPaste').value = '';
  showToast('🧹 Campo HTML limpiado', 'success');
}

// ========== VISTA PREVIA MEJORADA ==========
function previewSemana() {
  const titulo = document.getElementById('createTitulo').value || 'Sin título';
  const numero = document.getElementById('createNumero').value || '?';
  const descripcion = document.getElementById('createDescripcion').value || 'Sin descripción';
  const contenido = document.getElementById('createContenido').value || '<p>Contenido en desarrollo...</p>';
  const pdfUrl = document.getElementById('createPDF').value;
  const videoUrl = document.getElementById('createVideo').value;
  const estado = document.getElementById('createEstado').value;
  const unidadSelect = document.getElementById('createUnidad');
  const unidad = unidadSelect?.options[unidadSelect.selectedIndex]?.text || 'Sin unidad';
  
  const estadoBadge = {
    'disponible': '<span class="badge badge-success">Disponible</span>',
    'proximo': '<span class="badge badge-warning">Próximamente</span>',
    'bloqueado': '<span class="badge badge-info">Bloqueado</span>'
  }[estado] || '';
  
  const previewHTML = `
    <div style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <span class="badge badge-info">Semana ${numero}</span>
        ${estadoBadge}
      </div>
      <h2 style="color: #00ffc3; margin-bottom: 10px;">${titulo}</h2>
      <p style="color: #94a3b8; margin-bottom: 20px;"><strong>Unidad:</strong> ${unidad}</p>
      
      <div style="background: rgba(0,255,195,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h4 style="color: #00ffc3; margin-bottom: 10px;">📝 Descripción</h4>
        <p style="color: #cbd5e1; line-height: 1.6;">${descripcion}</p>
      </div>
      
      <div style="background: #0f172a; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h4 style="color: #00ffc3; margin-bottom: 10px;">📚 Contenido</h4>
        <div style="color: white; line-height: 1.6;">${contenido}</div>
      </div>
      
      ${pdfUrl ? `
      <div style="margin-bottom: 15px;">
        <a href="${pdfUrl}" target="_blank" style="color: #00ffc3; text-decoration: none;">
          <i class="fas fa-file-pdf"></i> Ver PDF
        </a>
      </div>
      ` : ''}
      
      ${videoUrl ? `
      <div style="margin-bottom: 15px;">
        <a href="${videoUrl}" target="_blank" style="color: #00ffc3; text-decoration: none;">
          <i class="fas fa-video"></i> Ver Video
        </a>
      </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('previewContent').innerHTML = previewHTML;
  openModal('modalPreview');
}

// ========== USAR ESTE CONTENIDO PARA CREAR ==========
function usarContenidoParaCrear() {
  closeModal('modalPreview');
  showToast('✅ Contenido listo. Haz clic en "Crear Semana" para guardar', 'success');
  
  document.querySelector('#formCrearSemana .btn-success')?.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
}

console.log('✅ Admin.js (Supabase) cargado correctamente');