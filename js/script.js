/* =========================================================
   Sandro Fernández Transportes — script.js
   Basado en "Landing Premium Genérica".
   - DOMContentLoaded para asegurar DOM.
   - Menú móvil usa .mobile-menu.open (coincide con CSS).
   - Copys y WhatsApp adaptados a Sandro.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // ================================
  // 1) Helpers
  // ================================
  const $ = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => [...sc.querySelectorAll(s)];
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // Smooth scroll para anchors + cerrar menú móvil
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#mobile-menu')?.classList.remove('open');
    });
  });

  // ================================
  // 2) AOS
  // ================================
  window.AOS && AOS.init({
    once: true,
    duration: 800,
    easing: 'ease-out-cubic',
    offset: 10,
  });

  // ================================
  // 3) Menú móvil + Tema (persistencia)
  // ================================
  const btnMenu = $('#btn-menu');
  const mobileMenu = $('#mobile-menu');
  btnMenu?.addEventListener('click', () => mobileMenu?.classList.toggle('open'));

  const THEME_KEY = 'lp-theme';
  const btnTheme = $('#btn-theme');
  const applyTheme = (mode) => {
    document.body.classList.toggle('theme-light', mode === 'light');
    localStorage.setItem(THEME_KEY, mode);
    const icon = btnTheme?.querySelector('i');
    if (icon) icon.className = mode === 'light' ? 'ph ph-moon-stars' : 'ph ph-sun-dim';
  };
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  btnTheme?.addEventListener('click', () => {
    const next = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    applyTheme(next);
  });

  // ================================
// 4) Contadores (cuando entran en viewport) — soporta:
//    - data-static="1997"  (no anima)
//    - data-from-year="1997" (calcula años y anima)
//    - data-count="24" / "39001" (anima a ese número)
// ================================
const formatNum = (n) => (n >= 1000 ? n.toLocaleString('es-UY') : String(n));

const counters = $$('.metrics .num');
if (counters.length) {
  const getTarget = (el) => {
    if (el.dataset.static) return null; // fijo, sin animación
    if (el.dataset.fromYear) {
      const y = parseInt(el.dataset.fromYear, 10);
      const now = new Date().getFullYear();
      return Math.max(0, now - (isNaN(y) ? now : y));
    }
    if (el.dataset.count) {
      const to = parseFloat(el.dataset.count);
      return isNaN(to) ? 0 : to;
    }
    // fallback: si alguien puso un número adentro sin data-*, lo tomamos
    const raw = parseFloat((el.textContent || '').replace(/\./g, '').replace(',', '.'));
    return isNaN(raw) ? 0 : raw;
  };

  const animateTo = (el, to, dur = 1200) => {
    const isFloat = String(to).includes('.');
    const start = performance.now();
    const step = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 2); // easeOutQuad
      const val = to * eased;
      el.textContent = isFloat ? val.toFixed(1) : formatNum(Math.round(val));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.dataset.static) {            // caso fijo
        el.textContent = el.dataset.static;
      } else {
        const to = getTarget(el);
        animateTo(el, to);
      }
      io.unobserve(el);
    });
  }, { threshold: 0.25 });

  counters.forEach((el) => io.observe(el));
}


  // ================================
  // 5) (Opcional) Slider de testimonios del template
  //    — si #slides no existe, se omite sin romper nada
  // ================================
  const SLIDES_DATA = [
    { quote: "Operativa ágil y segura. Excelente coordinación.", author: "Cliente del rubro" },
    { quote: "Cumplen tiempos y cuidan la carga.", author: "Industria forestal" },
    { quote: "Muy buena atención 24/7.", author: "Logística" }
  ];
  const slidesWrap = $('#slides');
  if (slidesWrap){
    SLIDES_DATA.forEach(({quote, author}) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `<blockquote>“${quote}”</blockquote><footer>— ${author}</footer>`;
      slidesWrap.appendChild(slide);
    });

    let idx = 0;
    const prev = $('.slider-btn.prev');
    const next = $('.slider-btn.next');
    const go = (i) => {
      idx = (i + SLIDES_DATA.length) % SLIDES_DATA.length;
      slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
    };
    prev?.addEventListener('click', ()=> go(idx-1));
    next?.addEventListener('click', ()=> go(idx+1));

    let timer = setInterval(()=> go(idx+1), 4000);
    slidesWrap.addEventListener('mouseenter', ()=> clearInterval(timer));
    slidesWrap.addEventListener('mouseleave', ()=> timer = setInterval(()=> go(idx+1), 4000));
  }

  // ================================
  // 6) Contacto / WhatsApp
  //    (Usado por el botón del formulario con id="btn-whatsapp")
  // ================================
  const WHATSAPP = '59892992182'; // <- cambiá acá si corresponde
  $('#btn-whatsapp')?.addEventListener('click', () => {
    const nombre = ($('[name="nombre"]')?.value || '').trim();
    const mensaje = ($('[name="mensaje"]')?.value || '').trim();
    const texto = `Hola Sandro Fernández Transportes. Soy ${nombre || 'cliente'}, quiero coordinar un viaje. ${mensaje ? 'Detalles: ' + mensaje : ''}`;
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  });

  // Envío del formulario (placeholder)
  $('#contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Gracias! Te contactamos a la brevedad. (Conectar EmailJS / Google Sheets aquí)');
    e.target.reset();
  });

  // ================================
  // 7) Año footer
  // ================================
  $('#year') && ($('#year').textContent = new Date().getFullYear());
});






