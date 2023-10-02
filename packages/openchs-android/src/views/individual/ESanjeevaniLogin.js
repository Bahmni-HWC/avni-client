import React from 'react';
import PropTypes from 'prop-types';
import { View, Modal, Button, TextInput, Text, StyleSheet, TouchableWithoutFeedback, BackHandler } from 'react-native';
import SettingsService from "../../service/SettingsService";
import AbstractComponent from "../../framework/view/AbstractComponent";
import { getJSON } from "../../framework/http/requests";
import AuthService from "../../service/AuthService";
import { WebView } from 'react-native-webview';
import axios from 'axios';
import Colors from "../primitives/Colors";

class ESanjeevaniLogin extends AbstractComponent {
  static propTypes = {
    individual: PropTypes.object.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      showWebView: false,
      webUrl: '',
      error: null
    };

    this.webView = {
      canGoBack: false,
      ref: null,
    }

    this.settings = context.getService(SettingsService)
    this.authService = this.context.getService(AuthService)

    this.state = {
      username: '',
      password: ''
    };

    if(this.getObservationValueWrapper("Postal code") == null) {
      this.state.error = "Postal code cannot be null"
    }
    this.handleBackButton = this.handleBackButton.bind(this);
  }


  async getAddress(locationUUID) {
    const serverUrl = this.settings.getSettings().serverURL;
    const address = await getJSON(`${serverUrl}/locations/parents/${locationUUID}`);

    const addressMap = {};

    address.forEach((item) => {
      addressMap[item.typeString] = item.title;
    });

    return addressMap;
  }

  getObservationValueWrapper(observationName) {
    const Obs = this.props.individual.findObservation(observationName);
    return _.isNil(Obs) ? null : Obs.getValueWrapper().value;
  }  

  async callESanjeevani(postData) {
    try {
      const esanjeevaniServiceUrl = this.settings.getESaneevaniServieUrl();
      const apiUrl = `${esanjeevaniServiceUrl}/registerAndLaunch`;
      const authToken = await this.authService.getAuthProviderService().getAuthToken()

      const response = await axios.post(apiUrl, postData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json', // Set the content type based on your API's requirements
        },
      });
      
      this.setState({ webUrl: response.data ,showWebView: true });
    
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          console.error('Bad Request:', error.response.data);
          this.setState({ error: `${error.response.data}` });
        } else {
          console.error(`HTTP Error ${error.response.status}:`, error.response.data);
          this.setState({ error: `Error ${error.response.status}: Something went wrong` });
        }
      } else {
        console.error('Error making POST request:', error);
        this.setState({ error: `Error: ${error.message}` });
      }
    }

  }


  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
  }
  
  componentWillUnmount() {
   BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }


    handleBackButton() {
      if (this.webView.canGoBack && this.webView.ref) {
        this.webView.ref.goBack();
        return true;
      }
      return false;

    };



  handleLogin = async () => {
    const { username, password } = this.state;

    const { individual } = this.props;

    const addressMap = await this.getAddress(individual.lowestAddressLevel.uuid);

    const loginData = {
      patient: {
        name: {
          firstName: individual.firstName,
          middleName: individual.middleName,
          lastName: individual.lastName
        },
        dateOfBirth: individual.dateOfBirth,
        age: individual.age,
        gender: individual.gender.name,
        phoneNumber: this.getObservationValueWrapper("Phone Number"),
        address: {
          state: addressMap["State"],
          district: addressMap["District"],
          subDistrict: addressMap["Sub District"],
          village: addressMap["City/Village"],
          postalCode: this.getObservationValueWrapper("Postal Code"),
        }
      },
      credentials: {
        username: username,
        password: password
      }
    };

    await this.callESanjeevani(loginData);

  };

  renderTextInput = (element, value, label, onInputChange, secureTextEntry = false) => (
      <View>
        <Text>{label}</Text>
        <TextInput underlineColorAndroid={Colors.InputBorderNormal}
        value={value}
        onChangeText={(text) => onInputChange(text)} 
        multiline={false}
        secureTextEntry={secureTextEntry}
        />
        </View>
  )



  render () {
    return (
      <View style={{ flex: 1 }}>
        {this.state.showWebView ? (

            <>
              <View style={styles.appBar}>
                <Text style={styles.title}>ESanjeevani</Text>
                <TouchableWithoutFeedback onPress={() => this.props.onClose(false)}>
                  <View style={styles.closeButton}>
                    <Text style={styles.closeText}>X</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <WebView
                    ref={(webView) => { this.webView.ref = webView; }}
                    onNavigationStateChange={(navState) => { this.webView.canGoBack = navState.canGoBack; }}
                    source={{ uri: this.state.webUrl }}
                    style={{ flex: 1 }}
                    javaScriptEnabled={true}
                    hardwareAccelerationDisabled={true}
                    onLoad={() => console.log('WebView loaded')}
                    onError={(error) => console.error('WebView error:', error)}
                  />
             </>

        ):
        (<Modal
        visible={this.props.isVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => this.props.onClose(false)}
      >
          <View style={styles.appBar}>
            <Text style={styles.title}>ESanjeevani Login</Text>
            <TouchableWithoutFeedback onPress={() => this.props.onClose(false)}>
              <View style={styles.closeButton}>
                <Text style={styles.closeText}>X</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>  
          <View style={{ width: '80%' }}>
            {this.renderTextInput('username', this.state.username, 'Username', (text) => this.setState({ username: text }))}
            {this.renderTextInput('password', this.state.password, 'Password', (text) => this.setState({ password: text }), true)}
            <Button title="Login" onPress={this.handleLogin} />

            {this.state.error && (
                <Text style={{ color: 'red', marginTop: 10 }}>{this.state.error}</Text>
              )}

          </View>
        </View>
      </Modal>)}

      </View>
    );
  }
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'black', // AppBar background color
    paddingHorizontal: 16, // Horizontal padding
    paddingVertical: 10, // Vertical padding
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white', // Title text color
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: 'white', // Close button text color
  },
  input: {
    borderBottomWidth: 0.5, // Add a bottom border
    borderColor: 'gray', // Border color
  }
});



export default ESanjeevaniLogin;
