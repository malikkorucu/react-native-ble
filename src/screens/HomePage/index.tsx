import React, {useState, useCallback, useLayoutEffect} from 'react';
import {Pressable} from 'react-native';
import {Images} from '@assets';
import {useSelector} from 'react-redux';
import {
  Text,
  Block,
  AppImage,
  AppIcon,
  AppScreen,
  AppButton,
  DateTimePicker,
  Row,
  Col,
  AppBottomSheet,
} from '@components';
import {requestPermissions, checkPermissions, PermissionsList} from '@utils';
import {useFocusEffect} from '@react-navigation/native';
import {RootState, settingsRedux} from '@store';
import Routes from '../../navigation/Routes';
import useTag from '../../hooks/createTag';

const HomePage = ({navigation}: any) => {
  const [isPermission, setIsPermission] = useState(false);
  const [dateVisible, setDateVisible] = useState(false);
  const [bottomSheetVisibility, setBottomSheetVisibility] = useState(false);

  const language = useSelector<RootState>(state => state.settings.language);

  const onChangeLang = (_language: string) => {
    settingsRedux.actions.changeLanguage(_language);
  };

  const cameraPermissions = async () => {
    const cameraPermissionsStatus: any = await requestPermissions(
      PermissionsList.camera,
    );
    setIsPermission(cameraPermissionsStatus);
  };

  const isSCameraPermissionsCheck = async () => {
    const isCheckPermission: any = await checkPermissions(
      PermissionsList.camera,
    );
    setIsPermission(isCheckPermission);
  };

  useFocusEffect(
    useCallback(() => {
      isSCameraPermissionsCheck();
    }, []),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Block px={10}>
          <Text color="white" pr={10}>
            Dil: {language}
          </Text>
        </Block>
      ),
    });
  }, [navigation, language]);

  const DatePickerArea = useTag(Block);
  const LanguageArea = useTag(Block);

  return (
    <>
      <AppScreen scroll>
        <Block center middle mb={20}>
          <AppImage
            resizeMode="contain"
            url={Images.TulparLogo}
            width={200}
            height={60}
          />
        </Block>

        <AppButton
          mb={10}
          type="primary"
          title="Bottom Sheet"
          onPress={() => {
            setBottomSheetVisibility(true);
          }}
        />

        <DatePickerArea mb={10}>
          <Row>
            <Col col={6} pr={5}>
              <AppButton
                mr={5}
                title="Date Picker"
                type="primary"
                onPress={() => {
                  setDateVisible(true);
                }}
              />
            </Col>
            <Col col={6} pl={5}>
              <AppButton
                mr={5}
                title="Date Picker"
                type="primary"
                onPress={() => {
                  setDateVisible(true);
                }}
              />
            </Col>
          </Row>
        </DatePickerArea>

        <DateTimePicker visible={dateVisible} setVisible={setDateVisible} />

        <AppButton
          mb={10}
          type="primary"
          title={'Form Example'}
          onPress={() => {
            navigation.navigate(Routes.FORM_SCREEN);
          }}
        />

        <AppButton
          mb={10}
          type="secondary"
          title={'Fetch Data Example'}
          onPress={() => {
            navigation.navigate(Routes.FETCH_DATA_SCREEN);
          }}
        />

        <LanguageArea>
          <Row>
            <Col col={6} pr={5}>
              <AppButton
                mb={10}
                type="primary"
                title={'T??rk??e'}
                onPress={() => onChangeLang('tr')}
              />
            </Col>
            <Col col={6} pl={5}>
              <AppButton
                type="primary"
                title={'??ngilizce'}
                onPress={() => onChangeLang('en')}
              />
            </Col>
          </Row>
        </LanguageArea>

        <AppButton
          mb={10}
          type="primary"
          title={'Bluetooth LE'}
          onPress={() => navigation.navigate(Routes.BLUETOOTH_SCREEN)}
        />

        <AppButton
          mb={10}
          type="primary"
          title={'Bluetooth Listener'}
          onPress={() => navigation.navigate(Routes.BLUETOOTH_LISTENER_SCREEN)}
        />

        <Block marginTop={20} center middle>
          <AppIcon name="camera" size={30} color="#900" />
        </Block>
        <Block>
          {isPermission ? (
            <Text center>camera_permissions</Text>
          ) : (
            <Pressable onPress={cameraPermissions}>
              <Text center>permissions</Text>
            </Pressable>
          )}
        </Block>
      </AppScreen>
      <AppBottomSheet
        isVisible={bottomSheetVisibility}
        onClose={() => setBottomSheetVisibility(false)}>
        <Block h={200}>
          <Text>test</Text>
        </Block>
      </AppBottomSheet>
    </>
  );
};

export default HomePage;
