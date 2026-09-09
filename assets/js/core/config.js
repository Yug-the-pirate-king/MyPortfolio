'use strict';

const PROJECT_FEATURED_IMAGES = Object.freeze({
    'ai-strategy': Object.freeze(['ai-1', 'ai-2', 'ai-3']),
    'design-system': Object.freeze([
        'design-system-featured-1',
        'design-system-featured-2',
        'design-system-featured-3',
        'design-system-featured-4',
        'design-system-featured-5',
        'design-system-featured-6',
        'design-system-featured-7'
    ]),
    'product-suite': Object.freeze([
        'product-feature-1',
        'product-feature-2',
        'product-feature-3',
        'product-feature-4'
    ]),
    'research-strategy': Object.freeze(['research-1', 'research-2', 'research-3'])
});

function sanitizeProjectIdentifier(identifier) {
    if (typeof identifier !== 'string') {
        return '';
    }
    return identifier.trim() || '';
}

function requireDataLoader(method) {
    if (typeof dataLoader === 'undefined' || !dataLoader || typeof dataLoader[method] !== 'function') {
        throw new Error('dataLoader dependency is not available');
    }
}

function getProject(projectIdOrUrl) {
    const projectId = sanitizeProjectIdentifier(projectIdOrUrl);
    if (!projectId) {
        return null;
    }
    requireDataLoader('getProject');
    return dataLoader.getProject(projectId);
}

function getAdjacentProjects(projectIdOrUrl) {
    const projectId = sanitizeProjectIdentifier(projectIdOrUrl);
    if (!projectId) {
        return null;
    }
    requireDataLoader('getAdjacentProjects');
    return dataLoader.getAdjacentProjects(projectId);
}