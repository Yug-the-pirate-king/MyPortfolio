/**
 * About Carousel Content Rendering
 *
 * Generates about carousel cards and indicators.
 *
 * Dependencies: core/data-loader.js
 * Exports: initAboutCarousel, initAboutCarouselIndicators
 */

const FIRST_INDEX = 0;

function getCarouselData() {
    if (typeof dataLoader === 'undefined' || !dataLoader || typeof dataLoader.getAboutCarousel !== 'function') {
        console.warn('Carousel renderer: dataLoader.getAboutCarousel is not available.');
        return [];
    }

    try {
        const cards = dataLoader.getAboutCarousel();
        if (!Array.isArray(cards)) {
            console.warn('Carousel renderer: expected an array of carousel cards.');
            return [];
        }
        return cards;
    } catch (error) {
        console.error('Carousel renderer: failed to load carousel data.', error);
        return [];
    }
}

function isFirst(index) {
    return index === FIRST_INDEX;
}

function activeClass(index) {
    return isFirst(index) ? ' active' : '';
}

function normalizeCarouselCard(card) {
    if (!card || typeof card !== 'object') {
        console.warn('Carousel renderer: invalid carousel card entry.', card);
        return { dataCard: '', title: '', description: '' };
    }

    return {
        dataCard: typeof card.dataCard !== 'undefined' ? String(card.dataCard) : '',
        title: typeof card.title !== 'undefined' ? String(card.title) : '',
        description: typeof card.description !== 'undefined' ? String(card.description) : ''
    };
}

function createCarouselCardElement(card, index) {
    const { dataCard, title, description } = normalizeCarouselCard(card);

    const article = document.createElement('article');
    article.className = `about-card project-card project-card-featured${activeClass(index)}`;

    if (dataCard) {
        article.setAttribute('data-card', dataCard);
    }

    const bgImage = document.createElement('div');
    bgImage.className = 'project-bg-image';

    const overlay = document.createElement('div');
    overlay.className = 'project-content-overlay';

    const heading = document.createElement('h3');
    heading.className = 'project-title';
    heading.textContent = title;

    const paragraph = document.createElement('p');
    paragraph.className = 'project-description';
    paragraph.textContent = description;

    overlay.appendChild(heading);
    overlay.appendChild(paragraph);
    article.appendChild(bgImage);
    article.appendChild(overlay);

    return article;
}

function createCarouselIndicatorElement(index) {
    const button = document.createElement('button');
    button.className = `indicator${activeClass(index)}`;
    button.setAttribute('data-slide', String(index));
    button.setAttribute('aria-label', `Go to slide ${index + 1}`);

    if (typeof goToSlide === 'function') {
        button.onclick = function () { goToSlide(index, true); };
    } else {
        console.warn('Carousel renderer: goToSlide is not available; indicator disabled.');
        button.disabled = true;
    }

    return button;
}

function initAboutCarousel() {
    const carouselTrack = document.getElementById('aboutCarouselTrack');
    if (!carouselTrack) return;

    carouselTrack.innerHTML = '';

    const cards = getCarouselData();
    if (cards.length === 0) return;

    const fragment = document.createDocumentFragment();

    cards.forEach((card, index) => {
        fragment.appendChild(createCarouselCardElement(card, index));
    });

    carouselTrack.appendChild(fragment);
    totalSlides = cards.length;
}

function initAboutCarouselIndicators() {
    const indicatorsContainer = document.querySelector('.about-carousel .carousel-indicators');
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

    const cards = getCarouselData();
    if (cards.length === 0) return;

    const fragment = document.createDocumentFragment();

    cards.forEach((card, index) => {
        fragment.appendChild(createCarouselIndicatorElement(index));
    });

    indicatorsContainer.appendChild(fragment);
}