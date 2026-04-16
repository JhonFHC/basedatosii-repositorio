// ==========================================
// PORTAL DE ACCESO - GESTIÓN DE NAVEGACIÓN
// ==========================================
class PortalManager {
  constructor() {
    this.portal = document.getElementById('portal');
    this.init();
  }

  init() {
    if (!this.portal) return;
    
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    // Restaurar visibilidad al cargar la página (para botón "atrás")
    this.restoreVisibility();
  }

  restoreVisibility() {
    // Asegurar que el portal sea visible siempre
    this.portal.classList.remove('fly-away');
    this.portal.style.opacity = '1';
    this.portal.style.transform = 'none';
  }

  setupEventListeners() {
    this.portal.addEventListener('click', () => this.activatePortal());
  }

  setupKeyboardNavigation() {
    this.portal.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.activatePortal();
      }
    });
  }

  activatePortal() {
    const targetUrl = this.portal.dataset.target;
    if (!targetUrl) return;

    this.portal.classList.add('fly-away');
    
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 900);
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PortalManager());
} else {
  new PortalManager();
}

// Restaurar al volver atrás (pageshow se ejecuta incluso con bfcache)
window.addEventListener('pageshow', () => {
  const portal = document.getElementById('portal');
  if (portal) {
    portal.classList.remove('fly-away');
    portal.style.opacity = '1';
    portal.style.transform = 'none';
  }
});