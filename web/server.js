/* global console */

import prodModes from './lib/visualisations'
import {
  regroupConfig,
} from './lib/helpers/dataHelpers'
import {spinServer} from './lib/helpers/spinServer'
import {writeToPython} from './lib/helpers/communicateWithPython'
import {calculateRealColumns} from './lib/configuration/realColumnsConfig'
import {easterEgg, isEasterTriggered, easterEggDuration} from './lib/modes/easterEgg'
import {onChangeSpeed, onChange} from './lib/modes/onChange'
import sleep from './lib/modes/sleep'
import {
  wasStretchedHardEnoughToWakeUp
} from './lib/helpers/sleepTracker'

import {serverConfig} from '../modes_config.json'
import {KYCClient} from "./lib/classes/KYCClient";
import {kycConfig} from "./lib/configuration/kycConfig";
// import polzynki from "./lib/modes/polzynki";
// import kyctest from "./lib/modes/kyc/kyctestmode";

console.log({serverConfig})

// Get from config
let {
  modeAutoChangeInterval, // 1000 seconds
  goToSleepAfter // 20 minutes
} = serverConfig

let {useOnChange, useEasterEgg, useSleepMode, isAutoChangingModeEnabled} = serverConfig

const modes = {...prodModes}
modes.sleep = sleep
modes.easterEgg = easterEgg
modes.onChange = onChange

let currentMode
let previousModeKey
let currentModeKey
let currentStructureKey = 'cemetery'
const prodModesKeys = Object.keys(prodModes)
const modesKeys = Object.keys(modes)
let clientSensors = []
let realSensorsData = []
const connectedSockets = {}
const clientConfigurations = {}
let ledsConfig = [] // Needs to be initially an empty array to trigger communication with the arduino

const selectRandomModeKey = (modesKeys) => modesKeys[Math.floor(Math.random() * (modesKeys.length - 1))]
const selectAnotherRandomModeKey = (modesKeys) => modesKeys.filter(modeKey => modeKey !== currentModeKey)[Math.floor(Math.random() * (modesKeys.length - 1))]

//  Assign base data
let isSleeping = false
let noActionsSince = Date.now()
let lastTimeChangedMode = Date.now()
let onChangeStarted
let easterEggTriggeredAt
let isEaster = false
let isOnChange = false

const onChangeDuration = onChangeSpeed * 14 // This magic number comed from the nature of onChange

const changeMode = (modeKey) => {
  noActionsSince = Date.now()
  lastTimeChangedMode = Date.now()
  console.log(`Mode was changed to ${modeKey}`)
  if (modesKeys.includes(currentModeKey)) currentMode = modes[modeKey]
  else {
    throw new Error(`We can't change mode to ${modeKey}`)
  }
  previousModeKey = currentModeKey
  currentModeKey = modeKey

  Object.keys(connectedSockets).map(socketId => {
    if (prodModesKeys.includes(modeKey)) connectedSockets[socketId].emit('configChanged', {
      currentModeKey,
      currentStructureKey
    })
  })
}

const changeStructure = (structureKey) => {
  noActionsSince = Date.now()
  lastTimeChangedMode = Date.now()
  console.log(`Structure was changed to ${structureKey}`)

  currentStructureKey = structureKey

  Object.keys(connectedSockets).map(socketId => {
    connectedSockets[socketId].emit('configChanged', {currentModeKey, currentStructureKey})
  })
}

// Initialise modes
(() => {
  currentModeKey = selectRandomModeKey(prodModesKeys)
  currentMode = modes[currentModeKey]
  changeMode(currentModeKey)
})()

// Select visualisation modes
setInterval(() => {
  const combinedSensors = [...clientSensors, ...realSensorsData]
  if (useEasterEgg) {
    if (!isEaster && isEasterTriggered(combinedSensors)) {
      changeMode('easterEgg')
      easterEggTriggeredAt = Date.now()
      isEaster = true
      return
    }

    if (isEaster && Date.now() - easterEggTriggeredAt > easterEggDuration) {
      changeMode(previousModeKey)
      isEaster = false
      return
    }
  }

  if (!isOnChange && !isSleeping && isAutoChangingModeEnabled && Date.now() - lastTimeChangedMode > modeAutoChangeInterval) {
    if (useOnChange) {
      console.log('... starting onChange ...')
      onChangeStarted = Date.now()
      currentModeKey = selectAnotherRandomModeKey(prodModesKeys)
      currentMode = onChange
      isOnChange = true
    } else changeMode(nextRandomKey)
    return
  }

  if (isOnChange && !isSleeping && Date.now() - onChangeStarted > onChangeDuration) {
    isOnChange = false
    console.log('... finished onChange ...')
    changeMode(currentModeKey)
    return
  }

  if (useSleepMode) {
    if (wasStretchedHardEnoughToWakeUp(combinedSensors)) {
      if (isSleeping) {
        changeMode(previousModeKey)
        console.log('good morning!')
      }
      noActionsSince = Date.now()
      isSleeping = false
      return
    }

    if (Date.now() - noActionsSince > goToSleepAfter) {
      if (!isSleeping) {
        changeMode('sleep')
        isSleeping = true
      }
      console.log(`zzzzzzzzzz already for ${Math.floor((Date.now() - noActionsSince) / (1000))} seconds`)
      return
    }
  }
}, 500)

// Talk to KYC
const ledsC = calculateRealColumns(currentStructureKey);
const kyc = new KYCClient(kycConfig, ledsC)
// kyc.init()
// kyc.leds.forEach(l => {l.setMode(polzynki)})

// kyc.on('data', data => {
//   const sensors = [...clientSensors, ...kyc.sensors];
//   const combinedLedsConfig = currentMode(leds, sensors)
//   ledsConfig = regroupConfig(combinedLedsConfig.filter(Boolean))
//   const ballLeds = ledsConfig.find(config => config.key === '1').leds
//   const ledsInBufferArray = putLedsInBufferArray(ballLeds, 20);
//   kyc.write(kyc.makeLedDataMessage(0, ledsInBufferArray))
// })

const kycSensors = kyc.sensors

const calculateDataForRealLeds = (sensors) => {
	// realSensor.update(sensorData)

	realSensorsData = sensors.map(sensor => ({
		tension: sensor.tension,
		oldTension: sensor.oldTension,
		sensorPosition: sensor.sensorPosition,
		stick: sensor.stick,
		slowSensorValue: sensor.slowSensorValue,
		fastSensorValue: sensor.fastSensorValue,
		key: sensor.name
	}))

	// console.log({realSensorsData})

	const combinedLedsConfig = currentMode(calculateRealColumns(currentStructureKey), [...clientSensors, ...realSensorsData])

	return regroupConfig(combinedLedsConfig.filter(Boolean))

	// const ballLeds = ledsConfig.find(config => config.key === ball).leds
	// return putLedsInBufferArray(ballLeds, NUMBER_OF_LEDS)
}

if (kyc && kycSensors && kycSensors.length) {
	// console.log('we are updating', {kyc, kycSensors})
	// console.log({ledsData})

	kyc.serialPort.on('data', (data) => {
		const message = kyc.readMessage(data)
		// kyc.processMessage(message)
    // kyc.makeSwapMessage()

		switch (message.type.name) {
			case "Ready":
        console.log("Ready")
			  if (!kyc.active) {
				  kyc.active = true
			  }
			  const combinedLedsData = calculateDataForRealLeds(kyc.sensors)
				kyc.leds.forEach(led => {
          // console.log(combinedLedsData.leds)
					const thisLedData = combinedLedsData.find(ledsData => ledsData.key === led.name)
          // console.log({thisLedData})
					if (thisLedData) {
						const leds = thisLedData.leds
						if (leds && leds.length) {
							led.drawFrame(leds)
						}
					}
				})

        kyc.sensors.forEach((sensor, key) => {
          // console.log('sensor', sensor.slowSensorValue)
          console.log(key, sensor.tension)
          kyc.write(kyc.makeFireMessage(10 + key, Math.max(Math.min(sensor.tension, 127), 0)))
          // kyc.write(kyc.makeSwapMessage())
        })
        kyc.write(kyc.makeSwapMessage())
        
			  break
			case "Pull":
			  // console.log('message content', message.content)11
			  message.content.data.forEach((data, i) => {
            // console.log('pull', i, data)
				    kyc.sensors[i].update(data)
            // kyc.write(kyc.makeFireMessage(10 + i, Math.max(Math.min(kyc.sensors[i].tension, 127), 0)))
            kyc.write(kyc.makeSwapMessage())
			  })
        kyc.write(kyc.makeSwapMessage())
			  break
			default:
			  break;
		  }
	 })
}

// if (realSensors && realSensors.length > 0) {
// 	realSensors.map(realSensor => {
// 		const port = realSensor.port
// 		const parser = realSensor.parser
// 		let areWeWriting = true

// 		parser.on('data', data => {
// 			if (areWeWriting && ledsConfig && ledsConfig.length > 0) {
// 				// console.log({
// 				// 	data,
// 				// 	key: realSensor.key,
// 				// 	writing: calculateDataForRealLeds(getInfoFromSensors(data), realSensor, realSensor.ball).toString()
// 				// })
// 				port.write(calculateDataForRealLeds(getInfoFromSensors(data), realSensor, realSensor.ball))
// 				areWeWriting = false
// 			} else {
// 				// console.log('Data IN, listen', data)
// 				// console.log(`${new Date().getMinutes()}:${new Date().getSeconds()}`)
// 				if (data === 'eat me\r') {
// 					areWeWriting = true
// 				}
// 			}
// 		})
// 	})
// }

////// ---> OLD CODE
// Talk to arduinos
// const realSensors = connectToArduinos()

// const calculateDataForRealLeds = (sensorData, realSensor, ball) => {
// 	realSensor.update(sensorData)

// 	realSensorsData = realSensors.map(sensor => ({
// 		tension: sensor.tension,
// 		oldTension: sensor.oldTension,
// 		sensorPosition: sensor.sensorPosition,
// 		ball: sensor.ball,
// 		slowSensorValue: sensor.slowSensorValue,
// 		fastSensorValue: sensor.fastSensorValue,
// 		key: sensor.key
// 	}))

// 	const combinedLedsConfig = currentMode(calculateRealColumns(currentStructureKey), [...clientSensors, ...realSensorsData])

// 	ledsConfig = regroupConfig(combinedLedsConfig.filter(Boolean))

// 	const ballLeds = ledsConfig.find(config => config.key === ball).leds
// 	return putLedsInBufferArray(ballLeds, NUMBER_OF_LEDS)
// }

// if (realSensors && realSensors.length > 0) {
// 	realSensors.map(realSensor => {
// 		const port = realSensor.port
// 		const parser = realSensor.parser
// 		let areWeWriting = true

// 		parser.on('data', data => {
// 			if (areWeWriting && ledsConfig && ledsConfig.length > 0) {
// 				// console.log({
// 				// 	data,
// 				// 	key: realSensor.key,
// 				// 	writing: calculateDataForRealLeds(getInfoFromSensors(data), realSensor, realSensor.ball).toString()
// 				// })
// 				port.write(calculateDataForRealLeds(getInfoFromSensors(data), realSensor, realSensor.ball))
// 				areWeWriting = false
// 			} else {
// 				// console.log('Data IN, listen', data)
// 				// console.log(`${new Date().getMinutes()}:${new Date().getSeconds()}`)
// 				if (data === 'eat me\r') {
// 					areWeWriting = true
// 				}
// 			}
// 		})
// 	})
// }
////// ---> OLD CODE

// Talk to python
setInterval(() => {
  const combinedSensors = [...clientSensors, ...realSensorsData]
  if (combinedSensors.length > 0) writeToPython(combinedSensors, currentModeKey, currentStructureKey)
}, 100)

// Special requests handlers
// Are here to talk to global variables as it is a bit cheaper
const modeHandler = (req, res) => {
  try {
    const modeName = req.query.name
    if (!modesKeys.includes(modeName)) throw new Error('This mode name does not exist')
    changeMode(modeName)
    if (modeName === 'easterEgg' && useEasterEgg) {
      easterEggTriggeredAt = Date.now()
      isEaster = true
    } else if (modeName === 'sleep' && useSleepMode) {
      isSleeping = true
    } else if (modeName === 'onChange' && useOnChange) {
      isOnChange = true
    }
    res.send('Done!')
  } catch (error) {
    res.send(`Sorry the mode couldn't change, reason: ${error}`)
  }
};

const switchAutomaticModeHandler = (req, res) => {
  isAutoChangingModeEnabled = !isAutoChangingModeEnabled
  const timeout = req.query.timeout
  if (timeout) {
    modeAutoChangeInterval = timeout
  }
  res.send('Done! Autoswitching enabled ' + isAutoChangingModeEnabled + '. Change once in ' + modeAutoChangeInterval / 1000 / 60 + ' minutes')
}

const arduinosStatusHandler = (req, res) => {
  const activeArduinos = realSensors.filter(sensor => sensor.active).map(sensor => ({
    name: sensor.key,
    ball: sensor.ball
  }))
  const arduinosThatDidNotOpen = realSensors.filter(sensor => !sensor.active).map(sensor => ({
    name: sensor.key,
    ball: sensor.ball
  }))
  res.json({
    activeArduinos,
    arduinosThatDidNotOpen
  })
};

const changeConfig = (req, res) => {
  if (req.query.useOnChange === 'no') useOnChange = false
  if (req.query.useOnChange === 'yes') useOnChange = true

  if (req.query.useEasterEgg === 'no') useEasterEgg = false
  if (req.query.useEasterEgg === 'yes') useEasterEgg = true

  if (req.query.useSleepMode === 'no') useSleepMode = false
  if (req.query.useSleepMode === 'yes') useSleepMode = true

  res.send('Hooray! Done!')
}

// Talk to client
const io = spinServer([
  {
    method: 'get',
    path: '/mode',
    callback: modeHandler
  },
  {
    method: 'get',
    path: '/mode/automatic',
    callback: switchAutomaticModeHandler
  },
  {
    method: 'get',
    path: '/arduinosStatus',
    callback: arduinosStatusHandler
  },
  {
    method: 'get',
    path: '/modesNames',
    callback: (req, res) => (res.json(modesKeys))
  },
  {
    method: 'get',
    path: '/changeConfig',
    callback: changeConfig
  }
])

io.on('connection', socket => {
  connectedSockets[socket.id] = socket

  socket.emit('configChanged', {currentModeKey, currentStructureKey})

  socket.on('updatedSensors', sensors => {
    if (!sensors) return

    clientSensors = sensors
    const combinedLedsConfig = currentMode(ledsC, [...clientSensors, ...realSensorsData])

    ledsConfig = regroupConfig(combinedLedsConfig.filter(Boolean))
    socket.emit('ledsChanged', ledsConfig)
  })

  socket.on('clientChangedMode', newConfig => {
    const newMode = newConfig.mode
    changeMode(newMode)
    isSleeping = false
  })

  socket.on('clientChangedStructure', newConfig => {
    const newStructure = newConfig.structure
    changeStructure(newStructure)
    isSleeping = false
  })

  socket.on('disconnect', () => {
    delete connectedSockets[socket.id]
    delete clientConfigurations[socket.id]
  })
})

