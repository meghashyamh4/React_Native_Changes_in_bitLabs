import React from 'react';
import { StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge, SafeAreaViewProps } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps extends SafeAreaViewProps {
    children: React.ReactNode;
    statusBarColor?: string;
    barStyle?: 'default' | 'light-content' | 'dark-content';
    containerStyle?: ViewStyle;
    edges?: Edge[];
    translucent?: boolean;
}

/**
 * A reusable wrapper that ensures content is rendered within the safe area.
 * It also manages the StatusBar for consistent cross-platform behavior.
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
    children,
    statusBarColor = 'transparent',
    barStyle = 'dark-content',
    containerStyle,
    edges = ['top', 'left', 'right'],
    translucent = true,
    ...rest
}) => {
    return (
        <SafeAreaView style={[styles.safeArea, containerStyle]} edges={edges} {...rest}>
            <StatusBar
                backgroundColor={statusBarColor}
                barStyle={barStyle}
                translucent={translucent}
            />
            <View style={styles.content}>
                {children}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff', // Default background color
    },
    content: {
        flex: 1,
    },
});

export default SafeAreaWrapper;
