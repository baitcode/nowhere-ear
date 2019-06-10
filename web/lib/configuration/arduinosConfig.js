export const arduinosConfig = [
    {
        name: '/dev/tty.usbmodem14201', // first port on MAC
        column: '2',
        baudRate: 115200,
        numberOfLEDs: 40,
        sensors: [
            {
                name: 'someName',
                position: 20
            }
        ],
        baseTension: 0
    }, {
        name: 'COM14', // first port on Windows
        column: '1',
        baudRate: 115200,
        numberOfLEDs: 40,
        sensors: [
            {
                name: 'someName',
                position: 20
            }
        ],
        baseTension: 0
    }
]