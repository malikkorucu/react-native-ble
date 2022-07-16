import React, {useEffect, useState} from 'react';
import {PermissionsAndroid, Platform, Pressable} from 'react-native';
import {AppButton, AppFlatList, AppScreen, Block, Text} from '@components';
import {BleManager, Device, Subscription} from 'react-native-ble-plx';
import {Buffer} from 'buffer';
import {COLORS, SIZES} from '@theme';

const SERVICE_UUID = 'fd05a570-274a-4b1f-a5a3-eb52e5e02b8b';
const CHARACTERISTIC_UUID = '53447ca9-1e5b-448e-ab7b-bd9438c048af';

const BluetoothListenerPlxPage = () => {
  const bleManager = new BleManager();

  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const [peripheralInfoText, setPeripheralInfoText] = useState('');

  // const retrieveBleValue = async (peripheral: Device): Promise<string> => {
  //   await peripheral.discoverAllServicesAndCharacteristics();
  //   const peripheralServices = await peripheral.services();

  //   const serviceData = await peripheral.readCharacteristicForService(
  //     SERVICE_UUID,
  //     CHARACTERISTIC_UUID,
  //   );

  //   return serviceData.value || '';
  // };

  const getBleData = async (peripheral: Device) => {
    try {
      console.log('peripheral: ', peripheral);
      if (!peripheral) return '';
      if (!peripheral?.isConnectable) return '';

      bleManager.stopDeviceScan();
      const device = await bleManager.connectToDevice(peripheral.id, {
        requestMTU: 512,
      });
      if (!device) return '';

      await device.discoverAllServicesAndCharacteristics();

      const serviceData = await device.readCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
      );

      console.log('serviceData: ', JSON.stringify(serviceData, null, 2));
      base64ToHex(serviceData.value);

      return serviceData.value;
    } catch (error) {
      console.log(error);
    }

    //return retrieveBleValue(peripheral);
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
  };

  const base64ToHex = (str: any) => {
    const aa = Buffer.from(str, 'base64').toString('hex');
    console.log(aa);
    return aa;
  };

  const scan = async () => {
    bleManager.startDeviceScan([SERVICE_UUID], null, (error, scannedDevice) => {
      if (scannedDevice) {
        if (!devices?.find(x => x.id === scannedDevice.id)) {
          setDevices([...devices, scannedDevice]);
        }
      }
    });
  };

  const handleOnPress = async (peripheral: Device) => {
    bleManager.stopDeviceScan();
    const peripheralData = await getBleData(peripheral);
    if (peripheralData) {
      console.log('peripheralData Text: ' + peripheralData);
      setPeripheralInfoText(peripheralData);
    }
  };

  const renderItem = ({item}: {item: Device}) => {
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
              Bağlantı Kurulabilir: {item?.isConnectable ? 'Evet' : 'Hayır'}
            </Text>
          </Block>
        </Block>
      </Pressable>
    );
  };

  useEffect(() => {
    initializeBle();
  }, []);

  return (
    <AppScreen>
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

      <Block pt={10}>
        <AppButton title={'Ara'} onPress={scan} type={'primary'} />
      </Block>

      {peripheralInfoText?.length > 0 && (
        <Block pt={10}>
          <Text title>{peripheralInfoText}</Text>
        </Block>
      )}
    </AppScreen>
  );
};

export default BluetoothListenerPlxPage;
