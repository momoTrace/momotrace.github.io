/* Lazy-load the Live2D widget so its CDN does not block the desktop. */
(() => {
  'use strict';

  const sources = [
    'https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js',
    'https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js'
  ];
  const options = {
    model: {
      jsonPath: 'https://unpkg.com/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json',
      scale: 1
    },
    display: {
      position: 'right',
      width: 150,
      height: 300,
      hOffset: 0,
      vOffset: -20
    },
    mobile: {
      show: true,
      scale: 0.5
    },
    react: {
      opacityDefault: 0.7,
      opacityOnHover: 0.2
    }
  };

  function loadWidget(sourceIndex = 0) {
    if (sourceIndex >= sources.length) {
      console.warn('Live2D widget could not be loaded from either CDN.');
      return;
    }

    const script = document.createElement('script');
    script.src = sources[sourceIndex];
    script.async = true;
    script.onload = () => {
      if (!window.L2Dwidget?.init) {
        script.remove();
        loadWidget(sourceIndex + 1);
        return;
      }
      try {
        window.L2Dwidget.init(options);
      } catch (error) {
        console.warn('Live2D widget initialization failed.', error);
      }
    };
    script.onerror = () => {
      script.remove();
      loadWidget(sourceIndex + 1);
    };
    document.head.append(script);
  }

  loadWidget();
})();
