import { sleep } from './lib/helpers/sleep.js'
import { drawColumns } from './lib/helpers/drawColumns.js'

import { basic } from './lib/functions/basic.js'
import { randomEcho } from './lib/functions/randomEcho.js'
import { flicker } from './lib/functions/flicker.js'

const connectArduinosWithColumns = async ({
    arduinos,
    columns
}) => {
    const selectedFunction = document.getElementById('select-regime').options.selectedIndex
    
    switch (selectedFunction) {
        case 0:
            basic({
                arduinos,
                columns
            })
            break
        case 1:
            randomEcho({
                arduinos,
                columns
            })
            break
        case 2:
            flicker({
                arduinos,
                columns
            })
            break
        case 3:
            console.log('No function is written for this option yet')
            break
        default:
            console.log('You need to pick up function you would use')
    }
}

(async () => {
    const columnKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

    const {
        columns,
        arduinos
    } = drawColumns(columnKeys)

    let currentTime = Date.now()

    while (true) {
        let delta = Date.now() - currentTime

        arduinos.forEach(arduino => {
            arduino.update(delta)
        })

        currentTime = Date.now()
        await sleep(10)

        await connectArduinosWithColumns({
            arduinos,
            columns
        })
    }
})()
