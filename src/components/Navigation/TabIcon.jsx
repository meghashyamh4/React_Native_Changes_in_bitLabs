import React from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types'; // Import prop-types

const TabIcon = ({focused, IconOutline, IconSolid, color}) => {
  return (
    <View style={{alignItems: 'center', marginBottom: 18}}>
      {focused ? (
        <IconSolid width={24} height={24} color={color} />
      ) : (
        <IconOutline width={24} height={24} color={color} />
      )}
    </View>
  );
};

// Prop validation
TabIcon.propTypes = {
  focused: PropTypes.bool.isRequired, // 'focused' should be a boolean and is required
  IconOutline: PropTypes.func.isRequired, // 'IconOutline' should be a function (React component) and is required
  IconSolid: PropTypes.func.isRequired, // 'IconSolid' should be a function (React component) and is required
  color: PropTypes.string.isRequired, // 'color' should be a string and is required
};

export default TabIcon;
