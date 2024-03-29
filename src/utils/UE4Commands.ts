import { invoke } from "@tauri-apps/api/tauri";
import { Command } from "@tauri-apps/api/shell";

const windows = navigator.userAgent.includes('Windows');
let cmd = windows ? 'cmd' : 'sh' ;
let args = windows ? ['/C'] : ['-c'];

const runCommand = (script: any, callback: any) => {
  const command = new Command(cmd, [...args, script])
  command.on('close', data => {
    callback({code: data.code, signal: data.signal});
  })
  command.on('error', error => {
    callback({error: error});
  })
  command.stdout.on('data', line => {
    callback({data: line});
  })
  
  command.stderr.on('data', line => {
    callback({stderr: line});
  }); 

  command.spawn()
    .then(data => {
      callback(data);
    })
    .catch(error => {
       callback(error);
    })
};

export const BuildGraph = (Platform: any[], Path: any, callback: any ) => {
   let UATarguments: string = "";
   for (let i = 0; i < Platform.length; i++) {
     if (Platform != undefined)
     {
        switch (Platform[i].name){
          case "HostOnly": UATarguments += " -Set:HostPlatformOnly=" + Platform[i].value;
          break;
          case "Win64": UATarguments += " -Set:WithWin64=" + Platform[i].value;
          break;
          case "Win32": UATarguments += " -Set:WithWin32=" + Platform[i].value;
          break;
          case "Mac": UATarguments += " -Set:WithMac=" + Platform[i].value;
          break;
          case "Linux": UATarguments += " -Set:WithLinux=" + Platform[i].value;
          break;
          case "Android": UATarguments += " -Set:WithAndroid=" + Platform[i].value;
          break;
          case "IOS": UATarguments += " -Set:WithIOS=" + Platform[i].value;
          break;
          case "TVOS": UATarguments += " -Set:WithTVOS=" + Platform[i].value;
          break;
          case "Switch": UATarguments += " -Set:WithSwitch=" + Platform[i].value;
          break;
          case "PS4": UATarguments += " -Set:WithPS4=" + Platform[i].value;
          break;
          case "Xbox": UATarguments += " -Set:WithXboxOne=" + Platform[i].value;
          break;
          case "Lumin": UATarguments += " -Set:WithLumin=" + Platform[i].value;
          break;
          case "Hololens": UATarguments += " -Set:WithHololens=" + Platform[i].value;
          break;
          default: UATarguments = "";
        }
      }
   }
   Extensions
    .then((extension: any) => {
     Target
       .then((target: any) => {
        let UE4Path = Path;
        let RunUATPath = UE4Path.concat('/Engine/Build/BatchFiles/RunUAT', extension) ;
        let build_target = "".concat( ' BuildGraph -Target="', 'Make Installed Build ', target, '"' ) ;
        let XMLPath =  "".concat(' -script=', UE4Path, '/Engine/Build/InstalledEngineBuild.xml"') ;
        runCommand(RunUATPath + build_target + XMLPath + UATarguments, (output: any) => {
              callback(output)
        })
      })
      .catch((error: any) => {
        callback(error);
      })
    })
    .catch((error: any) => {
        callback(error);
    })
};

export const SetupDependencies = (Path: any, callback: any) => {
  Extensions
    .then(extension => {
      let UE4Path = Path;
      let SetupPath = UE4Path.concat("/Setup", extension);
      runCommand(SetupPath, (output: any) => {
          callback(output);
      })
    })
};

export const KillProcess = (pid: any) => new Promise((resolve, reject) => {
    pid.kill()
         .then(() => {
            resolve("Stopping process");
         })
         .error(reject("An error appear when killing process"));
  });

const Extensions = new Promise<string>((resolve, reject) => {
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

const Target = new Promise<string>((resolve, reject) => {
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