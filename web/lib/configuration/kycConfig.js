export const kycConfig = {
  portUsed: {
    mac: "/dev/tty.usbmodem1101",
    pi: "/dev/ttyUSB0",
  },
  "baudRate": 57600,
  "sensorCount": 1,
  sensors: [
    {
      "name": "1",
      "stick": "1",
      "numberOfLEDs": 40,
      "position": 0,
      "baseTension": 0
    },
    {
      "name": "2",
      "stick": "2",
      "numberOfLEDs": 40,
      "position": 0,
      "baseTension": 0
    },
    {
      "name": "3",
      "stick": "3",
      "numberOfLEDs": 40,
      "position": 0,
      "baseTension": 0
    }
  ]
}
