# ERP
Mobile app build with React Native

### Setting up the project

1 - Install React Native CLI and development environment by following the [Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html#content)

2 - Clone the repository


3 - Change the working dir to ERP

4 - Install npm dependencies 
```sh
$ npm install 
``` 
OR 
```sh
$ yarn
``` 

5 - Install Cocoapod dependancies (iOS Only)
Navigate to ios/ directory and run
```sh
$ pod install
``` 

6 - Run the project using following commands


**iOS**
```sh
$ react-native run-ios
``` 

**Android**

Startup a emulator on Genymotion. Check if the emulator is available by running,
```sh
$ adb devices
``` 
Run the app using,
```sh
$ react-native run-android
``` 
