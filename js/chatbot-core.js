// =============================================
// CHATBOT - NÚCLEO DE INTELIGENCIA NIVEL DIOS
// Sistema de intenciones, similitud, contexto y memoria
// =============================================

class ChatBotCore {
  constructor() {
    // ========== SISTEMA DE INTENCIONES MEJORADO ==========
    this.intenciones = {
      'definicion': {
        patrones: ['que es', 'qué es', 'definicion', 'definición', 'explica', 'explícame', 'significa', 'concepto', 'significado', 'a que se refiere', 'definir', 'describe', 'describir'],
        peso: 10,
        icono: '📘',
        plantilla: 'definicion'
      },
      'ejemplo': {
        patrones: ['ejemplo', 'ejemplos', 'muestrame', 'muéstrame', 'practico', 'práctico', 'codigo', 'código', 'como se hace', 'cómo se hace', 'demostracion', 'demostración', 'caso practico', 'caso práctico', 'dame un ejemplo', 'pon un ejemplo'],
        peso: 9,
        icono: '💻',
        plantilla: 'ejemplo'
      },
      'comparacion': {
        patrones: ['vs', 'versus', 'diferencia', 'comparar', 'comparacion', 'comparación', 'cual es mejor', 'cuál es mejor', 'ventajas', 'desventajas', 'diferencia entre', 'cual es la diferencia', 'qué diferencia'],
        peso: 8,
        icono: '⚖️',
        plantilla: 'comparacion'
      },
      'pasos': {
        patrones: ['pasos', 'como', 'cómo', 'tutorial', 'guia', 'guía', 'procedimiento', 'proceso', 'instrucciones', 'paso a paso', 'como hacer', 'cómo hacer', 'como crear', 'cómo crear'],
        peso: 7,
        icono: '📋',
        plantilla: 'pasos'
      },
      'ventajas': {
        patrones: ['ventajas', 'beneficios', 'pros', 'positivo', 'fortalezas', 'lo bueno', 'por qué usar', 'porque usar', 'para qué sirve', 'para que sirve'],
        peso: 6,
        icono: '✅',
        plantilla: 'ventajas'
      },
      'desventajas': {
        patrones: ['desventajas', 'inconvenientes', 'contras', 'negativo', 'debilidades', 'lo malo', 'limitaciones', 'problemas', 'desventaja'],
        peso: 6,
        icono: '⚠️',
        plantilla: 'desventajas'
      },
      'resumen': {
        patrones: ['resumen', 'resumido', 'breve', 'corto', 'rapido', 'rápido', 'en pocas palabras', 'sintesis', 'síntesis', 'en resumen', 'resumir'],
        peso: 5,
        icono: '🧠',
        plantilla: 'resumen'
      },
      'error': {
        patrones: ['error', 'problema', 'falla', 'no funciona', 'por que no', 'por qué no', 'solucion', 'solución', 'arreglar', 'fix', 'bug', 'error comun', 'error común'],
        peso: 4,
        icono: '🔧',
        plantilla: 'error'
      },
      'codigo': {
        patrones: ['codigo', 'código', 'script', 'query', 'sentencia sql', 'escribir', 'sintaxis', 'comando', 'función sql', 'crear funcion', 'crear función'],
        peso: 8,
        icono: '💾',
        plantilla: 'codigo'
      },
      'saludo': {
        patrones: ['hola', 'buenas', 'hey', 'saludos', 'buenos días', 'buenas tardes', 'buenas noches', 'buen dia', 'buen día'],
        peso: 3,
        icono: '👋',
        plantilla: 'saludo'
      },
      'despedida': {
        patrones: ['adios', 'adiós', 'chau', 'bye', 'hasta luego', 'gracias', 'nos vemos', 'hasta pronto'],
        peso: 3,
        icono: '👋',
        plantilla: 'despedida'
      },
      'ayuda': {
        patrones: ['ayuda', 'socorro', 'no entiendo', 'confundido', 'difícil', 'dificil', 'complejo', 'complicado', 'no comprendo'],
        peso: 4,
        icono: '🆘',
        plantilla: 'ayuda'
      }
    };
    
    // ========== SISTEMA DE NIVELES DE USUARIO (MEJORADO) ==========
    this.nivelesIndicadores = {
      'basico': ['simple', 'facil', 'fácil', 'basico', 'básico', 'principiante', 'nuevo', 'empezando', 'no se', 'no sé', 'desde cero', 'nunca', 'primera vez'],
      'intermedio': ['ya se', 'ya sé', 'conozco', 'entiendo', 'se usar', 'sé usar', 'practico', 'práctico'],
      'avanzado': ['profundo', 'detalle', 'interno', 'arquitectura', 'optimizacion', 'optimización', 'rendimiento', 'avanzado', 'experto', 'técnico', 'tuning', 'internamente']
    };
    
    // ========== CONTEXTO ACTIVO CON MEMORIA REAL ==========
    this.contextoActivo = {
      tema: null,
      intencion: null,
      nivel: 'intermedio',
      historialTemas: [],
      historialIntenciones: [],
      preguntasNoResueltas: [],
      ultimoUsuario: null,
      conversacionActual: []
    };
    
    // ========== CACHÉ DE SIMILITUD ==========
    this.cacheSimilitud = new Map();
    
    // ========== MEMORIA DE CONVERSACIÓN (ÚLTIMAS INTERACCIONES) ==========
    this.memoriaConversacion = [];
  }
  
  // ========== DETECTAR INTENCIÓN PRINCIPAL ==========
  detectarIntencion(texto) {
    const q = texto.toLowerCase().trim();
    let mejorIntencion = null;
    let mejorPuntuacion = 0;
    let detalles = [];
    
    for (const [nombre, intencion] of Object.entries(this.intenciones)) {
      let puntuacion = 0;
      const patronesEncontrados = [];
      
      for (const patron of intencion.patrones) {
        if (q.includes(patron)) {
          puntuacion += intencion.peso;
          patronesEncontrados.push(patron);
        }
      }
      
      // Bonus por coincidencia al inicio de la frase
      if (intencion.patrones.some(p => q.startsWith(p))) {
        puntuacion += 2;
      }
      
      if (puntuacion > 0) {
        detalles.push({ nombre, puntuacion, patrones: patronesEncontrados });
      }
      
      if (puntuacion > mejorPuntuacion) {
        mejorPuntuacion = puntuacion;
        mejorIntencion = nombre;
      }
    }
    
    // Si no hay intención clara, intentar inferir por contexto
    if (!mejorIntencion && this.contextoActivo.intencion) {
      // Si usuario dice "otro", "más", "otro ejemplo" → mantener intención anterior
      const indicadoresSeguimiento = ['otro', 'más', 'también', 'además', 'igual', 'similar'];
      if (indicadoresSeguimiento.some(ind => q.includes(ind))) {
        mejorIntencion = this.contextoActivo.intencion;
      }
    }
    
    return mejorIntencion || 'definicion'; // Por defecto, definición
  }
  
  // ========== DETECTAR MÚLTIPLES INTENCIONES (para respuestas compuestas) ==========
  detectarMultiplesIntenciones(texto) {
    const q = texto.toLowerCase().trim();
    const intencionesDetectadas = [];
    
    for (const [nombre, intencion] of Object.entries(this.intenciones)) {
      let puntuacion = 0;
      for (const patron of intencion.patrones) {
        if (q.includes(patron)) {
          puntuacion += intencion.peso;
        }
      }
      if (puntuacion > 0) {
        intencionesDetectadas.push({ nombre, puntuacion, icono: intencion.icono });
      }
    }
    
    return intencionesDetectadas.sort((a, b) => b.puntuacion - a.puntuacion);
  }
  
  // ========== DETECTAR NIVEL DE USUARIO (MEJORADO) ==========
  detectarNivel(texto) {
    const q = texto.toLowerCase();
    let puntuaciones = { basico: 0, intermedio: 1, avanzado: 0 }; // Intermedio por defecto
    
    for (const [nivel, indicadores] of Object.entries(this.nivelesIndicadores)) {
      for (const ind of indicadores) {
        if (q.includes(ind)) puntuaciones[nivel] += 2;
      }
    }
    
    // Detectar por complejidad de términos técnicos
    const terminosAvanzados = [
      'particionamiento', 'sharding', 'replicación', 'síncrona', 'asíncrona',
      'mvcc', 'wal', 'pgvector', 'fdw', 'cte recursiva', 'lateral join',
      'transacciones distribuidas', 'two-phase commit', 'isolation level',
      'serializable', 'repeatable read', 'read committed', 'explain analyze',
      'query plan', 'execution plan', 'index scan', 'seq scan',
      'materialized view', 'vista materializada', 'logical replication'
    ];
    
    for (const term of terminosAvanzados) {
      if (q.includes(term)) puntuaciones.avanzado += 3;
    }
    
    // Elegir el nivel con mayor puntuación
    const nivelElegido = Object.entries(puntuaciones).sort((a, b) => b[1] - a[1])[0][0];
    
    // Actualizar contexto
    this.contextoActivo.nivel = nivelElegido;
    
    return nivelElegido;
  }
  
  // ========== SIMILITUD SEMÁNTICA (JACCARD MEJORADO) ==========
  calcularSimilitud(textoA, textoB) {
    const clave = `${textoA}|${textoB}`;
    if (this.cacheSimilitud.has(clave)) return this.cacheSimilitud.get(clave);
    
    const palabrasA = new Set(this.tokenizar(textoA));
    const palabrasB = new Set(this.tokenizar(textoB));
    
    if (palabrasA.size === 0 || palabrasB.size === 0) return 0;
    
    // Intersección
    let interseccion = 0;
    for (const palabra of palabrasA) {
      if (palabrasB.has(palabra)) interseccion++;
    }
    
    // Coeficiente de Jaccard normalizado
    const similitud = interseccion / Math.sqrt(palabrasA.size * palabrasB.size);
    
    // Guardar en caché (límite 1000 entradas)
    if (this.cacheSimilitud.size > 1000) {
      const firstKey = this.cacheSimilitud.keys().next().value;
      this.cacheSimilitud.delete(firstKey);
    }
    this.cacheSimilitud.set(clave, similitud);
    
    return similitud;
  }
  
  // ========== TOKENIZACIÓN CON SINÓNIMOS Y LEMATIZACIÓN ==========
  tokenizar(texto) {
    return texto.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!\[\]""'']/g, ' ')
      .split(/\s+/)
      .filter(p => p.length > 2)
      .map(p => this.lematizar(p))
      .filter(p => p.length > 1); // Eliminar palabras muy cortas después de lematizar
  }
  
  // ========== LEMATIZACIÓN MEJORADA ==========
  lematizar(palabra) {
    const raices = {
      // Verbos
      'buscar': 'busc', 'buscas': 'busc', 'busca': 'busc', 'buscamos': 'busc', 'buscan': 'busc', 'buscando': 'busc',
      'crear': 'cre', 'creas': 'cre', 'crea': 'cre', 'creamos': 'cre', 'crean': 'cre', 'creando': 'cre',
      'modificar': 'modif', 'modifica': 'modif', 'modificas': 'modif', 'modificamos': 'modif',
      'eliminar': 'elim', 'elimina': 'elim', 'eliminas': 'elim', 'eliminamos': 'elim',
      'insertar': 'insert', 'inserta': 'insert', 'actualizar': 'actual', 'actualiza': 'actual',
      'obtener': 'obtien', 'obtiene': 'obtien', 'obtenemos': 'obtien',
      'consultar': 'consult', 'consulta': 'consult', 'consultas': 'consult',
      'mostrar': 'most', 'muestra': 'most', 'muestras': 'most',
      'encontrar': 'encontr', 'encuentra': 'encontr',
      
      // Sustantivos
      'consultas': 'consulta', 'índices': 'índice', 'indices': 'indice',
      'tablas': 'tabla', 'bases': 'base', 'datos': 'dato',
      'subconsultas': 'subconsulta', 'triggers': 'trigger',
      'vistas': 'vista', 'cursores': 'cursor', 'funciones': 'funcion',
      'procedimientos': 'procedimiento', 'restricciones': 'restriccion',
      'relaciones': 'relacion', 'claves': 'clave', 'llaves': 'llave',
      'transacciones': 'transaccion', 'particiones': 'particion',
      'respaldos': 'respaldo', 'consultando': 'consulta',
      'buscando': 'buscar', 'creando': 'crear', 'haciendo': 'hacer',
      'explicame': 'explica', 'muestrame': 'muestra', 'dime': 'decir',
      'quiero': 'quer', 'necesito': 'neces', 'deseo': 'dese',
      
      // Adjetivos
      'simples': 'simpl', 'complejos': 'compl', 'básicos': 'basi', 'basicos': 'basi',
      'avanzados': 'avanc', 'avanzada': 'avanc'
    };
    
    return raices[palabra] || palabra;
  }
  
  // ========== INFERIR TEMA POR CONTEXTO (MEJORADO) ==========
  inferirTemaPorContexto(texto) {
    const palabras = texto.split(/\s+/).filter(p => p.length > 2);
    const q = texto.toLowerCase();
    
    // Si es una pregunta corta y hay un tema activo
    if (palabras.length <= 5 && this.contextoActivo.tema) {
      const indicadoresSeguimiento = [
        'ejemplo', 'y', 'otro', 'más', 'también', 'además',
        'eso', 'esto', 'aquel', 'aplica', 'como', 'cómo',
        'entonces', 'osea', 'o sea', 'es decir'
      ];
      
      if (palabras.some(p => indicadoresSeguimiento.includes(p.toLowerCase())) ||
          indicadoresSeguimiento.some(ind => q.includes(ind))) {
        return this.contextoActivo.tema;
      }
    }
    
    // Si no hay tema explícito, buscar en el historial reciente
    if (palabras.length <= 3 && this.contextoActivo.historialTemas.length > 0) {
      // Preguntas cortas probablemente se refieren al último tema
      const ultimoTema = this.contextoActivo.historialTemas[0];
      // Solo si la pregunta no contiene un tema nuevo
      const palabrasTema = this.tokenizar(ultimoTema);
      const tieneNuevoTema = palabras.some(p => 
        !palabrasTema.includes(this.lematizar(p)) && p.length > 3
      );
      
      if (!tieneNuevoTema) {
        return ultimoTema;
      }
    }
    
    return null;
  }
  
  // ========== ACTUALIZAR CONTEXTO ==========
  actualizarContexto(tema, intencion, nivel) {
    if (tema) {
      this.contextoActivo.tema = tema;
      
      // Mantener historial de temas (últimos 10)
      if (!this.contextoActivo.historialTemas.includes(tema)) {
        this.contextoActivo.historialTemas.unshift(tema);
        if (this.contextoActivo.historialTemas.length > 10) {
          this.contextoActivo.historialTemas.pop();
        }
      }
    }
    
    if (intencion) {
      this.contextoActivo.intencion = intencion;
      this.contextoActivo.historialIntenciones.unshift(intencion);
      if (this.contextoActivo.historialIntenciones.length > 5) {
        this.contextoActivo.historialIntenciones.pop();
      }
    }
    
    if (nivel) {
      this.contextoActivo.nivel = nivel;
    }
  }
  
  // ========== REGISTRAR PREGUNTA NO RESUELTA (AUTOAPRENDIZAJE) ==========
  registrarNoResuelta(pregunta, temaDetectado = null) {
    this.contextoActivo.preguntasNoResueltas.push({
      pregunta,
      tema: temaDetectado,
      fecha: new Date().toISOString(),
      contexto: { ...this.contextoActivo }
    });
    
    // Guardar en localStorage para análisis futuro
    try {
      const guardadas = JSON.parse(localStorage.getItem('bdito_no_resueltas') || '[]');
      guardadas.push({
        pregunta,
        tema: temaDetectado,
        fecha: new Date().toISOString()
      });
      // Mantener solo últimas 50
      localStorage.setItem('bdito_no_resueltas', JSON.stringify(guardadas.slice(-50)));
    } catch (e) {
      // Silencioso
    }
  }
  
  // ========== OBTENER SUGERENCIAS RELACIONADAS ==========
  obtenerRelaciones(tema, conocimiento) {
    if (!conocimiento || !conocimiento[tema]) return [];
    return conocimiento[tema].relaciones || [];
  }
  
  // ========== GENERAR RESPUESTA FALLBACK POR INTENCIÓN ==========
  generarRespuestaFallback(tema, intencion) {
    const respuestas = {
      'definicion': `🤔 No tengo una definición precisa de "<strong>${tema || 'ese tema'}</strong>" en mi base de conocimiento. ¿Puedes intentar con otros términos relacionados?`,
      'ejemplo': `📝 No encontré ejemplos específicos sobre "<strong>${tema || 'ese tema'}</strong>". ¿Hay otro tema sobre el que quieras ejemplos prácticos?`,
      'comparacion': `⚖️ No tengo información para comparar "<strong>${tema || 'esos temas'}</strong>". Prueba con PostgreSQL vs MySQL, SQL vs NoSQL, etc.`,
      'pasos': `📋 No tengo una guía paso a paso sobre "<strong>${tema || 'ese tema'}</strong>". ¿Quieres que te ayude con otro tema?`,
      'ventajas': `✅ No encontré ventajas específicas de "<strong>${tema || 'ese tema'}</strong>". ¿Te interesa otro aspecto?`,
      'desventajas': `⚠️ No encontré desventajas específicas de "<strong>${tema || 'ese tema'}</strong>".`,
      'error': `🔧 No tengo soluciones para errores de "<strong>${tema || 'ese tema'}</strong>". Te sugiero buscar en StackOverflow o la documentación oficial.`,
      'resumen': `🧠 No tengo un resumen de "<strong>${tema || 'ese tema'}</strong>". ¿Quieres que te explique algún concepto en detalle?`,
      'codigo': `💾 No encontré código específico sobre "<strong>${tema || 'ese tema'}</strong>". ¿Hay otro tema que te interese?`,
      'ayuda': `🆘 ¡Tranquilo! Estoy aquí para ayudarte. Cuéntame qué tema específico te está costando y lo revisamos juntos paso a paso.`,
      'saludo': `¡Hola! 👋 Soy BDito, ¿en qué puedo ayudarte hoy con bases de datos?`,
      'despedida': `¡Hasta pronto! 👋 Fue un gusto ayudarte. Vuelve cuando necesites.`
    };
    
    return respuestas[intencion] || respuestas['definicion'];
  }
  
  // ========== AGREGAR A MEMORIA DE CONVERSACIÓN ==========
  agregarAMemoria(tipo, texto) {
    this.memoriaConversacion.push({ tipo, texto, timestamp: Date.now() });
    // Mantener solo últimas 10 interacciones
    if (this.memoriaConversacion.length > 10) {
      this.memoriaConversacion.shift();
    }
  }
  
  // ========== OBTENER CONTEXTO PARA RESPUESTAS ==========
  obtenerResumenContexto() {
    const ultimoTema = this.contextoActivo.tema;
    const ultimaIntencion = this.contextoActivo.intencion;
    const nivel = this.contextoActivo.nivel;
    
    return {
      tema: ultimoTema,
      intencion: ultimaIntencion,
      nivel: nivel,
      ultimaInteraccion: this.memoriaConversacion[this.memoriaConversacion.length - 1] || null
    };
  }
  
  // ========== SUGERIR SIGUIENTE TEMA (Basado en relaciones) ==========
  sugerirSiguienteTema(temaActual, conocimiento) {
    if (!conocimiento || !conocimiento[temaActual]) return [];
    
    const relaciones = conocimiento[temaActual].relaciones || [];
    const ruta = conocimiento[temaActual].ruta || [];
    
    // Combinar relaciones y ruta, eliminar el tema actual
    const sugerencias = [...new Set([...relaciones, ...ruta])]
      .filter(t => t !== temaActual)
      .slice(0, 5);
    
    return sugerencias;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ChatBotCore = ChatBotCore;
}

console.log('✅ ChatBotCore NIVEL DIOS cargado');