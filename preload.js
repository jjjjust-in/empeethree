const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig:      ()                    => ipcRenderer.invoke('get-config'),
  setRootFolder:  ()                    => ipcRenderer.invoke('set-root-folder'),
  buildIndex:     (rootPath)            => ipcRenderer.invoke('build-index', rootPath),
  search:         (index, query)        => ipcRenderer.invoke('search', { index, query }),
  openFiles:      ()                    => ipcRenderer.invoke('open-files'),
  windowMinimize: ()                    => ipcRenderer.send('window-minimize'),
  windowMaximize: ()                    => ipcRenderer.send('window-maximize'),
  windowClose:    ()                    => ipcRenderer.send('window-close'),
  isGifMode:      ()                    => ipcRenderer.invoke('is-gif-mode'),
  startGifCapture:()                    => ipcRenderer.invoke('start-gif-capture'),
});
