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
    const trimmed = identifier.trim();
    return trimmed.length > 0 ? trimmed : '';
}

function getProject(projectIdOrUrl) {
    const projectId = sanitizeProjectIdentifier(projectIdOrUrl);
    if (!projectId) {
        return null;
    }
    if (typeof dataLoader === 'undefined' || typeof dataLoader.getProject !== 'function') {
        throw new Error('dataLoader dependency is not available');
    }
    return dataLoader.getProject(projectId);
}

function getAdjacentProjects(projectIdOrUrl) {
    const projectId = sanitizeProjectIdentifier(projectIdOrUrl);
    if (!projectId) {
        return null;
    }
    if (typeof dataLoader === 'undefined' || typeof dataLoader.getAdjacentProjects !== 'function') {
        throw new Error('dataLoader dependency is not available');
    }
    return dataLoader.getAdjacentProjects(projectId);
}