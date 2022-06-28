import { IScreen } from '../Models/IScreen';
import { Bluetooth, FetchDataPage, FormPage, HomePage } from '@screens';
import routes from '../../Routes';

const Screens = [
  {
    title: 'Home',
    name: routes.HOME_SCREEN,
    component: HomePage,
    headerShown: true,
  },
  {
    title: 'Fetch Data Example',
    name: routes.FETCH_DATA_SCREEN,
    component: FetchDataPage,
    headerShown: true,
  },
  {
    title: 'Form Example',
    name: routes.FORM_SCREEN,
    component: FormPage,
    headerShown: true,
  },
  {
    title: 'Bluetooth Example',
    name: routes.BLUETOOTH_SCREEN,
    component: Bluetooth,
    headerShown: true,
  },
] as Array<IScreen>;

export default Screens;
