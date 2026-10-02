declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import React from 'react';
  interface MaterialCommunityIconsProps {
    name: string;
    size?: number;
    color?: string;
  }
  const MaterialCommunityIcons: React.ComponentType<MaterialCommunityIconsProps>;
  export default MaterialCommunityIcons;
}
