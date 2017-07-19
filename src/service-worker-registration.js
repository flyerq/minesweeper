/*!
 * PWA - ServiceWorker 注册模块
 */

// 检查应用是否运行在应用环境中(Electron)
const isApp = () => {
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  if (typeof process !== 'undefined' && process.versions && !!process.versions.electron) {
    return true;
  }

  return false;
};

if (!isApp() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('minesweeper-service-worker.js').then(function(reg) {
    reg.onupdatefound = function() {
      var installingWorker = reg.installing;

      installingWorker.onstatechange = function() {
        switch (installingWorker.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              console.log('New or updated content is available.');
            } else {
              console.log('Content is now available offline!');
            }
            break;

          case 'redundant':
            console.error('The installing service worker became redundant.');
            break;
        }
      };
    };
  }).catch(function(e) {
    console.error('Error during service worker registration:', e);
  });
}