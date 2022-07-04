import React, {useEffect, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {AppButton, AppFlatList, AppScreen, Block, Text} from '@components';
import BleManager from 'react-native-ble-manager';
import ReactNativeBleAdvertiser from 'tp-rn-ble-advertiser';
import {COLORS, SIZES} from '@theme';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BluetoothListenerPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState<any>([]);

  const [result, setResult] = useState<string>();

  useEffect(() => {
    ReactNativeBleAdvertiser.initializeBle();
    ReactNativeBleAdvertiser.setData('Hellooo!!! Hear Meeeee !!!!');

    setTimeout(() => {
      ReactNativeBleAdvertiser.startBroadcast();
      setResult('Broadcast started. Sent data: "Hellooo!!! Hear Meeeee !!!!"');
    }, 500);

    // setTimeout(() => {
    //   ReactNativeBleAdvertiser.stopBroadcast();
    //   setResult('Broadcast stopped');
    // }, 15000);
    setResult('Initializing...');
  }, []);

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 3, true)
        .then(results => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch(err => {
          console.error(err);
        });
    }
  };

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  const handleDisconnectedPeripheral = data => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList([...list, peripherals]);
    }
    console.log('Disconnected from ' + data.peripheral);
  };

  const handleUpdateValueForCharacteristic = data => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then(results => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      for (const peripheral of results) {
        peripheral.connected = true;
      }
      setList(results);
    });
  };

  const handleDiscoverPeripheral = (peripheral: any) => {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    console.log('Data: ', peripheral.manufacturerData?.data);
    if (peripheral.manufacturerData?.data) {
      try {
        const _data = String.fromCharCode(peripheral.manufacturerData.bytes);
        console.log('Received data from ' + peripheral.id + ': ' + _data);
      } catch (error) {
        console.log('Received Data Error: ', error);
      }
    }

    if (!list.find(x => x.id === peripheral.id)) {
      setList([...list, peripheral]);
    }
  };

  const testPeripheral = (peripheral: any) => {
    console.log('Test peripheral', peripheral);
    if (peripheral) {
      if (peripheral.connected) {
        BleManager.disconnect(peripheral.id);
      } else {
        BleManager.connect(peripheral.id)
          .then(() => {
            if (!list.find(x => x.id === peripheral.id)) {
              peripheral.connected = true;
              setList([...list, peripheral]);
            }

            console.log('Connected to ' + peripheral.id);

            setTimeout(() => {
              /* Test read current RSSI value */
              BleManager.retrieveServices(peripheral.id).then(
                peripheralData => {
                  console.log('Retrieved peripheral services', peripheralData);
                },
              );
            }, 900);
          })
          .catch(error => {
            console.log('Connection error', error);
          });
      }
    }
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdateValueForCharacteristic,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(result => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(result => {
            if (result) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }

    return () => {
      console.log('unmount');
      bleManagerEmitter.removeListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan);
      bleManagerEmitter.removeListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
      bleManagerEmitter.removeListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      );
    };
  }, []);

  const renderItem = ({item}: {item: any}) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableOpacity onPress={() => testPeripheral(item)}>
        <Block style={[{backgroundColor: color}]}>
          <Block>
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                color: '#333333',
                padding: 10,
              }}>
              {item.name}
            </Text>
          </Block>
          <Block>
            <Text
              style={{
                fontSize: 10,
                textAlign: 'center',
                color: '#333333',
                padding: 2,
              }}>
              RSSI: {item.rssi}
            </Text>
          </Block>
          <Block>
            <Text
              style={{
                fontSize: 8,
                textAlign: 'center',
                color: '#333333',
                padding: 2,
                paddingBottom: 20,
              }}>
              {item.id}
            </Text>
          </Block>
        </Block>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <Text>Broadcast Status: {result}</Text>

      <Block pt={10}>
        <AppButton
          title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
          onPress={() => startScan()}
          type={'primary'}
        />
      </Block>

      <Block pt={10}>
        <AppButton
          title="Retrieve connected peripherals"
          onPress={() => retrieveConnected()}
          type={'primary'}
        />
      </Block>

      <AppFlatList
        data={list}
        keyExtractor={(item: any) => item.id}
        ListHeaderComponent={
          <Block py={20} center middle>
            <Text>Found Peripherals</Text>
          </Block>
        }
        ListEmptyComponent={
          <Block pt={20} center middle>
            <Text>No peripherals found.</Text>
          </Block>
        }
        renderItem={renderItem}
      />
    </AppScreen>
  );
};

export default BluetoothListenerPage;
