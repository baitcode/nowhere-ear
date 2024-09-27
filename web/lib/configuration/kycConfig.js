import {NUMBER_OF_LEDS} from './constants'

export const kycConfig = {
  portUsed: {
    mac: "/dev/tty.usbmodem1101",
    pi: "/dev/ttyACM0",
  },
  "baudRate": 57600,
  "sensorCount": 5,
  sensors: [
    {
      "name": "1",
      "stick": "1",
      "numberOfLEDs": NUMBER_OF_LEDS,
      "position": 0
    },
    {
      "name": "2",
      "stick": "2",
      "numberOfLEDs": NUMBER_OF_LEDS,
      "position": 0
    },
    {
      "name": "3",
      "stick": "3",
      "numberOfLEDs": NUMBER_OF_LEDS,
      "position": 0
    },
    {
      "name": "4",
      "stick": "4",
      "numberOfLEDs": NUMBER_OF_LEDS,
      "position": 0
    },
    {
      "name": "5",
      "stick": "5",
      "numberOfLEDs": NUMBER_OF_LEDS,
      "position": 0
    }
  ]
}
