/**
 * Data Loading System
 *
 * Centralized data management - loads content from JSON files
 *
 * Dependencies: None
 * Exports: DataLoader class, dataLoader instance
 */

class DataLoader {
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
        this.loaded = false;
        this.loadPromise = null;
        this.projectIndex = new Map();
        this.cacheVersion = Date.now().toString(36);

        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const isFilePath = !window.location.pathname.endsWith('/');
        const directoryDepth = Math.max(0, pathSegments.length - (isFilePath ? 1 : 0));
        this.basePath = directoryDepth > 0
            ? `${'../'.repeat(directoryDepth)}data/`
            : 'data/';
    }

    async fetchJSON(path) {
        try {
            const separator = path.includes('?') ? '&' : '?';
            const response = await fetch(`${path}${separator}v=${this.cacheVersion}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${path}:`, error);
            return null;
        }
    }

    async loadAll() {
        if (this.loadPromise) return this.loadPromise;

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
            this.buildProjectIndex();
            return this.data;
        });

        return this.loadPromise;
    }

    buildProjectIndex() {
        this.projectIndex.clear();
        for (const project of this.data.projects || []) {
            if (project.id && !this.projectIndex.has(project.id)) {
                this.projectIndex.set(project.id, project);
            }
            if (project.url && !this.projectIndex.has(project.url)) {
                this.projectIndex.set(project.url, project);
            }
        }
    }

    async loadCaseStudy(caseStudyId) {
        const path = `${this.basePath}case-studies/${caseStudyId}.json`;
        this.data.caseStudy = await this.fetchJSON(path);
        return this.data.caseStudy;
    }

    getProjects() {
        return this.data.projects || [];
    }

    getProject(identifier) {
        return this.projectIndex.get(identifier) ||
            this.getProjects().find(project => project.id === identifier || project.url === identifier);
    }

    getAdjacentProjects(identifier) {
        const projects = this.getProjects();
        const currentIndex = projects.findIndex(project => project.id === identifier || project.url === identifier);
        if (currentIndex === -1) {
            return { prev: null, next: null };
        }

        return {
            prev: projects[(currentIndex - 1 + projects.length) % projects.length],
            next: projects[(currentIndex + 1) % projects.length]
        };
    }

    getPerson() {
        return this.data.person;
    }

    getExperience() {
        return this.data.experience;
    }

    getSkills() {
        return this.data.skills;
    }

    getAccolades() {
        return this.data.accolades;
    }

    getBrands() {
        return this.data.brands;
    }

    getAboutCarousel() {
        return this.data.aboutCarousel;
    }

    getCaseStudy() {
        return this.data.caseStudy;
    }
}

const dataLoader = new DataLoader();