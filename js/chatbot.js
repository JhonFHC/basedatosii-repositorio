// =============================================
// CHATBOT BDito v7.1 - NIVEL DIOS
// Inteligencia real con contexto, intenciones, memoria y reporte
// =============================================

class ChatBotBD {
  constructor() {
    this.chatAbierto = false;
    this.primeraVez = true;
    this.esperandoRespuesta = false;
    this.modoPreguntaActivo = false;
    
    this.core = new ChatBotCore();
    this.data = new ChatBotData();
    
    this.datosCurso = { unidades: [], semanas: [] };
    this.supabaseReady = false;
    
    this.historial = [];
    this.variantesUsadas = {};
    
    this.respuestasEspeciales = {
      'saludo': [
        '¡Hola! 👋 Soy <strong>BDito</strong>, tu asistente de <strong>Base de Datos II</strong>. ¿En qué puedo ayudarte hoy?',
        '¡Buenas! 🚀 Soy BDito. Pregúntame sobre SQL, PL/pgSQL, NoSQL, normalización... ¡lo que necesites!',
        '¡Hey! 😊 Soy tu asistente de BD II. Explora las unidades o pregúntame cualquier duda técnica.'
      ],
      'despedida': [
        '¡Hasta pronto! 👋 Sigue aprendiendo y practicando. Vuelve cuando necesites.',
        '¡Nos vemos! 💚 Que tengas un excelente día. ¡Éxitos en tu curso!',
        '¡Chau! ✨ Recuerda: la práctica hace al maestro en bases de datos.'
      ],
      'ayuda': [
        '💚 ¡Tranquilo! Estoy aquí para ayudarte. Dime qué tema específico te está costando y lo vemos paso a paso.'
      ]
    };
    
    this.init();
  }

  async init() {
    console.log('🤖 BDito v7.1 NIVEL DIOS iniciando...');
    await this.data.cargar();
    await this.esperarSupabase();
    if (this.supabaseReady) {
      await this.cargarDatosCurso();
    }
    console.log('✅ BDito v7.1 listo -', 
      this.datosCurso.unidades.length, 'unidades,',
      Object.keys(this.data.conocimiento || {}).length, 'temas en conocimiento'
    );
  }

  async esperarSupabase() {
    for (let i = 0; i < 15; i++) {
      if (window.supabase?.from) { this.supabaseReady = true; return; }
      if (typeof supabase !== 'undefined' && supabase?.from) { 
        window.supabase = supabase; 
        this.supabaseReady = true; 
        return; 
      }
      await new Promise(r => setTimeout(r, 500));
    }
    console.warn('⚠️ Supabase no disponible - modo offline');
  }

  async cargarDatosCurso() {
    try {
      const client = window.supabase || supabase;
      const { data: u } = await client.from('unidades').select('*').order('numero');
      if (u) this.datosCurso.unidades = u;
      const { data: s } = await client.from('semanas').select('*').order('numero');
      if (s) this.datosCurso.semanas = s;
    } catch (e) {
      console.warn('Error cargando datos del curso');
    }
  }

  abrirCerrar() {
    this.chatAbierto = !this.chatAbierto;
    const v = document.getElementById('chatbot-ventana');
    const b = document.getElementById('chatbot-boton');
    if (this.chatAbierto) {
      v?.classList.add('visible');
      b?.classList.add('activo');
      if (b) b.innerHTML = '<i class="fas fa-times"></i>';
      if (this.primeraVez) {
        this.primeraVez = false;
        setTimeout(() => this.mostrarInicio(), 500);
      }
    } else {
      v?.classList.remove('visible');
      b?.classList.remove('activo');
      if (b) b.innerHTML = '<i class="fas fa-robot"></i>';
    }
  }

  addMsgBot(texto) {
    const body = document.getElementById('chatbot-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'msg-bot';
    div.innerHTML = `<div class="avatar-mini"><i class="fas fa-robot"></i></div><div class="bubble">${texto}</div>`;
    body.appendChild(div);
    this.historial.push({ tipo: 'bot', texto });
    this.core.agregarAMemoria('bot', texto);
    this.scrollBottom();
  }
  
  addMsgUser(texto) {
    const body = document.getElementById('chatbot-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'msg-user';
    div.innerHTML = `<div class="bubble">${texto}</div>`;
    body.appendChild(div);
    this.historial.push({ tipo: 'user', texto });
    this.core.agregarAMemoria('user', texto);
    this.scrollBottom();
  }
  
  addOpciones(opciones) {
    const body = document.getElementById('chatbot-body');
    if (!body) return;
    const container = document.createElement('div');
    container.className = 'opciones-container';
    opciones.forEach(op => {
      const btn = document.createElement('button');
      btn.className = `opcion-btn ${op.back ? 'back-btn' : ''}`;
      btn.innerHTML = `<i class="fas ${op.icono}"></i> ${op.texto}`;
      btn.onclick = op.accion;
      container.appendChild(btn);
    });
    body.appendChild(container);
    this.scrollBottom();
  }
  
  showTyping() {
    const body = document.getElementById('chatbot-body');
    if (!body) return null;
    const div = document.createElement('div');
    div.className = 'msg-bot typing-msg';
    div.innerHTML = `<div class="avatar-mini"><i class="fas fa-robot"></i></div><div class="bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    body.appendChild(div);
    this.scrollBottom();
    return div;
  }
  
  removeTyping(el) { if (el) el.remove(); }
  
  scrollBottom() {
    setTimeout(() => {
      const body = document.getElementById('chatbot-body');
      if (body) body.scrollTop = body.scrollHeight;
    }, 100);
  }
  
  clearChat() {
    const body = document.getElementById('chatbot-body');
    if (body) body.innerHTML = '';
  }

  obtenerFraseTransicion() {
    const frases = ['✨ Buena pregunta', '🎯 Interesante', '💡 Claro', '📌 Importante', '🔍 Veamos', '⚡ Excelente'];
    return frases[Math.floor(Math.random() * frases.length)];
  }

  generarVariante(respuesta) {
    const indice = (this.variantesUsadas[respuesta] || 0) % 4;
    this.variantesUsadas[respuesta] = indice + 1;
    const variantes = [
      (r) => r,
      (r) => `<strong>${this.obtenerFraseTransicion()}:</strong><br>${r}`,
      (r) => `<div style="border-left:3px solid #00ffc3;padding-left:10px;">${r}</div>`,
      (r) => `${r}<br><br><em style="color:#64748b;font-size:0.85em;">¿Necesitas más detalles?</em>`
    ];
    return variantes[indice](respuesta);
  }

  mostrarInicio() {
    this.clearChat();
    this.modoPreguntaActivo = false;
    this.esperandoRespuesta = false;
    const hora = new Date().getHours();
    let saludo = '¡Buenas noches! 🌙';
    if (hora < 12) saludo = '¡Buenos días! ☀️';
    else if (hora < 18) saludo = '¡Buenas tardes! 🌤️';
    const offlineTxt = !this.supabaseReady ? '<br><small style="color:#f59e0b;">⚠️ Modo offline</small>' : '';
    this.addMsgBot(`${saludo} Soy <strong>BDito</strong>, tu asistente inteligente de <strong>Base de Datos II</strong>.${offlineTxt}<br><br>¿Qué deseas hacer?`);
    this.addOpciones([
      { texto: '📚 Ver Unidades', icono: 'fa-folder-open', accion: () => this.mostrarUnidades() },
      { texto: '📅 Ver Semanas', icono: 'fa-calendar-week', accion: () => this.mostrarSemanasTodas() },
      { texto: '💡 Preguntar sobre BD', icono: 'fa-lightbulb', accion: () => this.modoPregunta() },
      { texto: '📖 Ir a Unidades', icono: 'fa-external-link-alt', accion: () => window.location.href = 'unidad.html' }
    ]);
    if (!this.supabaseReady) {
      this.addOpciones([{ texto: '🔄 Recargar', icono: 'fa-redo-alt', accion: () => location.reload() }]);
    }
  }

  mostrarUnidades() {
    this.clearChat();
    if (this.datosCurso.unidades.length === 0) {
      this.addMsgBot('📡 No hay unidades disponibles aún.');
      this.addOpciones([{ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarInicio(), back: true }]);
      return;
    }
    this.addMsgBot(`📚 <strong>Unidades (${this.datosCurso.unidades.length})</strong>`);
    const ops = this.datosCurso.unidades.map(u => ({
      texto: `📘 Unidad ${u.numero}: ${u.titulo}`,
      icono: 'fa-book',
      accion: () => this.mostrarSemanasDeUnidad(u)
    }));
    ops.push({ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarInicio(), back: true });
    this.addOpciones(ops);
  }

  mostrarSemanasDeUnidad(u) {
    this.clearChat();
    const ss = this.datosCurso.semanas.filter(s => s.unidad_id === u.id);
    this.addMsgBot(`📖 <strong>${u.titulo}</strong> - ${ss.length} semanas`);
    if (ss.length === 0) {
      this.addMsgBot('📭 Sin semanas aún.');
      this.addOpciones([{ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarUnidades(), back: true }]);
      return;
    }
    const ops = ss.map(s => ({
      texto: `📅 Semana ${s.numero}: ${s.titulo}`,
      icono: 'fa-calendar-alt',
      accion: () => { sessionStorage.setItem('semanaActual', s.id); window.location.href = `semana.html?id=${s.id}`; }
    }));
    ops.push({ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarUnidades(), back: true });
    this.addOpciones(ops);
  }

  mostrarSemanasTodas() {
    this.clearChat();
    if (this.datosCurso.semanas.length === 0) {
      this.addMsgBot('⚠️ No hay semanas.');
      this.addOpciones([{ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarInicio(), back: true }]);
      return;
    }
    this.addMsgBot(`📅 <strong>Semanas (${this.datosCurso.semanas.length})</strong>`);
    const ops = this.datosCurso.semanas.map(s => {
      const u = this.datosCurso.unidades.find(x => x.id === s.unidad_id);
      return {
        texto: `S${s.numero}: ${s.titulo} (U${u?.numero || '?'})`,
        icono: 'fa-calendar-alt',
        accion: () => { sessionStorage.setItem('semanaActual', s.id); window.location.href = `semana.html?id=${s.id}`; }
      };
    });
    ops.push({ texto: '⬅ Volver', icono: 'fa-arrow-left', accion: () => this.mostrarInicio(), back: true });
    this.addOpciones(ops);
  }

  modoPregunta() {
    this.clearChat();
    this.modoPreguntaActivo = true;
    this.esperandoRespuesta = true;
    this.addMsgBot('💡 <strong>Modo Consulta Inteligente</strong><br><br>Pregúntame cualquier cosa sobre bases de datos. Entiendo contexto, así que puedes hacer preguntas de seguimiento.<br><br><em>Ejemplos:</em><br>• "¿Qué es una CTE?"<br>• "Dame un ejemplo" (recordaré el tema)<br>• "Compáralo con subconsultas"<br><br><em>Escribe tu pregunta ⬇</em>');
    this.addOpciones([{ texto: '⬅ Volver al menú', icono: 'fa-arrow-left', accion: () => this.mostrarInicio(), back: true }]);
  }

  enviarMensaje() {
    const input = document.getElementById('chatbot-input');
    if (!input) return;
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    this.addMsgUser(texto);
    const typing = this.showTyping();
    setTimeout(() => {
      this.removeTyping(typing);
      this.procesarMensaje(texto);
    }, 600 + Math.random() * 800);
  }

    // ========== PROCESAR MENSAJE v7.3 (PRIORIDAD POR PALABRA EXACTA) ==========
    procesarMensaje(texto) {
    const q = texto.toLowerCase().trim();
    
    if (this.detectarNavegacion(q)) return;
    
    const intencion = this.core.detectarIntencion(texto);
    console.log('🎯 Intención:', intencion, '| Texto:', texto.substring(0, 50));
    
    const nivel = this.core.detectarNivel(texto);
    
    // Manejar intenciones especiales
    if (this.respuestasEspeciales[intencion] && intencion !== 'definicion' && intencion !== 'ejemplo' && intencion !== 'comparacion' && intencion !== 'codigo') {
        const tieneTerminoTecnico = this.tieneTerminoTecnico(texto);
        if (!tieneTerminoTecnico) {
        const respuestas = this.respuestasEspeciales[intencion];
        const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];
        this.addMsgBot(respuesta);
        this.core.actualizarContexto(null, intencion, nivel);
        this.mostrarOpcionesContextuales();
        return;
        }
    }
    
    let temaInferido = this.core.inferirTemaPorContexto(texto);
    const textoPreprocesado = this.preprocesarTexto(q);
    console.log('🔍 Texto preprocesado:', textoPreprocesado);
    
    let respuesta = null;
    let temaEncontrado = null;
    
    // ⭐⭐⭐ NUEVO SISTEMA DE PRIORIDAD ⭐⭐⭐
    // 1. Búsqueda normal con texto preprocesado
    let candidatos = this.data.buscarPorSimilitud(textoPreprocesado, this.core);
    
    // 2. Búsqueda con texto original (sin preprocesar)
    const candidatosOriginal = this.data.buscarPorSimilitud(q, this.core);
    
    // 3. ⭐ Búsqueda por PALABRAS EXACTAS (más peso)
    const palabrasSignificativas = this.extraerPalabrasSignificativas(q);
    let candidatosExactos = [];
    for (const palabra of palabrasSignificativas) {
        const results = this.data.buscarPorSimilitud(palabra, this.core);
        candidatosExactos.push(...results);
    }
    
    // 4. ⭐ Dar MÁS PESO a candidatos que contienen palabras exactas
    const todosCandidatos = [...candidatos, ...candidatosOriginal];
    for (const c of candidatosExactos) {
        todosCandidatos.push(c); // Peso extra por coincidencia exacta
        todosCandidatos.push(c); // Doble peso extra
    }
    
    // 5. Contar frecuencia y ordenar
    const frecuenciaCandidatos = new Map();
    for (const c of todosCandidatos) {
        frecuenciaCandidatos.set(c, (frecuenciaCandidatos.get(c) || 0) + 1);
    }
    
    // ⭐ NUEVO: Verificar si el candidato CONTIENE la palabra exacta buscada
    const palabraPrincipal = palabrasSignificativas[0] || '';
    for (const [clave, freq] of frecuenciaCandidatos) {
        if (clave.toLowerCase().includes(palabraPrincipal.toLowerCase())) {
        frecuenciaCandidatos.set(clave, freq + 3); // Bonus por contener la palabra exacta
        }
    }
    
    // Ordenar: más frecuente primero, clave más corta (específica) primero
    const candidatosOrdenados = [...frecuenciaCandidatos.entries()]
        .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].length - b[0].length;
        })
        .map(([clave]) => clave);
    
    console.log('📋 Candidatos ordenados (top 5):', candidatosOrdenados.slice(0, 5).map(c => `${c} (${frecuenciaCandidatos.get(c)})`));
    
    // Priorizar tema inferido por contexto
    if (temaInferido) {
        const idx = candidatosOrdenados.indexOf(temaInferido);
        if (idx > 0) { candidatosOrdenados.splice(idx, 1); candidatosOrdenados.unshift(temaInferido); }
    }
    
    // Buscar respuesta
    for (const clave of candidatosOrdenados.slice(0, 10)) {
        const info = this.data.obtenerTema(clave);
        if (info) {
        const respIntencion = this.data.obtenerPorIntencion(info, intencion);
        if (respIntencion) {
            const relevancia = this.verificarRelevancia(textoPreprocesado, clave);
            console.log('📊 Evaluando:', clave, '| Relevancia:', relevancia.toFixed(2), '| Frecuencia:', frecuenciaCandidatos.get(clave));
            if (relevancia >= 0.08) {
            respuesta = this.data.generarConPlantilla(info, intencion, nivel);
            temaEncontrado = clave;
            break;
            }
        }
        }
    }
    
    // Fallback a definicion
    if (!respuesta && candidatosOrdenados.length > 0) {
        for (const clave of candidatosOrdenados.slice(0, 5)) {
        const info = this.data.obtenerTema(clave);
        if (info) {
            const relevancia = this.verificarRelevancia(textoPreprocesado, clave);
            if (relevancia >= 0.08) {
            respuesta = this.data.generarConPlantilla(info, 'definicion', nivel);
            temaEncontrado = clave;
            break;
            }
        }
        }
    }
    
    // Mostrar respuesta o fallback
    if (respuesta && temaEncontrado) {
        const respuestaVariada = this.generarVariante(respuesta);
        this.addMsgBot(respuestaVariada);
        this.core.actualizarContexto(temaEncontrado, intencion, nivel);
        this.sugerirTemaRelacionado(temaEncontrado);
    } else {
        this.core.registrarNoResuelta(texto, temaInferido);
        const fallback = this.core.generarRespuestaFallback(
        this.extraerTemaPrincipal(texto) || texto.substring(0, 50), intencion
        );
        this.addMsgBot(fallback);
        this.mostrarBotonReportar(texto);
    }
    
    this.mostrarOpcionesContextuales();
}

  // ========== MÉTODOS AUXILIARES ==========
  tieneTerminoTecnico(texto) {
    const terminosTecnicos = [
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'oracle',
      'base de datos', 'tabla', 'consulta', 'índice', 'trigger',
      'plsql', 'pl/pgsql', 'normalizacion', 'transaccion', 'acid',
      'pgvector', 'vector', 'embedding', 'ia', 'inteligencia artificial',
      'select', 'insert', 'update', 'delete', 'join', 'where',
      'ddl', 'dml', 'dcl', 'tcl', 'cte', 'window function',
      'arquitectura', 'centralizada', 'distribuida', 'cliente servidor',
      'particion', 'replicacion', 'backup', 'pg_dump',
      'json', 'jsonb', 'xml', 'rest api', 'supabase',
      'vista', 'view', 'cursor', 'funcion', 'procedimiento',
      'seguridad', 'permisos', 'grant', 'revoke', 'rls',
      'explain', 'optimizacion', 'rendimiento',
      'nosql', 'documento', 'coleccion', 'bson',
      'modelo entidad relacion', 'modelo relacional', 'diagrama',
      'clave primaria', 'primary key', 'foreign key', 'constraint',
      'indice', 'btree', 'hash', 'gin', 'gist',
      'commit', 'rollback', 'savepoint', 'transaccion',
      'dato', 'datos', 'informacion', 'conocimiento'
    ];
    const q = texto.toLowerCase();
    return terminosTecnicos.some(term => q.includes(term));
  }

  extraerPalabrasSignificativas(texto) {
    const relleno = new Set([
      'que', 'qué', 'es', 'un', 'una', 'el', 'la', 'los', 'las',
      'por', 'para', 'con', 'sin', 'como', 'cómo', 'me', 'te', 'se',
      'lo', 'le', 'dame', 'quiero', 'necesito', 'puedes', 'podrías',
      'ayuda', 'explica', 'explícame', 'significa', 'significado',
      'concepto', 'ejemplo', 'comparar', 'compara', 'diferencia',
      'cual', 'cuál', 'mejor', 'dime', 'saber', 'háblame', 'hablame',
      'enséñame', 'enseñame', 'muéstrame', 'muestrame', 'a', 'de', 'en', 'al', 'del'
    ]);
    const palabras = texto.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!"']/g, ' ').split(/\s+/).filter(p => p.length > 1 && !relleno.has(p));
    const frases = [];
    for (let i = 0; i < palabras.length; i++) {
      frases.push(palabras[i]);
      if (i < palabras.length - 1) frases.push(palabras[i] + ' ' + palabras[i + 1]);
      if (i < palabras.length - 2) frases.push(palabras[i] + ' ' + palabras[i + 1] + ' ' + palabras[i + 2]);
    }
    return [...new Set(frases)];
  }

  preprocesarTexto(texto) {
    let procesado = texto.toLowerCase();
    const expansiones = {
      'bd': 'base de datos', 'bbdd': 'base de datos', 'db': 'base de datos',
      'pk': 'clave primaria primary key', 'fk': 'clave foránea foreign key',
      'sgbd': 'sistema gestor base datos', 'dbms': 'sistema gestor base datos',
      'ddl': 'data definition language', 'dml': 'data manipulation language',
      'cte': 'common table expression', 'rls': 'row level security',
      'mer': 'modelo entidad relación', 'fn': 'forma normal',
      '1fn': 'primera forma normal', '2fn': 'segunda forma normal', '3fn': 'tercera forma normal',
      'pl': 'plpgsql pl/sql', 'acid': 'atomicidad consistencia aislamiento durabilidad',
      'json': 'jsonb documento', 'api': 'rest api',
      'nosql': 'no sql no relacional', 'mysql': 'mysql base datos relacional',
      'postgres': 'postgresql', 'mongo': 'mongodb',
      'mvcc': 'multiversion concurrencia', 'wal': 'write ahead log',
      'orm': 'object relational mapping', 'bi': 'business intelligence',
      'dw': 'data warehouse', 'etl': 'extract transform load'
    };
    const palabras = procesado.split(/\s+/);
    const expandidas = palabras.map(p => expansiones[p] || p);
    procesado = expandidas.join(' ');
    const relleno = ['que', 'qué', 'es', 'un', 'una', 'el', 'la', 'los', 'las', 'por', 'para', 'con', 'sin', 'como', 'cómo', 'me', 'te', 'se', 'lo', 'le'];
    procesado = procesado.split(/\s+/).filter(p => !relleno.includes(p) || p.length > 3).join(' ');
    return procesado;
  }

  extraerTemaPrincipal(texto) {
    const palabras = texto.toLowerCase().split(/\s+/);
    const relleno = ['que', 'qué', 'es', 'un', 'una', 'el', 'la', 'los', 'las', 'por', 'para', 'con', 'sin', 'como', 'cómo', 'me', 'te', 'se', 'lo', 'le', 'dame', 'quiero', 'necesito', 'puedes', 'podrías', 'ayuda', 'explica', 'explícame', 'definicion', 'definición', 'significa', 'significado', 'concepto', 'ejemplo', 'comparar', 'compara', 'vs', 'versus', 'diferencia', 'cual', 'cuál', 'mejor'];
    const palabrasClave = palabras.filter(p => !relleno.includes(p) && p.length > 2).slice(0, 4);
    return palabrasClave.join(' ');
  }

  verificarRelevancia(textoPregunta, temaEncontrado) {
    const palabrasPregunta = this.core.tokenizar(textoPregunta);
    const palabrasTema = this.core.tokenizar(temaEncontrado);
    let coincidencias = 0;
    for (const pp of palabrasPregunta) {
      for (const pt of palabrasTema) {
        if (pp === pt || pt.includes(pp) || pp.includes(pt)) {
          coincidencias++;
          break;
        }
      }
    }
    const puntuacion = palabrasPregunta.length > 0 ? coincidencias / palabrasPregunta.length : 0;
    console.log('📊 Relevancia:', puntuacion.toFixed(2), '| Pregunta:', palabrasPregunta, '| Tema:', palabrasTema);
    return puntuacion;
  }

  detectarNavegacion(texto) {
    const q = texto.toLowerCase();
    const patronesNavegacion = [
      /(?:ll[eé]vame|ir|navegar?|mostrar?|abrir?|ver)\s+(?:a\s+)?(?:la\s+)?unidad\s+(\d+)/i,
      /^unidad\s+(\d+)$/i,
      /^semana\s+(\d+)$/i,
      /(?:unidad\s+(\d+))\s*(?:semana\s+(\d+))/i,
      /(?:ver|mostrar?|abrir?)\s+(?:la\s+)?semana\s+(\d+)/i,
      /semana\s+(\d+)\s+(?:de|del?)\s+(?:la\s+)?unidad\s+(\d+)/i
    ];
    for (const patron of patronesNavegacion) {
      const match = q.match(patron);
      if (match) return this.procesarNavegacion(match, texto);
    }
    if ((q.includes('unidad') || q.includes('semana')) && 
        (q.includes('llev') || q.includes('ir') || q.includes('ver') || q.includes('mostrar') || q.includes('abrir') || q.includes('navegar'))) {
      const numeros = q.match(/\d+/g);
      if (numeros) {
        const matchSimulado = [q];
        if (numeros.length >= 2) {
          matchSimulado.push(numeros[0], numeros[1]);
        } else {
          if (q.includes('unidad')) matchSimulado.push(numeros[0], null);
          else matchSimulado.push(null, numeros[0]);
        }
        return this.procesarNavegacion(matchSimulado, texto);
      }
    }
    return false;
  }

  procesarNavegacion(match, textoOriginal) {
    const q = textoOriginal.toLowerCase();
    let unidadNumero = null;
    let semanaNumero = null;
    const numeros = match.slice(1).filter(n => n !== undefined && n !== null);
    
    if (match[0].includes('unidad') && match[0].includes('semana')) {
      if (numeros.length >= 2) { unidadNumero = parseInt(numeros[0]); semanaNumero = parseInt(numeros[1]); }
    } else if (q.includes('unidad') && q.includes('semana')) {
      if (numeros.length >= 2) { unidadNumero = parseInt(numeros[0]); semanaNumero = parseInt(numeros[1]); }
    } else if (q.includes('semana') && q.includes('de') && q.includes('unidad')) {
      if (numeros.length >= 2) { semanaNumero = parseInt(numeros[0]); unidadNumero = parseInt(numeros[1]); }
    } else if (q.includes('unidad')) {
      unidadNumero = numeros[0] ? parseInt(numeros[0]) : null;
    } else if (q.includes('semana')) {
      semanaNumero = numeros[0] ? parseInt(numeros[0]) : null;
    }
    
    if (this.datosCurso.unidades.length === 0) {
      this.addMsgBot('📡 No hay datos del curso disponibles.');
      this.addOpciones([
        { texto: '🔄 Recargar', icono: 'fa-redo-alt', accion: () => location.reload() },
        { texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true }
      ]);
      return true;
    }
    
    let unidadEncontrada = null;
    if (unidadNumero) unidadEncontrada = this.datosCurso.unidades.find(u => u.numero === unidadNumero);
    
    let semanasFiltradas = [];
    if (unidadEncontrada) semanasFiltradas = this.datosCurso.semanas.filter(s => s.unidad_id === unidadEncontrada.id);
    else if (semanaNumero) semanasFiltradas = this.datosCurso.semanas.filter(s => s.numero === semanaNumero);
    semanasFiltradas.sort((a, b) => a.numero - b.numero);
    
    if (semanaNumero && unidadEncontrada) {
      const semanaExacta = semanasFiltradas.find(s => s.numero === semanaNumero);
      if (semanaExacta) { this.mostrarNavegacionSemana(unidadEncontrada, semanaExacta); return true; }
    }
    if (unidadEncontrada && !semanaNumero) { this.mostrarNavegacionUnidad(unidadEncontrada, semanasFiltradas); return true; }
    
    this.addMsgBot(`🔍 No encontré la ${unidadNumero ? 'unidad ' + unidadNumero : ''}${unidadNumero && semanaNumero ? ' y ' : ''}${semanaNumero ? 'semana ' + semanaNumero : ''}.`);
    this.addMsgBot('Estas son las unidades disponibles:');
    const ops = this.datosCurso.unidades.map(u => ({
      texto: `📘 Unidad ${u.numero}: ${u.titulo}`,
      icono: 'fa-book',
      accion: () => { const ss = this.datosCurso.semanas.filter(s => s.unidad_id === u.id); this.clearChat(); this.mostrarNavegacionUnidad(u, ss); }
    }));
    ops.push({ texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true });
    this.addOpciones(ops);
    return true;
  }

  mostrarNavegacionUnidad(unidad, semanas) {
    this.clearChat();
    this.addMsgBot(`<div style="text-align:center;"><span style="font-size:2rem;">${unidad.icono || '📚'}</span><h3 style="color:#00ffc3;margin:10px 0;">Unidad ${unidad.numero}: ${unidad.titulo}</h3><p style="color:#94a3b8;">${unidad.descripcion || ''}</p></div>`);
    this.addMsgBot(`📅 <strong>Semanas de la Unidad ${unidad.numero}:</strong>`);
    if (semanas.length === 0) {
      this.addMsgBot('📭 Esta unidad no tiene semanas aún.');
    } else {
      const ops = semanas.map(s => ({
        texto: `📅 Semana ${s.numero}: ${s.titulo} ${s.estado === 'disponible' ? '✅' : '⏳'}`,
        icono: s.estado === 'disponible' ? 'fa-check-circle' : 'fa-clock',
        accion: () => { sessionStorage.setItem('semanaActual', s.id); window.open(`semana.html?id=${s.id}`, '_blank'); }
      }));
      this.addOpciones(ops);
    }
    this.addOpciones([
      { texto: '📚 Ver todas las unidades', icono: 'fa-layer-group', accion: () => this.mostrarUnidades() },
      { texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true }
    ]);
  }

  mostrarNavegacionSemana(unidad, semana) {
    this.clearChat();
    this.addMsgBot(`<div style="text-align:center;"><span style="font-size:2rem;">📅</span><h3 style="color:#00ffc3;margin:10px 0;">Unidad ${unidad.numero}: ${unidad.titulo}</h3><p style="color:#94a3b8;">${unidad.descripcion || ''}</p></div>`);
    this.addMsgBot(`<div style="text-align:center;margin:15px 0;"><div style="background: linear-gradient(135deg, rgba(0,255,195,0.15), rgba(0,207,163,0.05));border: 2px solid #00ffc3;border-radius: 15px;padding: 20px;box-shadow: 0 0 20px rgba(0,255,195,0.3);animation: highlightPulse 2s infinite;"><span style="display:block;font-size:0.9rem;color:#00ffc3;margin-bottom:8px;">📍 HAS SOLICITADO</span><span style="display:block;font-size:1.5rem;color:#00ffc3;font-weight:bold;">Semana ${semana.numero}</span><span style="display:block;font-size:1.2rem;color:white;margin:10px 0;">${semana.titulo}</span><span style="display:inline-block;background:${semana.estado === 'disponible' ? '#10b981' : '#f59e0b'};color:white;padding:4px 15px;border-radius:15px;font-size:0.8rem;">${semana.estado === 'disponible' ? '✅ Disponible' : '⏳ Próximamente'}</span></div></div>`);
    if (!document.getElementById('highlight-style')) {
      const style = document.createElement('style');
      style.id = 'highlight-style';
      style.textContent = `@keyframes highlightPulse { 0%, 100% { box-shadow: 0 0 20px rgba(0,255,195,0.3); } 50% { box-shadow: 0 0 35px rgba(0,255,195,0.6); } }`;
      document.head.appendChild(style);
    }
    this.addOpciones([
      { texto: `🚀 IR A SEMANA ${semana.numero}`, icono: 'fa-arrow-right', accion: () => { sessionStorage.setItem('semanaActual', semana.id); window.open(`semana.html?id=${semana.id}`, '_blank'); } },
      { texto: '📅 Ver todas las semanas', icono: 'fa-list', accion: () => this.mostrarNavegacionUnidad(unidad, this.datosCurso.semanas.filter(s => s.unidad_id === unidad.id)) },
      { texto: '📚 Ver unidades', icono: 'fa-layer-group', accion: () => this.mostrarUnidades() },
      { texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true }
    ]);
  }

  sugerirTemaRelacionado(tema) {
    const sugerencias = this.core.sugerirSiguienteTema(tema, this.data.conocimiento);
    if (sugerencias.length > 0) {
      const infoSugerido = this.data.obtenerTema(sugerencias[0]);
      if (infoSugerido) {
        const nombreSugerido = infoSugerido.titulo || sugerencias[0].replace(/\|/g, ' / ');
        this.addOpciones([{
          texto: `🔗 También te puede interesar: ${nombreSugerido}`,
          icono: 'fa-link',
          accion: () => {
            const input = document.getElementById('chatbot-input');
            if (input) { input.value = `¿Qué es ${nombreSugerido.split('/')[0].trim()}?`; this.enviarMensaje(); }
          }
        }]);
      }
    }
  }

  mostrarOpcionesContextuales() {
    this.addOpciones([
      { texto: '📚 Ver Unidades', icono: 'fa-folder-open', accion: () => this.mostrarUnidades() },
      { texto: '💡 Otra pregunta', icono: 'fa-lightbulb', accion: () => this.modoPregunta() },
      { texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true }
    ]);
  }

  // ⭐ NUEVO: BOTÓN DE REPORTAR PREGUNTA SIN RESPUESTA
  mostrarBotonReportar(preguntaOriginal) {
    const body = document.getElementById('chatbot-body');
    if (!body) return;
    
    const container = document.createElement('div');
    container.className = 'opciones-container';
    container.id = 'reportar-container';
    
    const btnReportar = document.createElement('button');
    btnReportar.className = 'opcion-btn';
    btnReportar.style.cssText = 'background: linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1));border: 1px solid #ffc107;color: #ffc107;';
    btnReportar.innerHTML = '<i class="fas fa-lightbulb"></i> 📝 Reportar: No encontré lo que buscaba';
    btnReportar.onclick = () => this.mostrarFormularioAgregar(preguntaOriginal);
    container.appendChild(btnReportar);
    
    body.appendChild(container);
    this.scrollBottom();
  }

  mostrarFormularioAgregar(preguntaOriginal) {
    const reportarContainer = document.getElementById('reportar-container');
    if (reportarContainer) reportarContainer.remove();
    
    this.addMsgBot(`<div style="background: rgba(255,193,7,0.1); border: 1px solid #ffc107; border-radius: 12px; padding: 16px; margin: 10px 0;"><strong style="color: #ffc107;">📝 ¡Gracias por ayudar a mejorarme!</strong><br><br><span style="color: #cbd5e1;">Tu pregunta fue:</span><br><em style="color: #ffc107;">"${preguntaOriginal}"</em><br><br><span style="color: #94a3b8; font-size: 0.85rem;">Se ha enviado al administrador para agregar este conocimiento pronto. 🚀</span></div>`);
    
    this.guardarPreguntaNoResuelta(preguntaOriginal);
    this.enviarPreguntaASupabase(preguntaOriginal);
    
    setTimeout(() => {
      this.addOpciones([
        { texto: '💡 Hacer otra pregunta', icono: 'fa-lightbulb', accion: () => this.modoPregunta() },
        { texto: '🏠 Menú principal', icono: 'fa-home', accion: () => this.mostrarInicio(), back: true }
      ]);
    }, 500);
  }

  guardarPreguntaNoResuelta(pregunta) {
    try {
      const preguntas = JSON.parse(localStorage.getItem('bdito_preguntas_pendientes') || '[]');
      preguntas.push({
        pregunta: pregunta,
        fecha: new Date().toISOString(),
        usuario: sessionStorage.getItem('adminName') || 'Anónimo',
        contexto: {
          tema: this.core.contextoActivo.tema,
          intencion: this.core.contextoActivo.intencion,
          nivel: this.core.contextoActivo.nivel
        }
      });
      if (preguntas.length > 100) preguntas.shift();
      localStorage.setItem('bdito_preguntas_pendientes', JSON.stringify(preguntas));
      console.log('✅ Pregunta guardada en localStorage:', pregunta);
    } catch (e) {
      console.error('Error guardando pregunta:', e);
    }
  }

  async enviarPreguntaASupabase(pregunta) {
    if (!this.supabaseReady) return;
    try {
      const client = window.supabase || supabase;
      const { error } = await client.from('preguntas_pendientes').insert([{
        pregunta: pregunta,
        fecha: new Date().toISOString(),
        estado: 'pendiente',
        contexto_tema: this.core.contextoActivo.tema || null,
        contexto_intencion: this.core.contextoActivo.intencion || null,
        usuario: sessionStorage.getItem('adminName') || 'visitante'
      }]);
      if (error) console.warn('⚠️ No se pudo guardar en Supabase:', error.message);
      else console.log('✅ Pregunta enviada a Supabase');
    } catch (e) {
      console.warn('⚠️ Error enviando a Supabase:', e.message);
    }
  }
}

const chatbot = new ChatBotBD();
function toggleChatbot() { chatbot.abrirCerrar(); }
function enviarMensaje() { chatbot.enviarMensaje(); }
console.log('✅ BDito v7.1 inicializado con sistema de reporte');