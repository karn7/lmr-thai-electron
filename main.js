const { app, BrowserWindow, Menu, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // ชี้ไปยังเว็บ local ของ Next.js
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  // รัน Next.js server (npm run start) ก่อนเปิด BrowserWindow
  const nextServer = spawn('npm', ['run', 'start'], {
    cwd: path.join(__dirname, 'lmr-thai'),
    shell: true
  });

  nextServer.stdout.on('data', (data) => {
    console.log(`[next.js]: ${data}`);
  });

  nextServer.stderr.on('data', (data) => {
    console.error(`[next.js error]: ${data}`);
  });

  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'อัปเดตพร้อมติดตั้ง',
      message: 'ดาวน์โหลดอัปเดตเสร็จเรียบร้อยแล้ว\n\nคุณต้องการรีสตาร์ทและติดตั้งตอนนี้เลยหรือไม่?',
      buttons: ['รีสตาร์ทเลย', 'ภายหลัง']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  const template = [
    {
      label: 'ช่วยเหลือ',
      submenu: [
        {
          label: 'ตรวจสอบอัปเดต',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'กำลังตรวจสอบอัปเดต...',
              message: 'กำลังตรวจสอบเวอร์ชันใหม่จาก GitHub...'
            });

            autoUpdater.checkForUpdates()
              .then(result => {
                if (result.updateInfo.version !== app.getVersion()) {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'มีอัปเดตใหม่',
                    message: `พบเวอร์ชันใหม่: ${result.updateInfo.version}\n\nกำลังดาวน์โหลดและติดตั้ง...`
                  });
                } else {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'เวอร์ชันล่าสุดแล้ว',
                    message: 'คุณใช้งานเวอร์ชันล่าสุดแล้ว'
                  });
                }
              })
              .catch(err => {
                dialog.showErrorBox('เกิดข้อผิดพลาด', err == null ? "ไม่สามารถตรวจสอบอัปเดตได้" : err.toString());
              });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});