/**
 * Data Loading System
 *
 * Centralized data management that loads portfolio content from JSON files.
 *
 * Dependencies: None
 * Exports: DataLoader class, dataLoader instance
 */

/**
 * Manages loading and access to portfolio JSON data.
 */
class DataLoader {
    /**
     * Creates a DataLoader instance and auto-detects the JSON base path
     * relative to the current page.
     */
    constructor() {
        this.data = {
            person: null,
            projects: null,
            experience: null,
            skills: null,
            accolades: null,
            brands: null,
            aboutCarousel: null,
            caseStudy: null
        };

        /** @type {boolean} */
        this.loaded = false;

        /** @type {Promise<Object>|null} */
        this.loadPromise = null;

        // Auto-detect base path:
        // Use '../data/' when the current page is in a subdirectory (e.g. /work/project.html),
        // otherwise use 'data/'.
        const segments = window.location.pathname.split('/').filter(Boolean);
        const hasHtmlFile = segments.length > 0 && segments[segments.length - 1].includes('.html');
        this.basePath = (hasHtmlFile && segments.length > 1) ? '../data/' : 'data/';
    }

    /**
     * Fetches and parses a JSON file.
     *
     * @param {string} path - Path to the JSON file.
     * @returns {Promise<Object|null>} Parsed JSON data, or null if the request fails.
     */
    async fetchJSON(path) {
        if (typeof path !== 'string' || !path.trim()) {
            console.error('DataLoader.fetchJSON: invalid path provided:', path);
            return null;
        }

        try {
            const cacheBuster = Date.now();
            const separator = path.includes('?') ? '&' : '?';
            const url = `${path}${separator}v=${cacheBuster}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`DataLoader.fetchJSON: error loading ${path}:`, error);
            return null;
        }
    }

    /**
     * Loads all core portfolio data files in parallel.
     *
     * @returns {Promise<Object>} The loaded data object.
     */
    async loadAll() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = Promise.all([
            this.fetchJSON(`${this.basePath}person.json`),
            this.fetchJSON(`${this.basePath}projects.json`),
            this.fetchJSON(`${this.basePath}experience.json`),
            this.fetchJSON(`${this.basePath}skills.json`),
            this.fetchJSON(`${this.basePath}accolades.json`),
            this.fetchJSON(`${this.basePath}brands.json`),
            this.fetchJSON(`${this.basePath}about-carousel.json`)
        ]).then(([person, projects, experience, skills, accolades, brands, aboutCarousel]) => {
            this.data.person = person;
            this.data.projects = projects?.projects || [];
            this.data.experience = experience?.experience || [];
            this.data.skills = skills?.skillCategories || [];
            this.data.accolades = accolades || { awards: [], features: [] };
            this.data.brands = brands?.brands || [];
            this.data.aboutCarousel = aboutCarousel?.carouselCards || [];
            this.loaded = true;
            return this.data;
        });

        return this.loadPromise;
    }

    /**
     * Loads a case study JSON file by ID.
     *
     * @param {string} caseStudyId - Unique identifier for the case study.
     * @returns {Promise<Object|null>} Case study data, or null on failure.
     */
    async loadCaseStudy(caseStudyId) {
        if (typeof caseStudyId !== 'string' || !caseStudyId.trim()) {
            console.error('DataLoader.loadCaseStudy: invalid caseStudyId provided:', caseStudyId);
            this.data.caseStudy = null;
            return null;
        }

        const normalizedId = caseStudyId.trim();
        const path = `${this.basePath}case-studies/${normalizedId}.json`;
        this.data.caseStudy = await this.fetchJSON(path);
        return this.data.caseStudy;
    }

    /**
     * Returns all loaded projects.
     *
     * @returns {Array} Array of project objects.
     */
    getProjects() {
        return this.data.projects || [];
    }

    /**
     * Finds a project by its ID or URL.
     *
     * @param {string|number} identifier - Project id or url property to match.
     * @returns {Object|undefined} Matching project, or undefined if not found.
     */
    getProject(identifier) {
        if (identifier === undefined || identifier === null) {
            return undefined;
        }

        return this.getProjects().find(project => project.id === identifier || project.url === identifier);
    }

    /**
     * Returns the previous and next projects relative to a given project.
     *
     * @param {string|number} identifier - Project id or url property to match.
     * @returns {{prev: Object|null, next: Object|null}} Adjacent projects.
     */
    getAdjacentProjects(identifier) {
        const projects = this.getProjects();
        const currentIndex = projects.findIndex(project => project.id === identifier || project.url === identifier);

        if (currentIndex === -1) {
            return { prev: null, next: null };
        }

        const length = projects.length;
        const prevIndex = (currentIndex - 1 + length) % length;
        const nextIndex = (currentIndex + 1) % length;

        return {
            prev: projects[prevIndex],
            next: projects[nextIndex]
        };
    }

    /**
     * Returns the loaded person/profile data.
     * @returns {Object|null}
     */
    getPerson() {
        return this.data.person;
    }

    /**
     * Returns the loaded experience entries.
     * @returns {Array}
     */
    getExperience() {
        return this.data.experience || [];
    }

    /**
     * Returns the loaded skill categories.
     * @returns {Array}
     */
    getSkills() {
        return this.data.skills || [];
    }

    /**
     * Returns the loaded accolades.
     * @returns {Object}
     */
    getAccolades() {
        return this.data.accolades || { awards: [], features: [] };
    }

    /**
     * Returns the loaded brand data.
     * @returns {Array}
     */
    getBrands() {
        return this.data.brands || [];
    }

    /**
     * Returns the loaded about carousel cards.
     * @returns {Array}
     */
    getAboutCarousel() {
        return this.data.aboutCarousel || [];
    }

    /**
     * Returns the currently loaded case study.
     * @returns {Object|null}
     */
    getCaseStudy() {
        return this.data.caseStudy;
    }
}

/** Global DataLoader instance. */
const dataLoader = new DataLoader();