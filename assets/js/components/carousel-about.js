/**
 * About Carousel System
 *
 * Auto-rotating about section carousel.
 * Dependencies: components/carousel-base.js (CarouselDrag)
 */

'use strict';

const DEFAULT_INTERVAL = 8000;
const USER_INTERVAL = 12000;
const INTERSECTION_THRESHOLD = 0.3;

let currentSlide = 0;
let totalSlides = 4;
let autoRotateInterval = null;

function startAutoRotate(interval = DEFAULT_INTERVAL) {
  if (!autoRotateInterval) {
    autoRotateInterval = setInterval(nextSlide, interval);
  }
}

function stopAutoRotate() {
  if (autoRotateInterval) {
    clearInterval(autoRotateInterval);
    autoRotateInterval = null;
  }
}

function getAboutSection() {
  return document.getElementById('about');
}

function getCarouselContainer() {
  return document.querySelector('.carousel-container');
}

function isAboutSectionInView() {
  const section = getAboutSection();
  if (!section) return false;

  const rect = section.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function updateIndicators(slideIndex) {
  document.querySelectorAll('.indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === slideIndex);
  });
}

function goToSlide(slideIndex, userTriggered = false) {
  currentSlide = slideIndex;

  const track = document.getElementById('aboutCarouselTrack');
  if (track) {
    if (userTriggered) {
      track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    track.setAttribute('data-position', slideIndex);
  }

  updateIndicators(slideIndex);

  window.aboutCarouselDrag?.updateCurrentSlide(slideIndex);

  if (userTriggered) {
    stopAutoRotate();
    startAutoRotate(USER_INTERVAL);
  }
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % totalSlides;
  goToSlide(currentSlide);
}

function resumeIfNotHovering() {
  setTimeout(() => {
    const container = getCarouselContainer();
    if (container && !container.matches(':hover')) {
      startAutoRotate();
    }
  }, 100);
}

function initCarousel() {
  goToSlide(0);

  const container = getCarouselContainer();
  if (container) {
    window.aboutCarouselDrag = new CarouselDrag(container, {
      goToSlide: (slideIndex) => goToSlide(slideIndex, true),
      threshold: 50,
      sensitivity: 1.0
    });

    container.addEventListener('mouseenter', stopAutoRotate);
    container.addEventListener('mouseleave', startAutoRotate);

    container.addEventListener('mousedown', stopAutoRotate);
    container.addEventListener('touchstart', stopAutoRotate);

    container.addEventListener('mouseup', resumeIfNotHovering);
    container.addEventListener('touchend', resumeIfNotHovering);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoRotate();
      return;
    }

    const container = getCarouselContainer();
    const isHovering = container ? container.matches(':hover') : false;

    if (isAboutSectionInView() && !isHovering) {
      startAutoRotate();
    }
  });

  const aboutSection = getAboutSection();
  if (aboutSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startAutoRotate();
        } else {
          stopAutoRotate();
        }
      });
    }, { threshold: INTERSECTION_THRESHOLD });

    observer.observe(aboutSection);
  }
}