import { invoke } from "@tauri-apps/api/tauri";
import { Command } from "@tauri-apps/api/shell"

let cmd: any;
let args: any;
let child: any;

const runCommand = (arg: any) => new Promise((resolve, reject) => {
  child = null

  const command = new Command(cmd, arg)
  command.on('close', data => {
    child = null
  })
  command.on('error', error => {
    console.log("issue : " + JSON.stringify(error));
   resolve(JSON.stringify(error));
  })
  command.stdout.on('data', line => {
    console.log("data : " + JSON.stringify(line));
    resolve(line);
  })
  
  command.stderr.on('data', line => {
    console.log("error : " + JSON.stringify(line));
    resolve(line)
  }); 

  command.spawn()
    .then(data => {
      //pid
      child = data
    })
    .catch(error => {
       reject(JSON.stringify(error))
    })
});

export const BuildGraph = (Platform: any ) => new Promise((resolve, reject) => {
   let UATarguments: string;
   switch (Platform.name){
     case "HostOnly": UATarguments = " -Set:HostPlatformOnly=" + Platform.value;
     break;
     case "Win64": UATarguments = " -Set:WithWin64=" + Platform.value;
     break;
     case "Win32": UATarguments = " -Set:WithWin32=" + Platform.value;
     break;
     case "Mac": UATarguments = " -Set:WithMac=" + Platform.value;
     break;
     case "Linux": UATarguments = " -Set:WithLinux=" + Platform.value;
     break;
     case "Android": UATarguments = " -Set:WithAndroid=" + Platform.value;
     break;
     case "IOS": UATarguments = " -Set:WithIOS=" + Platform.value;
     break;
     case "TVOS": UATarguments = " -Set:WithTVOS=" + Platform.value;
     break;
     case "Switch": UATarguments = " -Set:WithSwitch=" + Platform.value;
     break;
     case "PS4": UATarguments = " -Set:WithPS4=" + Platform.value;
     break;
     case "Xbox": UATarguments = " -Set:WithXboxOne=" + Platform.value;
     break;
     case "Lumin": UATarguments = " -Set:WithLumin=" + Platform.value;
     break;
     case "Hololens": UATarguments = " -Set:WithHololens=" + Platform.value;
     break;
     default: UATarguments = "";
   }

   Extensions
    .then((extension: any) => {
     Target
      .then((target: any) => {
        let UE4Path = 'F:/UnrealEngine';
        let RunUATPath = UE4Path.concat('/Engine/Build/BatchFiles/RunUAT', extension) ;
        let build_target = "".concat( ' BuildGraph -Target="', 'Make Installed Build ', target, '"' ) ;
        let XMLPath =  "".concat(' -script="', UE4Path, '/Engine/Build/InstalledEngineBuild.xml"') ;
        runCommand(RunUATPath + build_target + XMLPath + UATarguments )
        .then(value => {
          console.log("output : " + JSON.stringify(value));
          resolve(value);
        })
        .catch(error => {
          reject(error);
        })
      })
      .catch(error => {
        reject(error);
      })
    })
    .catch(error => {
        reject(error);
    })
  });

export const SetupDependencies = () => new Promise((resolve, reject) => {
  Extensions
    .then((extension: any) => {
      let UE4Path = 'F:/UnrealEngine';
      let SetupPath = UE4Path.concat("/Setup", extension);
      runCommand(SetupPath)
      .then(value => {
        console.log("Setup : " + value);
        resolve(value);
      })
      .catch(error => {
        reject(error);
      })
    .catch(error => {
      reject(error);
    })
    })
});

export const KillProcess = new Promise((resolve, reject) => {
    child.kill()
         .then(() => {
            resolve("Stopping process");
         })
         .error(reject("An error appear when killing process"));
  });

const Extensions = new Promise((resolve, reject) => {
  invoke("detect_os")
  .then(data => {
    switch (data) {
      case 'windows': resolve('.bat');
      break;
      case 'macos': resolve('.command');
      break;
      case 'linux': resolve('.sh');
      break;
      default: reject("Host not supported");
    }
  }
);
});

const Target = new Promise((resolve, reject) => {
  invoke("detect_os")
  .then(data => {
    switch (data) {
      case 'windows': resolve('Win64');
      break;
      case 'macos': resolve('Mac');
      break;
      case 'linux': resolve('Linux');
      break;
      default: reject("Host not supported");
    }
  });
});