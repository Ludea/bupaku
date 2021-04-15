import { invoke } from "@tauri-apps/api/dist/tauri";
import { Command } from "@tauri-apps/api/dist/shell"

let cmd: any;
let args: any;
let extensions: any;
let child: any;

export const BuildGraph = (PlatformType: any) => new Promise((resolve) => {
    resolve(PlatformType);
});

export const SetupDependencies = new Promise((resolve, reject) => {
    invoke("detect_os")
    .then(data => {
      switch (data) {
        case 'windows': 
          cmd = "powershell";
          args = ['/C'];
          extensions = '.bat'
          break;
        case 'macos': 
          cmd = "sh"
          args = ['-c'];
          extensions = '.command'
          break;
        case 'linux': 
          cmd = "sh"
          args = ['-c'];
          extensions = '.sh'
          break;
      }

       //child = null
       const command = new Command(cmd, [...args, "Setup" + extensions])
       command.on('close', data => {
         child = null
       })
       command.on('error', error => {
        resolve(JSON.stringify(error));
       })
       command.stdout.on('data', line => {
        resolve(line);
       })
       
       command.stderr.on('data', line => resolve(line)); 
     
       command.spawn()
         .then(data => {
           child = data
         })
         .catch(error => {
            reject(JSON.stringify(error))
         })
       })
       .catch(data => reject(data));
});

export const KillProcess = new Promise((resolve, reject) => {
    child.kill()
         .then(() => {
            resolve("Stopping process");
         })
         .error(reject("An error appear when killing process"));
  });