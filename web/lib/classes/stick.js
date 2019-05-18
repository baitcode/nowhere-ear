const INIT_STICK_COLOR = 0x443322

export class Stick {
	constructor(numberOfLEDs, StickLEDs, key) {
		this.stickName = key
		this.numberOfLEDs = numberOfLEDs
		this.StickLEDs = StickLEDs
	}

	colorLeds(leds) {
		this.cleanLeds()

		leds.forEach(led => {
			this.StickLEDs[led.number].material.color.setHex(led.color)
		})
	}

	cleanLeds() {
		this.StickLEDs.map(led => {
			led.material.color.setHex(INIT_STICK_COLOR)
		})
	}
}
