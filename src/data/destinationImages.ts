
import { ImageSourcePropType } from 'react-native';

const destinationImages: Record<string, ImageSourcePropType> = {
  'ella': require('../../assets/destinations/ella.jpg'),
  'sigiriya': require('../../assets/destinations/sigiriya.jpg'),
  'galle fort': require('../../assets/destinations/galle.jpg'),
  'nuwara eliya': require('../../assets/destinations/nuwaraeliya.jpg'),
  'mirissa': require('../../assets/destinations/mirissa.jpg'),
  'kandy': require('../../assets/destinations/kandy.jpg'),
  'horton plains': require('../../assets/destinations/hortonplains.jpg'),
  'arugam bay': require('../../assets/destinations/arugambay.jpg'),
  'anuradhapura': require('../../assets/destinations/anuradhapura.jpg'),
  'polonnaruwa': require('../../assets/destinations/polonnaruwa.jpg'),
  'trincomalee': require('../../assets/destinations/trincomalee.jpg'),
  'jaffna': require('../../assets/destinations/jaffna.jpg'),
  'bentota': require('../../assets/destinations/bentota.jpg'),
  'yala national park': require('../../assets/destinations/yala.jpg'),
  'dambulla': require('../../assets/destinations/dambulla.jpg'),
};

export function getDestinationImage(
  destination: string
): ImageSourcePropType | null {
  const key = destination.trim().toLowerCase();
  return destinationImages[key] ?? null;
}
