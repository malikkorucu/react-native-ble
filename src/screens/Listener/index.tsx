import React, {useEffect, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Pressable,
} from 'react-native';
import {AppButton, AppFlatList, AppScreen, Block, Text} from '@components';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import ReactNativeBleAdvertiser from 'tp-rn-ble-advertiser';
import {COLORS, SIZES} from '@theme';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const SERVICE_UUID = 'fd05a570-274a-4b1f-a5a3-eb52e5e02b8b';
const CHARACTERISTIC_UUID = '53447ca9-1e5b-448e-ab7b-bd9438c048af';

const BluetoothListenerPage = () => {
  const [devices, setDevices] = useState<Peripheral[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [peripheralInfoText, setPeripheralInfoText] = useState('');

  const retrieveBleValue = async (peripheral: Peripheral): Promise<string> => {
    let returnData = '';
    return new Promise(async resolve => {
      BleManager.connect(peripheral.id).then(
        () => {
          setTimeout(() => {
            BleManager.retrieveServices(peripheral.id, [SERVICE_UUID]).then(
              async peripheralInfo => {
                console.log(
                  'peripheralInfo',
                  JSON.stringify(peripheralInfo, null, 2),
                );

                BleManager.read(
                  peripheral.id,
                  SERVICE_UUID,
                  CHARACTERISTIC_UUID,
                ).then(
                  readBleData => {
                    console.log('Read Value: ', readBleData);
                    if (readBleData)
                      returnData = String.fromCharCode(...readBleData);

                    resolve(returnData);
                  },
                  readErr => {
                    console.log('Read Service Value Error: ', readErr);
                    resolve(returnData);
                  },
                );
              },
              err => {
                console.log('Retrieve Services Error: ', err);
                resolve(returnData);
              },
            );
          }, 1000);
        },
        connectError => {
          console.log('Connection Error: ', connectError);
          resolve(returnData);
        },
      );
    });
  };

  // const retrieveBleValue = async (peripheral: Peripheral) => {
  //   let returnData = '';
  //   try {
  //     const isConnected = await BleManager.isPeripheralConnected(
  //       peripheral.id,
  //       [SERVICE_UUID],
  //     );
  //     if (!isConnected) {
  //       await BleManager.connect(peripheral.id);
  //     }

  //     await BleManager.retrieveServices(peripheral.id, [SERVICE_UUID]).then();

  //     const readBleData = await BleManager.read(
  //       peripheral.id,
  //       SERVICE_UUID,
  //       CHARACTERISTIC_UUID,
  //     );
  //     console.log('readBleData: ', readBleData);
  //     if (readBleData) returnData = String.fromCharCode(...readBleData);
  //   } catch (error) {
  //     console.log('retrieveBleValue error: ', error);
  //   }
  //   return returnData;
  // };

  const getBleData = async (peripheral: Peripheral) => {
    if (!peripheral) return '';
    if (!peripheral?.advertising?.isConnectable) return '';

    // Try to get value from the peripheral
    const bleValue = await retrieveBleValue(peripheral);

    // Try to disconnect to the peripheral
    await BleManager.disconnect(peripheral.id);

    return bleValue;
  };

  const handleOnPress = async (peripheral: Peripheral) => {
    const peripheralData = await getBleData(peripheral);
    if (peripheralData) {
      console.log('peripheralData Text: ' + peripheralData);
      setPeripheralInfoText(peripheralData);
    }
  };

  const handleDiscoverPeripheral = async (peripheral: Peripheral) => {
    // Needs to stop scanning before we can connect to a peripheral
    // await BleManager.stopScan();
    // console.log('Scan stopped...');

    console.log('peripheral: ', JSON.stringify(peripheral, null, 2));

    if (!devices?.find(x => x.id === peripheral.id)) {
      setDevices([...devices, peripheral]);
      console.log(
        'devices: ',
        JSON.stringify([...devices, peripheral], null, 2),
      );
    }

    // const peripheralData = await getBleData(peripheral);
    // if (peripheralData) {
    //   console.log('peripheralData Text: ' + peripheralData);
    //   setPeripheralInfoText(peripheralData);
    // } else {
    //   // Needs to start scanning again if we can't find the peripheral service and characteristic
    //   //await toggleBleScan();
    //   // BleManager.scan([SERVICE_UUID], 5);
    //   // console.log('Scan started...');
    // }
  };

  const retrieveConnected = async () => {
    const connectedPeripherals = await BleManager.getConnectedPeripherals([]);
    setDevices([...connectedPeripherals]);
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.log('Scan stopped...');
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
    ReactNativeBleAdvertiser.setData('Selam! PBN Verisi :)');

    await BleManager.start({showAlert: false});
    BleManager.checkState();

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );

    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
  };

  const toggleBleScan = async () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      setTimeout(() => {
        BleManager.scan([SERVICE_UUID], 10);
        console.log('Scan started...');
      }, 1000);
    } else {
      setTimeout(() => {
        BleManager.stopScan();
        console.log('Scan stopped...');
      }, 1000);
    }
  };

  const toggleBroadcasting = async () => {
    setIsBroadcasting(!isBroadcasting);
    if (!isBroadcasting) {
      setTimeout(() => {
        ReactNativeBleAdvertiser.startBroadcast();
      }, 1000);
    } else {
      setTimeout(() => {
        ReactNativeBleAdvertiser.stopBroadcast();
      }, 1000);
    }
  };

  const renderItem = ({item}: {item: Peripheral}) => {
    return (
      <Pressable onPress={() => handleOnPress(item)}>
        <Block
          flex
          mb={10}
          px={10}
          borderRadius={SIZES.radius}
          bg={COLORS.error}>
          <Block flex p={10}>
            <Text color={COLORS.white}>UUID: {item?.id}</Text>
            {item?.name && <Text color={COLORS.white}>{item?.name}</Text>}
            <Text color={COLORS.white}>
              Bağlantı Kurulabilir:{' '}
              {item?.advertising.isConnectable ? 'Evet' : 'Hayır'}
            </Text>
          </Block>
        </Block>
      </Pressable>
    );
  };

  useEffect(() => {
    initializeBle();
    return () => {
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerStopScan');
    };
  }, []);

  return (
    <AppScreen>
      <Block pt={10}>
        <AppButton
          title={
            'Veri Yayın Durumu (' + (isBroadcasting ? 'Açık' : 'Kapalı') + ')'
          }
          onPress={toggleBroadcasting}
          type={'secondary'}
        />
      </Block>

      <Block pt={10}>
        <AppButton
          title={
            'Bluetooth Arama Durumu (' + (isScanning ? 'Açık' : 'Kapalı') + ')'
          }
          onPress={toggleBleScan}
          type={'primary'}
        />
      </Block>

      <Block pt={10}>
        <AppButton
          title={'Bağlantı Kurulan Cihazları Getir'}
          onPress={retrieveConnected}
          type={'primary'}
        />
      </Block>

      <Block pt={10}>
        <AppFlatList
          data={devices}
          ListEmptyComponent={
            <Block pt={20} center middle>
              <Text>Cihaz Bulunamadı.</Text>
            </Block>
          }
          renderItem={renderItem}
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
