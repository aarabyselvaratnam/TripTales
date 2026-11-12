import { Alert, Platform, type AlertButton } from 'react-native';

/** Keep native alerts on Android/iOS and working dialogs on the browser. */
export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = `${title}\n\n${message}`;
  const cancel = buttons?.find((button) => button.style === 'cancel');
  const action = buttons?.find((button) => button.style === 'destructive')
    ?? buttons?.find((button) => button !== cancel);

  if (cancel && action) {
    if (window.confirm(text)) action.onPress?.();
    else cancel.onPress?.();
  } else {
    window.alert(text);
    action?.onPress?.();
  }
}
