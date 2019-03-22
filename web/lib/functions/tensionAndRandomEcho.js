import { getDistance } from '../helpers/getDistance.js'

export const tensionAndRandomEcho = ({
	arduinos,
	columns
}) => {
	const names = columns.map(column => column.columnName)
	arduinos.forEach(arduino => {
		const tension = arduino.read()

		if (tension) {
			columns.forEach(column => {
				const numberOfLEDs = column.numberOfLEDs
				const distance = getDistance({
					arduino,
					column,
					names
				})

				const leds = []

				for (let key = 0; key <= tension; key++) {
					if (distance === 0) {
						leds.push({
							number: Math.max(arduino.sensorPosition - key, 0),
							color: `rgba(${155 + Math.random() * 100}, ${155 + Math.random() *
								100}, ${155 + Math.random() * 100}, ${1 / (key + 1) + 0.7} )`
						})
						leds.push({
							number: Math.min(arduino.sensorPosition + key, numberOfLEDs - 1),
							color: `rgba(${155 + Math.random() * 100}, ${155 + Math.random() *
								100}, ${155 + Math.random() * 100}, ${1 / (key + 1) + 0.7})`
						})
					} else {
						if (tension > arduino.sensorPosition) {
							let dif = Math.min(Math.floor(tension - arduino.sensorPosition), numberOfLEDs - 1);
							leds.push({
								number: dif,
								color: `rgba(${Math.random() * 255}, ${Math.random() *
									255}, ${Math.random() * 255}, 1 )`
							})
						}
						if (tension > numberOfLEDs - arduino.sensorPosition) {
							let dif = Math.min(Math.floor(tension - numberOfLEDs + arduino.sensorPosition), numberOfLEDs - 1);
							leds.push({
								number: numberOfLEDs - 1 - dif,
								color: `rgba(${Math.random() * 255}, ${Math.random() *
									255}, ${Math.random() * 255}, 1 )`
							})
						}
					}
				}

				column.colorLeds(leds)
			})
		}
	})
}
