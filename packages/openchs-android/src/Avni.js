import React, {Component} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import Playground from "./Playground";
import Config from './framework/Config';
import Colors from "./views/primitives/Colors";
import { LogBox } from 'react-native';
import General from "./utility/General";

export default class Avni extends Component {

    static styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'stretch',
            backgroundColor: '#FFFFFF'
        }
    });

    render() {
        LogBox.ignoreAllLogs();

        if (Config.PLAYGROUND) {
            console.log("=====================>>>>>>>Rendering Playground app component");
            return <Playground/>;
        }
        General.logDebug("Avni", "=====================>>>>>>>Rendering main app component");
        const App = require('./App').default;
        return (
            <View style={Avni.styles.container}>
                <StatusBar backgroundColor={Colors.headerBackgroundColor} barStyle={'default'}/>
                <App/>
            </View>
        );
    }
}
