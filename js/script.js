/* =========================================================
   Sandro Fernández Transportes — script.js (completo)
   Basado en "Landing Premium Genérica".
   - DOMContentLoaded para asegurar DOM.
   - Menú móvil usa .mobile-menu.open (coincide con CSS).
   - Copys y Contacto (WhatsApp + Email) adaptados a Sandro.
   - Validación accesible del formulario + reduce motion.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // ================================
  // 1) Helpers
  // ================================
  const $  = (s, sc = document) => sc.querySelector(s);
  const $$ = (s, sc = document) => [...sc.querySelectorAll(s)];
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const REDUCE_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  // Smooth scroll para anchors + cerrar menú móvil
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
      $('#mobile-menu')?.classList.remove('open');
    });
  });

  // ================================
  // 2) AOS (animaciones on-scroll)
  // ================================
  if (window.AOS) {
    AOS.init({
      once: true,
      duration: REDUCE_MOTION ? 0 : 800,
      easing: 'ease-out-cubic',
      offset: 10,
      disable: REDUCE_MOTION
    });
  }

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
  // 4) Contadores (cuando entran en viewport)
  // ================================
  const counters = $$('.metrics .num');

  if (counters.length) {
    const wantsGrouping = (el) => (el.dataset.format || '').toLowerCase() === 'group';

    const formatValue = (el, n, isFloat = false) => {
      if (isFloat) return n.toFixed(1);
      const i = Math.round(n);
      return wantsGrouping(el) ? new Intl.NumberFormat('es-UY').format(i) : String(i);
    };

    const getTarget = (el) => {
      // 1) Fijo (no animar)
      if (el.dataset.static != null) return null;

      // 2) Años desde un año de inicio
      if (el.dataset.fromYear) {
        const y = parseInt(el.dataset.fromYear, 10);
        const now = new Date().getFullYear();
        const years = Math.max(0, now - (isNaN(y) ? now : y));
        return years;
      }

      // 3) Número directo
      if (el.dataset.count) {
        const to = parseFloat(el.dataset.count);
        return isNaN(to) ? 0 : to;
      }

      // 4) Fallback: lee el contenido actual si hubiese un número
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
        el.textContent = formatValue(el, val, isFloat);
        if (p < 1) requestAnimationFrame(step);
      };

      // Si el usuario pide reduce motion, no animamos; seteamos valor final
      if (REDUCE_MOTION) {
        el.textContent = formatValue(el, to, isFloat);
        return;
      }
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;

        if (el.dataset.static != null) {
          el.textContent = String(el.dataset.static);
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
  // 5) (Opcional) Slider de testimonios
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

    let timer = REDUCE_MOTION ? null : setInterval(()=> go(idx+1), 4000);
    slidesWrap.addEventListener('mouseenter', ()=> timer && clearInterval(timer));
    slidesWrap.addEventListener('mouseleave', ()=> {
      if (!REDUCE_MOTION) timer = setInterval(()=> go(idx+1), 4000);
    });
  }

  // ================================
  // 6) Contacto: Email + WhatsApp (mensaje prearmado)
  // ================================
  (() => {
    // 📌 CONFIG
    const WHATSAPP = '59899840881';                   // 099 840 881 → formato internacional sin '+'
    const EMAIL_TO = 'sandrofernandez4@hotmail.com';  // correo de Sandro

    // Helpers de lectura segura
    const val = (name) => (document.querySelector(`[name="${name}"]`)?.value || '').trim();

    // Construye un texto descriptivo uniforme
    const buildDescriptor = () => {
      const nombre   = val('nombre')   || 'Cliente';
      const motivo   = val('motivo')   || 'Consulta';
      const mensaje  = val('mensaje')  || '';
      const tel      = val('telefono') || '';
      const email    = val('email')    || '';

      // Contexto útil
      const when = new Date().toLocaleString('es-UY');
      const origen = location.origin + location.pathname; // limpio, sin querystring

      return {
        nombre, motivo, mensaje, tel, email,
        meta: { when, origen }
      };
    };

    // ---------- WhatsApp ----------
    const buildWhatsAppURL = () => {
      const d = buildDescriptor();
      const texto =
`Hola, te escribo desde la web de Sandro Fernández Transportes.

Nombre: ${d.nombre}
Motivo: ${d.motivo}
${d.mensaje ? `Mensaje: ${d.mensaje}\n` : ''}${d.tel ? `Teléfono: ${d.tel}\n` : ''}${d.email ? `Email: ${d.email}\n` : ''}—
Origen: ${d.meta.origen}
Fecha/Hora: ${d.meta.when}`;
      return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    };

    $('#btn-whatsapp')?.addEventListener('click', () => {
      window.open(buildWhatsAppURL(), '_blank');
    });

    // ---------- Email (mailto) ----------
    const buildMailto = () => {
      const d = buildDescriptor();
      const subject = `Consulta desde la web — ${d.motivo}`;
      const body =
`Hola Sandro Fernández Transportes,

Nombre: ${d.nombre}
Motivo: ${d.motivo}
${d.mensaje ? `Mensaje: ${d.mensaje}\n` : ''}${d.tel ? `Teléfono: ${d.tel}\n` : ''}${d.email ? `Email: ${d.email}\n` : ''}—
Origen: ${d.meta.origen}
Fecha/Hora: ${d.meta.when}`;

      return `mailto:${encodeURIComponent(EMAIL_TO)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // Botón principal para abrir el cliente de correo
    $('#btn-email')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = buildMailto();
    });

    // (Opcional) Si tenés un <a id="link-email">, actualizamos su href al vuelo
    const mailLink = $('#link-email');
    if (mailLink) {
      const refreshMailLink = () => { mailLink.setAttribute('href', buildMailto()); };
      ['input', 'change'].forEach(evt => {
        ['nombre','motivo','mensaje','telefono','email'].forEach(n => {
          document.querySelector(`[name="${n}"]`)?.addEventListener(evt, refreshMailLink);
        });
      });
      // Inicializamos
      refreshMailLink();
    }
  })();

  // ================================
  // 6.b) Validación accesible del formulario (ligera, sin libs)
  // ================================
  {
    const form = document.getElementById('contact-form');
    if (form){
      // Helper para marcar estados en un wrapper .field
      const mark = (fieldEl, ok, msg = '') => {
        if (!fieldEl) return;
        fieldEl.classList.remove('is-valid','is-invalid');
        fieldEl.classList.add(ok ? 'is-valid' : 'is-invalid');

        const err = fieldEl.querySelector('.error-text');
        if (err){ err.textContent = msg; }

        const control = fieldEl.querySelector('input, textarea, select');
        if (control){
          control.setAttribute('aria-invalid', String(!ok));
          if (err?.id) control.setAttribute('aria-describedby', err.id);
        }
      };

      // Asegurar wrappers .field + placeholder de error si faltan
      ['nombre','email','motivo','telefono','mensaje'].forEach(n => {
        const control = form.querySelector(`[name="${n}"]`);
        if (!control) return;
        let wrapper = control.closest('.field');
        if (!wrapper){
          // Si el HTML no tenía .field, lo creamos alrededor del label
          const label = control.closest('label') ?? control.parentElement;
          if (label){
            wrapper = document.createElement('div');
            wrapper.className = 'field';
            label.parentElement.insertBefore(wrapper, label);
            wrapper.appendChild(label);
          }
        }
        if (wrapper && !wrapper.querySelector('.error-text')){
          const span = document.createElement('div');
          span.className = 'error-text';
          span.id = `err-${n}`;
          span.setAttribute('aria-live','polite');
          wrapper.appendChild(span);
        }
      });

      // Validaciones mínimas
      const validators = {
        nombre: v => v.trim().length >= 2 || 'Ingresá tu nombre.',
        email: v => /^\S+@\S+\.\S+$/.test(v) || 'Email no válido.',
        motivo: v => v.trim().length > 0 || 'Elegí un motivo.',
        telefono: v => (v === '' || /^[0-9 +-]{6,20}$/.test(v)) || 'Teléfono no válido.',
        mensaje: v => v.trim().length >= 8 || 'Contanos brevemente el motivo (8+ caracteres).'
      };

      // Validación en vivo
      form.addEventListener('input', e => {
        const t = e.target;
        if (!t?.name || !(t.name in validators)) return;
        const okOrMsg = validators[t.name](t.value || '');
        mark(t.closest('.field'), okOrMsg === true, okOrMsg === true ? '' : okOrMsg);
      });

      // Submit (bloquea si hay errores; no interfiere con tu flujo)
      form.addEventListener('submit', e => {
        let hasError = false;
        Object.keys(validators).forEach(name => {
          const el = form.querySelector(`[name="${name}"]`);
          if (!el) return;
          const okOrMsg = validators[name](el.value || '');
          mark(el.closest('.field'), okOrMsg === true, okOrMsg === true ? '' : okOrMsg);
          if (okOrMsg !== true) hasError = true;
        });
        if (hasError){
          e.preventDefault();
          // Foco al primer error
          const firstErr = form.querySelector('.is-invalid input, .is-invalid textarea, .is-invalid select');
          firstErr?.focus();
        }
      });
    }
  }

  // ================================
  // 7) Año footer
  // ================================
  $('#year') && ($('#year').textContent = new Date().getFullYear());

  // ================================
  // 8) Brand Preview — acordeón con 1 abierto siempre
  // ================================
  (() => {
    const acc = document.querySelector('#brand-preview .brand-accordion');
    if (!acc) return;

    // Asegurar que el primero esté abierto al cargar
    const items = acc.querySelectorAll('.bp-item');
    if (items.length) items[0].setAttribute('open', '');

    // Only-one-open
    acc.addEventListener('toggle', (e) => {
      const d = e.target;
      if (!(d instanceof HTMLDetailsElement)) return;
      if (d.open) {
        acc.querySelectorAll('.bp-item[open]').forEach(x => {
          if (x !== d) x.open = false;
        });
      }
    }, true);

    // Nunca dejar todo cerrado
    acc.addEventListener('click', (e) => {
      const summary = e.target.closest('summary');
      if (!summary) return;
      const d = summary.parentElement;
      const opened = acc.querySelectorAll('.bp-item[open]');
      if (opened.length === 1 && opened[0] === d) {
        e.preventDefault();
      }
    });
  })();
});










// ================================
// Flota: Lightbox + slideshow (sin libs)
// - Lee data-images de cada .tile
// - Soporta múltiples imágenes, autoplay, teclado y swipe
// - Ajustes mobile: aplica clase lb--mobile <640px
// ================================
(() => {
  const tiles = document.querySelectorAll('#portfolio .tile');
  if (!tiles.length) return;

  const lb = document.getElementById('lightbox');
  const img = lb.querySelector('.lb__img');
  const caption = lb.querySelector('.lb__caption');
  const dotsWrap = lb.querySelector('.lb__dots');
  const btnPrev = lb.querySelector('.lb__prev');
  const btnNext = lb.querySelector('.lb__next');
  const closeEls = lb.querySelectorAll('[data-close]');

  const REDUCE_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const AUTOPLAY_MS = REDUCE_MOTION ? 0 : 4500;

  let images = [];       // rutas actuales
  let labels = [];       // etiquetas (opcionales)
  let idx = 0;
  let timer = null;
  let lastTrigger = null; // para devolver foco al cerrar

  // ---- Mobile helper: aplica clase cuando el viewport es angosto ----
  const setMobileClass = () => {
    lb.classList.toggle('lb--mobile', window.innerWidth < 640);
  };
  // pequeño debounce para resize
  let rAF = null;
  window.addEventListener('resize', () => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(setMobileClass);
  });
  setMobileClass();

  const parseImages = (el) => {
    const raw = (el.getAttribute('data-images') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return raw;
  };

  const buildDots = () => {
    dotsWrap.innerHTML = '';
    if (images.length <= 1) return;
    images.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Ir a imagen ${i+1}`);
      b.addEventListener('click', () => go(i, /*manual*/true));
      dotsWrap.appendChild(b);
    });
  };

  const paint = () => {
    img.src = images[idx];
    caption.textContent = labels[idx] || '';
    [...dotsWrap.children].forEach((d, i) =>
      d.setAttribute('aria-current', String(i === idx))
    );
  };

  const go = (i, manual=false) => {
    idx = (i + images.length) % images.length;
    paint();
    if (manual) restartAutoplay();
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (AUTOPLAY_MS > 0 && images.length > 1) {
      timer = setInterval(() => go(idx + 1), AUTOPLAY_MS);
    }
  };
  const stopAutoplay = () => { if (timer) { clearInterval(timer); timer = null; } };
  const restartAutoplay = () => { stopAutoplay(); startAutoplay(); };

  const open = (triggerEl, imgs, labelText='') => {
    lastTrigger = triggerEl || null;
    images = imgs;
    labels = imgs.map(() => labelText);
    idx = 0;
    buildDots();
    paint();
    setMobileClass(); // ← asegura layout correcto al abrir
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    startAutoplay();
  };

  const close = () => {
    stopAutoplay();
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.removeAttribute('src');
    if (lastTrigger) lastTrigger.focus();
  };

  // Eventos básicos
  btnPrev.addEventListener('click', () => go(idx - 1, true));
  btnNext.addEventListener('click', () => go(idx + 1, true));
  closeEls.forEach(el => el.addEventListener('click', close));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(idx + 1, true);
    if (e.key === 'ArrowLeft') go(idx - 1, true);
  });

  // Pausa autoplay al pasar el mouse
  lb.addEventListener('mouseenter', stopAutoplay);
  lb.addEventListener('mouseleave', startAutoplay);

  // Swipe en mobile
  let touchStartX = 0, touchEndX = 0;
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, {passive:true});
  lb.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const dx = touchEndX - touchStartX;
    if (Math.abs(dx) > 40) { dx > 0 ? go(idx - 1, true) : go(idx + 1, true); }
  }, {passive:true});

  // Abrir desde cada tile
  tiles.forEach(tile => {
    tile.addEventListener('click', (e) => {
      e.preventDefault();
      const imgs = parseImages(tile);
      if (!imgs.length) return;
      const label = tile.querySelector('.tag')?.textContent?.trim() || '';
      open(tile, imgs, label);

      // focus-trap básico para accesibilidad
      lb.setAttribute('tabindex', '-1');
      lb.focus();
    });
  });
})();

