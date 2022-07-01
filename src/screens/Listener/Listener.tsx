import React from 'react';
import { AppScreen, Text } from "@components"
import { BleManager } from 'react-native-ble-plx';

export const Listener = () => {
    const manager = new BleManager();

    React.useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                scanAndConnect();
                subscription.remove();
            }
        }, true);
        return () => subscription.remove();
    }, [manager]);

    const scanAndConnect = () => {
        manager.startDeviceScan(null, null, (error, device: any) => {
            if (error) {
                // Handle error (scanning will be stopped automatically)
                return
            }
            console.log("test", JSON.stringify(device.name, null, 2))
            // Check if it is a device you are looking for based on advertisement data
            // or other criteria.
            if (device.name === 'TI BLE Sensor Tag' ||
                device.name === 'SensorTag') {
                // Stop scanning as it's not necessary if you are scanning for one device.
                manager.stopDeviceScan();
                // Proceed with connection.
            }
        });
    }

    return (
        <AppScreen>
            <Text>Listener page</Text>
        </AppScreen>
    )
}