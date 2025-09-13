if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('newEmpIdsw.js')              
    .then(() => { console.log('Service Worker Registered'); });
}
