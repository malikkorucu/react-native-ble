import React, {useEffect, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {AppButton, AppScreen, Block, Text} from '@components';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import ReactNativeBleAdvertiser from 'tp-rn-ble-advertiser';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const SERVICE_UUID = 'FD05A570-274A-4B1F-A5A3-EB52E5E02B8B';
const CHARACTERISTIC_UUID = '53447CA9-1E5B-448E-AB7B-BD9438C048AF';

const UUID = 'A6AED81E-3B29-0AF5-D750-E8B495D5FA06';

const BluetoothListenerPage = () => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [peripheralInfoText, setPeripheralInfoText] = useState('');

  const retrieveBleValue = async (peripheral: Peripheral): Promise<string> => {
    return new Promise(resolve => {
      try {
        setTimeout(async () => {
          let returnData = '';
          await BleManager.retrieveServices(peripheral.id, [SERVICE_UUID]);
          const readBleData = await BleManager.read(
            peripheral.id,
            SERVICE_UUID,
            CHARACTERISTIC_UUID,
          );
          console.log('readBleData: ', readBleData);
          if (readBleData) returnData = String.fromCharCode(...readBleData);

          await BleManager.disconnect(peripheral.id, true);
          resolve(returnData);
        }, 1000);
      } catch (error) {
        console.log('Retrieve Services Error: ', error);
        resolve('');
      }
    });
  };
  const getBleData = async (peripheral: Peripheral) => {
    if (!peripheral) return '';
    if (!peripheral?.advertising?.isConnectable) return '';
    if (!(peripheral?.advertising as any)?.serviceData) return '';

    try {
      // Try to connect to the peripheral
      const isConnected = await BleManager.isPeripheralConnected(
        peripheral.id,
        [SERVICE_UUID],
      );
      if (!isConnected) {
        await BleManager.connect(peripheral.id);
      }
    } catch (error) {
      console.log('Connection error', error);
    }

    return await retrieveBleValue(peripheral);
  };

  const handleDiscoverPeripheral = async (peripheral: Peripheral) => {
    const peripheralData = await getBleData(peripheral);
    if (peripheralData) {
      console.log('peripheralData Text: ' + peripheralData);
      setPeripheralInfoText(peripheralData);
    }
  };

  const initializeBle = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      const isPermissionGiven = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!isPermissionGiven) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      }
    }

    ReactNativeBleAdvertiser.initializeBle();
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
  };

  const toggleBleScan = async () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      BleManager.scan([SERVICE_UUID], 5);
    } else {
      BleManager.stopScan();
    }
  };

  const toggleBroadcasting = async () => {
    setIsBroadcasting(!isBroadcasting);
    if (!isBroadcasting) {
      ReactNativeBleAdvertiser.setData('Hellooo!!! Hear Meeeee !!!!');
      ReactNativeBleAdvertiser.startBroadcast();
    } else {
      ReactNativeBleAdvertiser.stopBroadcast();
    }
  };

  useEffect(() => {
    initializeBle();
    return () => {
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
    };
  }, []);

  return (
    <AppScreen>
      <Block pt={10}>
        <AppButton
          title={'Broadcast Status (' + (isBroadcasting ? 'on' : 'off') + ')'}
          onPress={toggleBroadcasting}
          type={'secondary'}
        />
      </Block>

      <Block pt={10}>
        <AppButton
          title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
          onPress={toggleBleScan}
          type={'primary'}
        />
      </Block>

      {peripheralInfoText?.length > 0 && (
        <Block pt={10}>
          <Text title>{peripheralInfoText}</Text>
        </Block>
      )}
    </AppScreen>
  );
};

export default BluetoothListenerPage;
