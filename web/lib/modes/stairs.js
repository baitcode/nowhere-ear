import { NUMBER_OF_LEDS } from "../configuration/constants";

const start = Date.now();

const superBrightColor = () => {
    return {
        r: Math.floor(Math.random() * 100),
        g: Math.floor(Math.random() * 195),
        b: Math.floor(Math.random() * 195)
    }
}

const ledsCalculation = ({ numberOfParts, timeImput, raiseFactor, tension }) => {
    return [...Array(NUMBER_OF_LEDS / numberOfParts)].map((el, key) => {
        const liftFactor = (timeImput + raiseFactor) % numberOfParts
        const lift = NUMBER_OF_LEDS / numberOfParts * liftFactor
        let number
        let color
        if (tension > 10) {
            if (numberOfParts === 2) {
                if (liftFactor === 0) {
                    if (key < NUMBER_OF_LEDS / 4) {
                        number = key + lift
                    } else {
                        number = key + lift + NUMBER_OF_LEDS / 4
                    }
                } else if (liftFactor === 1) {
                    if (key < NUMBER_OF_LEDS / 4) {
                        number = key + lift - NUMBER_OF_LEDS / 4
                    } else {
                        number = key + lift
                    }
                }
            }
            color = {
                r: 255,
                g: 0,
                b: 0
            }
        } else {
            number = key + lift
            color = superBrightColor()
        }
        if (number < 0 || number > NUMBER_OF_LEDS - 1) return
        return {
            number,
            color
        }
    }).filter(Boolean)
}

const speed = 333 // in change per milisecond

const risingStairs = (sticks, sensors) => {
    return sensors.map(sensor => {
        return sticks.map(stick => {
            if (stick.name === sensor.stick) {
                const tension = sensor.tension
                if (sticks.length === 2) {
                    const timeImput = Math.floor((Date.now() - start) / speed)
                    const raiseFactor = (stick.name === '1') ? 0 : 1
                    return {
                        key: stick.name,
                        leds: ledsCalculation({ numberOfParts: 2, timeImput, raiseFactor, tension })
                    };
                }
                if (sticks.length === 12) {
                    const timeImput = Math.floor((Date.now() - start) / speed)
                    let raiseFactor
                    if (['3', '7'].indexOf(stick.name) > -1) raiseFactor = 0
                    if (['1', '4', '8', '11'].indexOf(stick.name) > -1) raiseFactor = 1
                    if (['2', '5', '9', '12'].indexOf(stick.name) > -1) raiseFactor = 2
                    if (['6', '10'].indexOf(stick.name) > -1) raiseFactor = 3
                    return {
                        key: stick.name,
                        leds: ledsCalculation({ numberOfParts: 4, timeImput, raiseFactor, tension })
                    };
                }

            }
        });
    });
};

export default risingStairs;