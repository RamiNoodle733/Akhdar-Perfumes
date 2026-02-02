/**
 * 3D Logo Section - Shopify Native Implementation
 * Uses HTML model-viewer element for maximum compatibility and reliability
 */

/**
 * Load model-viewer library from Google CDN
 * @returns {Promise<void>}
 */
function loadModelViewer() {
  return new Promise(function(resolve, reject) {
    if (window.customElements && window.customElements.get('model-viewer')) {
      resolve(undefined);
      return;
    }

    var script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    script.onload = function() { resolve(undefined); };
    script.onerror = function() { reject(new Error('Failed to load model-viewer')); };
    document.head.appendChild(script);
  });
}

/**
 * Initialize all model viewers on the page
 */
function initModelViewers() {
  var viewers = document.querySelectorAll('.logo-3d-viewer[data-glb-url]:not(.initialized)');
  
  for (var i = 0; i < viewers.length; i++) {
    var container = viewers[i];
    
    // Type guard to ensure container exists and is an Element
    if (!container || !(container instanceof Element)) {
      continue;
    }
    
    try {
      var glbUrl = container.getAttribute('data-glb-url');
      var autoRotate = container.getAttribute('data-auto-rotate') === 'true';
      var enableZoom = container.getAttribute('data-enable-zoom') !== 'false';
      var backgroundColor = container.getAttribute('data-background-color') || '#ffffff';
      
      if (!glbUrl) {
        showModelError(container, 'No GLB file URL provided');
        continue;
      }
      
      // Clear loading content
      container.innerHTML = '';
      
      // Create model-viewer element
      var modelViewer = document.createElement('model-viewer');
      modelViewer.setAttribute('src', glbUrl);
      modelViewer.setAttribute('alt', 'Interactive 3D Logo');
      modelViewer.setAttribute('camera-controls', '');
      modelViewer.setAttribute('touch-action', 'manipulation');
      modelViewer.setAttribute('loading', 'eager');
      modelViewer.setAttribute('reveal', 'auto');
      
      // Style the model viewer
      modelViewer.style.width = '100%';
      modelViewer.style.height = '100%';
      modelViewer.style.backgroundColor = backgroundColor;
      modelViewer.style.borderRadius = 'inherit';
      
      if (autoRotate) {
        modelViewer.setAttribute('auto-rotate', '');
        modelViewer.setAttribute('auto-rotate-delay', '0');
        modelViewer.setAttribute('rotation-per-second', '30deg');
      }
      
      if (!enableZoom) {
        modelViewer.setAttribute('disable-zoom', '');
      }
      
      // Add environment and shadow
      modelViewer.setAttribute('shadow-intensity', '1');
      modelViewer.setAttribute('environment-image', 'neutral');
      modelViewer.setAttribute('exposure', '1');
      
      // Add loading poster
      var poster = document.createElement('div');
      poster.slot = 'poster';
      poster.innerHTML = createLoadingHTML();
      modelViewer.appendChild(poster);
      
      // Add progress bar
      var progressBar = document.createElement('div');
      progressBar.slot = 'progress-bar';
      progressBar.innerHTML = createProgressBarHTML();
      modelViewer.appendChild(progressBar);
      
      container.appendChild(modelViewer);
      
      // Setup event listeners
      setupModelEventListeners(container, modelViewer);
      
      // Setup controls
      setupModelControls(container, modelViewer);
      
      container.classList.add('initialized');
      
    } catch (error) {
      console.error('Error initializing model viewer:', error);
      showModelError(container, 'Failed to initialize 3D viewer');
    }
  }
}

function createLoadingHTML() {
  return [
    '<div style="',
      'display: flex;',
      'align-items: center;',
      'justify-content: center;',
      'flex-direction: column;',
      'height: 100%;',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
      'color: white;',
      'font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
      'border-radius: inherit;',
    '">',
      '<div class="loading-spinner" style="',
        'width: 50px;',
        'height: 50px;',
        'border: 3px solid rgba(255,255,255,0.3);',
        'border-top: 3px solid white;',
        'border-radius: 50%;',
        'animation: spin 1s linear infinite;',
        'margin-bottom: 20px;',
      '"></div>',
      '<p style="margin: 0; font-size: 16px; font-weight: 500; text-align: center;">',
        'Loading 3D Logo...',
      '</p>',
      '<p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.8; text-align: center;">',
        'This may take a moment',
      '</p>',
    '</div>',
    '<style>',
      '@keyframes spin {',
        '0% { transform: rotate(0deg); }',
        '100% { transform: rotate(360deg); }',
      '}',
    '</style>'
  ].join('');
}

function createProgressBarHTML() {
  return [
    '<div style="',
      'position: absolute;',
      'bottom: 20px;',
      'left: 50%;',
      'transform: translateX(-50%);',
      'width: 200px;',
      'height: 4px;',
      'background: rgba(255,255,255,0.3);',
      'border-radius: 2px;',
      'overflow: hidden;',
    '">',
      '<div style="',
        'height: 100%;',
        'background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);',
        'border-radius: 2px;',
        'width: 0%;',
        'transition: width 0.3s ease;',
      '"></div>',
    '</div>'
  ].join('');
}

/**
 * Setup event listeners for model viewer
 * @param {Element} container - The container element
 * @param {Element} modelViewer - The model-viewer element
 */
function setupModelEventListeners(container, modelViewer) {
  // Loading events
  modelViewer.addEventListener('load', function() {
    console.log('3D model loaded successfully');
    container.classList.add('loaded');
  });

  modelViewer.addEventListener('error', function(event) {
    var customEvent = /** @type {any} */ (event);
    console.error('Model loading failed:', customEvent.detail || event);
    showModelError(container, 'Failed to load 3D model. Please check the GLB file.');
  });

  // Progress tracking
  modelViewer.addEventListener('progress', function(event) {
    var customEvent = /** @type {any} */ (event);
    var progress = customEvent.detail.totalProgress * 100;
    var progressBar = modelViewer.querySelector('[slot="progress-bar"] > div > div');
    if (progressBar && progressBar instanceof HTMLElement) {
      progressBar.style.width = progress + '%';
    }
  });

  // Camera change events
  modelViewer.addEventListener('camera-change', function() {
    console.log('Camera position changed');
  });
}

/**
 * Setup control buttons for model viewer
 * @param {Element} container - The container element
 * @param {Element} modelViewer - The model-viewer element
 */
function setupModelControls(container, modelViewer) {
  var containerId = container.id;
  var sectionId = containerId ? containerId.split('-').pop() : '';
  
  // Reset camera button
  var resetButton = document.getElementById('reset-camera-' + sectionId);
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      var mvElement = /** @type {any} */ (modelViewer);
      if (mvElement.resetTurntableRotation) {
        mvElement.resetTurntableRotation();
      }
      if (mvElement.jumpCameraToGoal) {
        mvElement.jumpCameraToGoal();
      }
      console.log('Camera reset');
    });
  }
  
  // Toggle rotation button
  var toggleButton = document.getElementById('toggle-rotation-' + sectionId);
  if (toggleButton) {
    var isRotating = modelViewer.hasAttribute('auto-rotate');
    
    function updateButtonText() {
      if (toggleButton && toggleButton.textContent !== null) {
        toggleButton.textContent = isRotating ? 'Pause Rotation' : 'Resume Rotation';
      }
    }
    
    updateButtonText();
    
    toggleButton.addEventListener('click', function() {
      isRotating = !isRotating;
      
      if (isRotating) {
        modelViewer.setAttribute('auto-rotate', '');
      } else {
        modelViewer.removeAttribute('auto-rotate');
      }
      
      updateButtonText();
      console.log('Auto-rotation ' + (isRotating ? 'enabled' : 'disabled'));
    });
  }
}

/**
 * Show error message in container
 * @param {Element} container - The container element
 * @param {string} message - The error message to display
 */
function showModelError(container, message) {
  container.innerHTML = [
    '<div style="',
      'display: flex;',
      'align-items: center;',
      'justify-content: center;',
      'flex-direction: column;',
      'height: 100%;',
      'background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);',
      'color: white;',
      'text-align: center;',
      'padding: 2rem;',
      'border-radius: inherit;',
      'font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;',
    '">',
      '<div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>',
      '<h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">',
        '3D Model Error',
      '</h3>',
      '<p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9; line-height: 1.4;">',
        message,
      '</p>',
      '<button onclick="window.location.reload()" style="',
        'background: rgba(255,255,255,0.2);',
        'border: 1px solid rgba(255,255,255,0.3);',
        'color: white;',
        'padding: 10px 20px;',
        'border-radius: 5px;',
        'cursor: pointer;',
        'font-size: 13px;',
        'transition: background 0.3s ease;',
      '">',
        '🔄 Retry',
      '</button>',
    '</div>'
  ].join('');
  container.classList.add('initialized', 'error');
}

// Initialize when DOM is ready
function init3DViewers() {
  loadModelViewer()
    .then(function() {
      console.log('Model-viewer library loaded successfully');
      initModelViewers();
    })
    .catch(function(error) {
      console.error('Failed to load model-viewer library:', error);
      
      // Fallback for all viewers
      var viewers = document.querySelectorAll('.logo-3d-viewer[data-glb-url]:not(.initialized)');
      for (var i = 0; i < viewers.length; i++) {
        var viewer = viewers[i];
        if (viewer instanceof Element) {
          showModelError(viewer, 'Failed to load 3D viewer library. Please refresh the page.');
        }
      }
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3DViewers);
} else {
  init3DViewers();
}

// Handle Shopify theme editor section reloading
document.addEventListener('shopify:section:load', function(event) {
  var target = event.target;
  if (target && target instanceof Element && target.querySelector && target.querySelector('.logo-3d-viewer')) {
    setTimeout(function() {
      init3DViewers();
    }, 100);
  }
});

// Handle section unloading
document.addEventListener('shopify:section:unload', function(event) {
  var target = event.target;
  if (target && target instanceof Element && target.querySelectorAll) {
    var viewers = target.querySelectorAll('.logo-3d-viewer.initialized');
    for (var i = 0; i < viewers.length; i++) {
      var viewer = viewers[i];
      if (viewer && viewer.classList) {
        viewer.classList.remove('initialized', 'loaded');
      }
    }
  }
});

