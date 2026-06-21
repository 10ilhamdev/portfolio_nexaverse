/* JavaScript Document

TemplateMo 603 Nexaverse

https://templatemo.com/tm-603-nexaverse

*/

// Loading Screen
window.addEventListener('load', () => {
   setTimeout(() => {
      document.getElementById('loadingScreen').classList.add('hidden');
   }, 1000);
});

// Menu Item Click Handler
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');
const menuGrid = document.getElementById('menuGrid');
const mainHeader = document.getElementById('mainHeader');
const mainFooter = document.getElementById('mainFooter');
let isTransitioning = false;

menuItems.forEach(item => {
   item.addEventListener('click', () => {
      if (isTransitioning) return;

      const sectionId = item.dataset.section;
      showSection(sectionId);
   });
});

function showSection(sectionId) {
   isTransitioning = true;

   // First, ensure all menu items are in visible state before transitioning
   menuItems.forEach((item) => {
      // Remove initial-load class
      item.classList.remove('initial-load');

      // Set to visible state explicitly
      item.style.opacity = '1';
      item.style.transform = 'translateY(0) scale(1)';
      item.style.animation = 'none';
   });

   // Force reflow to apply the visible state
   void menuGrid.offsetWidth;

   // Now apply staggered fade out transition
   menuItems.forEach((item, index) => {
      setTimeout(() => {
         item.style.transition = 'all 0.4s ease-out';
         item.style.opacity = '0';
         item.style.transform = 'translateY(40px) scale(0.9)';
      }, index * 50);
   });

   // Hide header and footer
   mainHeader.style.animation = 'none';
   mainHeader.style.opacity = '1';
   mainFooter.style.animation = 'none';
   mainFooter.style.opacity = '1';

   void mainHeader.offsetWidth;

   mainHeader.style.transition = 'opacity 0.4s ease';
   mainHeader.style.opacity = '0';
   mainFooter.style.transition = 'opacity 0.4s ease';
   mainFooter.style.opacity = '0';

   // Show content section after menu animation
   setTimeout(() => {
      menuGrid.style.display = 'none';
      mainHeader.style.display = 'none';
      mainFooter.style.display = 'none';

      // Reset menu item styles for next time
      menuItems.forEach(item => {
         item.style.transition = '';
         item.style.opacity = '';
         item.style.transform = '';
         item.classList.remove('exit-up', 'visible');
      });

      const section = document.getElementById(sectionId);
      section.classList.add('active');

      // Animate stats if introduction section
      if (sectionId === 'introduction') {
         setTimeout(animateStats, 500);
      }

      isTransitioning = false;
   }, 550);
}

function backToMenu() {
   if (isTransitioning) return;
   isTransitioning = true;

   const activeSection = document.querySelector('.content-section.active');
   if (activeSection) {
      // Get fixed elements that need to fade out
      const sectionHeaderSmall = activeSection.querySelector('.section-header-small');
      const backBtn = activeSection.querySelector('.back-btn');

      // Step 1: Cancel the forwards animation so we can control opacity
      activeSection.style.animation = 'none';
      activeSection.style.opacity = '1'; // Reset to visible state first

      // Force reflow to apply the animation cancel
      void activeSection.offsetWidth;

      // Step 2: Now apply fade out transition to ALL elements
      activeSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      activeSection.style.opacity = '0';
      activeSection.style.transform = 'translateY(-20px)';

      if (sectionHeaderSmall) {
         sectionHeaderSmall.style.transition = 'opacity 0.5s ease';
         sectionHeaderSmall.style.opacity = '0';
      }
      if (backBtn) {
         backBtn.style.transition = 'opacity 0.5s ease';
         backBtn.style.opacity = '0';
      }

      // Step 3: Wait for complete fade out
      setTimeout(() => {
         // Hide section completely
         activeSection.classList.remove('active');
         activeSection.style.animation = '';
         activeSection.style.opacity = '';
         activeSection.style.transform = '';
         activeSection.style.transition = '';

         if (sectionHeaderSmall) {
            sectionHeaderSmall.style.opacity = '';
            sectionHeaderSmall.style.transition = '';
         }
         if (backBtn) {
            backBtn.style.opacity = '';
            backBtn.style.transition = '';
         }

         // Step 4: Prepare menu elements (hidden initially)
         menuGrid.style.display = 'grid';
         mainHeader.style.display = 'block';
         mainFooter.style.display = 'block';

         // Cancel CSS animations to prevent re-triggering
         mainHeader.style.animation = 'none';
         mainFooter.style.animation = 'none';

         mainHeader.style.opacity = '0';
         mainHeader.style.transform = 'translateY(20px)';
         mainFooter.style.opacity = '0';

         menuItems.forEach(item => {
            item.classList.remove('exit-up', 'initial-load', 'return', 'visible');
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px) scale(0.9)';
         });

         // Step 5: Brief pause then fade in menu
         setTimeout(() => {
            // Fade in header
            mainHeader.style.transition = 'all 0.5s ease';
            mainHeader.style.opacity = '1';
            mainHeader.style.transform = 'translateY(0)';

            // Fade in footer
            mainFooter.style.transition = 'all 0.5s ease';
            mainFooter.style.opacity = '1';

            // Staggered fade in for menu items
            menuItems.forEach((item, index) => {
               setTimeout(() => {
                  item.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                  item.style.opacity = '1';
                  item.style.transform = 'translateY(0) scale(1)';
               }, index * 80);
            });

            // Step 6: Clean up after all animations complete
            setTimeout(() => {
               mainHeader.style.transition = '';
               mainHeader.style.transform = '';
               mainFooter.style.transition = '';

               menuItems.forEach(item => {
                  item.style.transition = '';
                  item.style.opacity = '';
                  item.style.transform = '';
                  item.classList.add('visible');
               });

               isTransitioning = false;
            }, 600);
         }, 150);
      }, 550);
   }
}

// Animate Stats
function animateStats() {
   const metricValues = document.querySelectorAll('.metric-value[data-target]');
   metricValues.forEach((el, index) => {
      setTimeout(() => {
         const target = parseInt(el.dataset.target);
         let current = 0;
         const increment = target / 40;
         const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
               current = target;
               clearInterval(timer);
            }
            el.textContent = Math.floor(current);
         }, 30);
      }, index * 200);
   });
}

// Tab Switching
function switchTab(btn, tabId) {
   document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
   btn.classList.add('active');

   document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
   document.getElementById(tabId).classList.add('active');
}

// Gallery Filter
function filterGallery(category, btn) {
   document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
   btn.classList.add('active');

   const items = document.querySelectorAll('.gallery-item');
   items.forEach(item => {
      if (category === 'all' || item.dataset.category === category) {
         item.style.display = 'block';
         item.style.animation = 'tabFade 0.4s ease-out';
      } else {
         item.style.display = 'none';
      }
   });
}

// Certificate Modal Functions
let currentModalImages = [];
let currentModalIndex = 0;
let currentModalTitle = '';
let currentModalSubtitle = '';

function openCertificateModal(element) {
   const imagesData = element.dataset.images;
   const title = element.querySelector('.gallery-overlay h4').textContent;
   const subtitle = element.querySelector('.gallery-overlay p').textContent;
   
   try {
      currentModalImages = JSON.parse(imagesData);
      currentModalTitle = title;
      currentModalSubtitle = subtitle;
      currentModalIndex = 0;
      
      const modal = document.getElementById('certificateModal');
      const modalTitle = document.getElementById('modalTitle');
      const modalSubtitle = document.getElementById('modalSubtitle');
      
      modalTitle.textContent = title;
      modalSubtitle.textContent = subtitle;
      
      updateModalImage();
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
   } catch (error) {
      console.error('Error opening modal:', error);
   }
}

function closeCertificateModal() {
   const modal = document.getElementById('certificateModal');
   modal.classList.remove('active');
   document.body.style.overflow = '';
   currentModalImages = [];
   currentModalIndex = 0;
}

function nextModalImage() {
   if (currentModalIndex < currentModalImages.length - 1) {
      currentModalIndex++;
      updateModalImage();
   }
}

function prevModalImage() {
   if (currentModalIndex > 0) {
      currentModalIndex--;
      updateModalImage();
   }
}

function updateModalImage() {
   const modalImage = document.getElementById('modalImage');
   const modalPagination = document.getElementById('modalPagination');
   const prevBtn = document.querySelector('.modal-prev');
   const nextBtn = document.querySelector('.modal-next');
   
   // Update image
   modalImage.src = currentModalImages[currentModalIndex];
   modalImage.alt = `${currentModalTitle} - Image ${currentModalIndex + 1}`;
   
   // Update navigation buttons visibility
   if (currentModalImages.length > 1) {
      prevBtn.classList.add('active');
      nextBtn.classList.add('active');
      
      // Disable buttons at boundaries
      prevBtn.style.opacity = currentModalIndex === 0 ? '0.3' : '1';
      prevBtn.style.cursor = currentModalIndex === 0 ? 'not-allowed' : 'pointer';
      nextBtn.style.opacity = currentModalIndex === currentModalImages.length - 1 ? '0.3' : '1';
      nextBtn.style.cursor = currentModalIndex === currentModalImages.length - 1 ? 'not-allowed' : 'pointer';
   } else {
      prevBtn.classList.remove('active');
      nextBtn.classList.remove('active');
   }
   
   // Update pagination
   modalPagination.innerHTML = '';
   if (currentModalImages.length > 1) {
      currentModalImages.forEach((_, index) => {
         const dot = document.createElement('div');
         dot.className = 'pagination-dot' + (index === currentModalIndex ? ' active' : '');
         dot.onclick = () => {
            currentModalIndex = index;
            updateModalImage();
         };
         modalPagination.appendChild(dot);
      });
   }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
   const modal = document.getElementById('certificateModal');
   if (modal && modal.classList.contains('active')) {
      if (e.key === 'Escape') {
         closeCertificateModal();
      } else if (e.key === 'ArrowLeft') {
         prevModalImage();
      } else if (e.key === 'ArrowRight') {
         nextModalImage();
      }
   }
});

/* ==========================================================================
   INTERACTIVE CANVAS PARTICLE SYSTEM
   ========================================================================== */
let globalReinitParticles = null;

function initCanvasParticles() {
   const canvas = document.getElementById('particles-canvas');
   if (!canvas) return;
   const ctx = canvas.getContext('2d');
   let particlesArray = [];
   let mouse = {
      x: null,
      y: null,
      radius: 120
   };

   function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
   }
   window.addEventListener('resize', resizeCanvas);
   resizeCanvas();

   window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
   });

   window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
   });

   class Particle {
      constructor(x, y, directionX, directionY, size, color) {
         this.x = x;
         this.y = y;
         this.directionX = directionX;
         this.directionY = directionY;
         this.size = size;
         this.color = color;
         this.isRing = Math.random() > 0.5; // Used for Light Mode blueprint rings
      }

      draw() {
         const isLight = document.body.classList.contains('light-mode');
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
         
         if (isLight) {
            if (this.isRing) {
               ctx.strokeStyle = this.color;
               ctx.lineWidth = 1.0;
               ctx.stroke();
            } else {
               ctx.fillStyle = this.color;
               ctx.fill();
            }
         } else {
            ctx.fillStyle = this.color;
            ctx.fill();
         }
      }

      update() {
         if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
         }
         if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
         }

         if (mouse.x !== null && mouse.y !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
               const force = (mouse.radius - distance) / mouse.radius;
               this.x -= dx / distance * force * 2;
               this.y -= dy / distance * force * 2;
            }
         }

         this.x += this.directionX;
         this.y += this.directionY;
         this.draw();
      }
   }

   function initParticles() {
      particlesArray = [];
      const isLight = document.body.classList.contains('light-mode');
      
      if (isLight) {
         // Light Mode: Soft blueprint circles & floating rings
         let numberOfParticles = Math.min((canvas.width * canvas.height) / 8000, 50);
         for (let i = 0; i < numberOfParticles; i++) {
            let size = Math.random() * 12 + 6;
            let x = Math.random() * (canvas.width - size * 2) + size;
            let y = Math.random() * (canvas.height - size * 2) + size;
            let directionX = (Math.random() * 0.15) - 0.075;
            let directionY = (Math.random() * 0.15) - 0.075;
            let color = Math.random() > 0.5 ? 'rgba(30, 58, 138, 0.12)' : 'rgba(0, 119, 182, 0.10)';
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
         }
      } else {
         // Dark Mode: Sharp constellation nodes
         let numberOfParticles = Math.min((canvas.width * canvas.height) / 8000, 120);
         for (let i = 0; i < numberOfParticles; i++) {
            let size = Math.random() * 2 + 1;
            let x = Math.random() * (canvas.width - size * 2) + size;
            let y = Math.random() * (canvas.height - size * 2) + size;
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            let color = Math.random() > 0.5 ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 0, 212, 0.6)';
            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
         }
      }
   }

   function connect() {
      const isLight = document.body.classList.contains('light-mode');
      if (isLight) return; // No connections in Light Mode

      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
         for (let b = a; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
               opacityValue = 1 - (distance / 120);
               ctx.strokeStyle = `rgba(0, 240, 255, ${opacityValue * 0.25})`;
               ctx.lineWidth = 1.0;
               ctx.beginPath();
               ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
               ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
               ctx.stroke();
            }
         }
      }
   }

   function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
         particlesArray[i].update();
      }
      connect();
      requestAnimationFrame(animateParticles);
   }

   globalReinitParticles = initParticles;
   initParticles();
   animateParticles();
   window.addEventListener('resize', initParticles);
}

/* ==========================================================================
   3D TILT EFFECT
   ========================================================================== */
function init3DTilt() {
   const tiltElements = document.querySelectorAll('.menu-item, .glass-card');
   tiltElements.forEach(card => {
      card.addEventListener('mousemove', (e) => {
         const rect = card.getBoundingClientRect();
         const x = e.clientX - rect.left;
         const y = e.clientY - rect.top;
         const xc = rect.width / 2;
         const yc = rect.height / 2;
         const dx = x - xc;
         const dy = y - yc;
         
         const maxRot = 12; // Degrees
         const rx = -(dy / yc) * maxRot;
         const ry = (dx / xc) * maxRot;

         card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out, background 0.2s ease-out';
         card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04, 1.04, 1.04)`;
      });

      card.addEventListener('mouseleave', () => {
         card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s ease, background 0.5s ease';
         card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
   });
}

function init3DGridTilt() {
   const gridOverlay = document.querySelector('.grid-overlay');
   if (!gridOverlay) return;
   
   window.addEventListener('mousemove', (e) => {
      // Calculate normalized mouse coordinates (-1 to 1)
      const xAxis = (window.innerWidth / 2 - e.clientX) / (window.innerWidth / 2);
      const yAxis = (window.innerHeight / 2 - e.clientY) / (window.innerHeight / 2);
      
      // Limit tilt angles for a subtle, professional effect
      const tiltX = 60 + yAxis * 2.5; // rotateX defaults to 60deg
      const tiltY = xAxis * 3;       // rotateY defaults to 0deg
      
      gridOverlay.style.transform = `perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-20%) translateZ(0)`;
   });
}

/* ==========================================================================
   TRANSLATION SYSTEM (ID/EN)
   ========================================================================== */
const translations = {
   en: {
      control_theme_dark: "DARK",
      control_theme_light: "LIGHT",
      brand_sub: "Informatics Engineering",
      menu_intro_badge: "IN",
      menu_intro: "Introduction",
      menu_proj_badge: "PR",
      menu_projects: "Projects",
      menu_certs_badge: "CE",
      menu_certs: "Certificates",
      menu_contact_badge: "CO",
      menu_contact: "Contact",
      btn_back: "← Back to Menu",
      intro_headline: "Self<br><span>Introduction</span>",
      intro_desc: "I am a Web Developer with experience in Website development",
      btn_exp: "Experience",
      btn_edu: "Education",
      badge_consistent: "Consistent",
      badge_focused: "Focused",
      exp_title: "Full Stack Developer",
      exp_meta: "Internship (August 2024 - December 2024)",
      exp_company: "National Research and Innovation Agency",
      edu_title: "Diploma in Informatics Engineering",
      edu_meta: "GPA: 3.51",
      edu_school: "State Polytechnic of Cilacap (2022 - 2025)",
      proj_title: "Projects",
      proj_sub: "My Projects",
      proj_simapus_desc: "Desktop-based Clinic Management Information System",
      proj_rawatinap_desc: "Website-based Inpatient Clinic System",
      proj_kuesioner_desc: "Codeigniter Website-based Questionnaire System",
      proj_skincare_desc: "Skincare App Design",
      cert_title: "Portfolio",
      cert_sub: "Explore my certificates",
      filter_all: "All",
      filter_website: "Website",
      filter_ai: "Artificial Intelligence",
      filter_network: "Network",
      filter_db: "Database",
      contact_title: "Contact Me",
      contact_sub: "Let's build something amazing together",
      form_name: "Your Name",
      form_email: "Your Email",
      form_subject: "Subject",
      form_message: "Your Message",
      form_send: "Send Message",
      loc_title: "Location",
      loc_val: "Indonesia"
   },
   id: {
      control_theme_dark: "GELAP",
      control_theme_light: "TERANG",
      brand_sub: "Teknik Informatika",
      menu_intro_badge: "PR",
      menu_intro: "Perkenalan",
      menu_proj_badge: "PY",
      menu_projects: "Proyek",
      menu_certs_badge: "SF",
      menu_certs: "Sertifikat",
      menu_contact_badge: "KT",
      menu_contact: "Kontak",
      btn_back: "← Kembali ke Menu",
      intro_headline: "Perkenalan<br><span>Diri</span>",
      intro_desc: "Saya seorang Web Developer dengan pengalaman dalam pengembangan Website",
      btn_exp: "Pengalaman",
      btn_edu: "Pendidikan",
      badge_consistent: "Konsisten",
      badge_focused: "Fokus",
      exp_title: "Full Stack Developer",
      exp_meta: "Magang (Agustus 2024 - Desember 2024)",
      exp_company: "Badan Riset dan Inovasi Nasional",
      edu_title: "D3 Teknik Informatika",
      edu_meta: "IPK: 3.51",
      edu_school: "Politeknik Negeri Cilacap (2022 - 2025)",
      proj_title: "Proyek",
      proj_sub: "Proyek Saya",
      proj_simapus_desc: "Sistem Informasi Manajemen Puskesmas Berbasis Desktop",
      proj_rawatinap_desc: "Sistem Rawat Inap Berbasis Website",
      proj_kuesioner_desc: "Sistem Informasi Kuesioner Berbasis Website Codeigniter",
      proj_skincare_desc: "Desain Aplikasi Skincare",
      cert_title: "Portofolio",
      cert_sub: "Jelajahi Sertifikat saya",
      filter_all: "Semua",
      filter_website: "Website",
      filter_ai: "Kecerdasan Buatan",
      filter_network: "Jaringan",
      filter_db: "Database",
      contact_title: "Hubungi Saya",
      contact_sub: "Mari kita ciptakan sesuatu yang luar biasa bersama",
      form_name: "Nama Anda",
      form_email: "Email Anda",
      form_subject: "Subjek",
      form_message: "Pesan Anda",
      form_send: "Kirim Pesan",
      loc_title: "Lokasi",
      loc_val: "Indonesia"
   }
};

let currentLang = localStorage.getItem('portfolio-lang') || 'id';

function setLanguage(lang) {
   currentLang = lang;
   localStorage.setItem('portfolio-lang', lang);

   const dict = translations[lang];

   // Translate textContent
   document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      if (dict[key]) {
         if (key === 'intro_headline') {
            el.innerHTML = dict[key];
         } else {
            el.textContent = dict[key];
         }
      }
   });

   // Translate placeholders
   document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.getAttribute('data-translate-placeholder');
      if (dict[key]) {
         el.placeholder = dict[key];
      }
   });

   // Translate theme toggle button text explicitly depending on state
   const isLight = document.body.classList.contains('light-mode');
   const themeBtnText = document.querySelector('#themeToggle .btn-text');
   if (themeBtnText) {
      themeBtnText.textContent = isLight ? dict['control_theme_light'] : dict['control_theme_dark'];
   }

   // Update Lang toggle button text
   const langBtnText = document.querySelector('#langToggle .btn-text');
   if (langBtnText) {
      langBtnText.textContent = lang.toUpperCase();
   }
}

/* ==========================================================================
   THEME SWITCHING SYSTEM (LIGHT/DARK)
   ========================================================================== */
function initThemeSystem() {
   const themeToggleBtn = document.getElementById('themeToggle');
   const langToggleBtn = document.getElementById('langToggle');

   // Set initial theme
   const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
   if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      const icon = themeToggleBtn.querySelector('.btn-icon');
      if (icon) icon.textContent = '☀️';
   }

   // Set initial language
   setLanguage(currentLang);

   // Theme Toggle Click Handler
   if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
         const isLight = document.body.classList.toggle('light-mode');
         localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');

         // Update icon
         const icon = themeToggleBtn.querySelector('.btn-icon');
         if (icon) {
            icon.textContent = isLight ? '☀️' : '🌙';
         }

         // Update button text language label
         const dict = translations[currentLang];
         const themeBtnText = themeToggleBtn.querySelector('.btn-text');
         if (themeBtnText) {
            themeBtnText.textContent = isLight ? dict['control_theme_light'] : dict['control_theme_dark'];
         }

         // Re-init canvas particles for new theme style
         if (globalReinitParticles) {
            globalReinitParticles();
         }
      });
   }

   // Language Toggle Click Handler
   if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
         const targetLang = currentLang === 'id' ? 'en' : 'id';
         setLanguage(targetLang);
      });
   }
}

// Initialize all features on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
   initThemeSystem();
   initCanvasParticles();
   init3DTilt();
   init3DGridTilt();
});