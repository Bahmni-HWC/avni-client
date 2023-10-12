import {TextInput, View} from "react-native";
import {Text} from 'native-base';
import PropTypes from 'prop-types';
import React from "react";
import _ from "lodash";
import AbstractFormElement from "./AbstractFormElement";
import ValidationErrorMessage from "../../form/ValidationErrorMessage";
import Styles from "../../primitives/Styles";
import Colors from "../../primitives/Colors";
import ValueSelectFormElement from "./ValueSelectFormElement";
import {HelpText} from "../../common/HelpText";
import FormElementLabelWithDocumentation from "../../common/FormElementLabelWithDocumentation";
import {SecureTextInput} from "../../common/SecureTextInput";

class TextFormElement extends AbstractFormElement {
    static propTypes = {
        element: PropTypes.object.isRequired,
        actionName: PropTypes.string.isRequired,
        value: PropTypes.object,
        validationResult: PropTypes.object,
        multiline: PropTypes.bool.isRequired,
        extraStyle: PropTypes.object,
        keyboardType: PropTypes.string,
        containerStyle: PropTypes.object,
        labelStyle: PropTypes.object,
        inputStyle: PropTypes.object,
        allowedValues: PropTypes.array,
        helpText: PropTypes.string,
        isTableView: PropTypes.bool,
        isSecureInput: PropTypes.bool
    };
    static defaultProps = {
        style: {},
        isSecureInput: false
    };

    constructor(props, context) {
        super(props, context);
    }

    renderReadOnly() {
        return (<View style={{ flexDirection: 'column', justifyContent: 'flex-start' }}>
            <FormElementLabelWithDocumentation element={this.props.element} isTableView={this.props.isTableView}/>
            <Text style={[{
                flex: 1,
                marginVertical: 0,
                paddingVertical: 5
            }, Styles.formBodyText, { color: Colors.InputNormal }]}>
                {_.isNil(this.props.value.getValue()) ? this.I18n.t('Not Known Yet') : _.toString(this.props.value.getValue())}
            </Text>
            <ValidationErrorMessage validationResult={this.props.validationResult}/>
        </View>);
    }

    renderWritable() {
        const containerStyle = _.get(this.props, 'containerStyle', {flexDirection: 'column', justifyContent: 'flex-start'});
        const labelStyle = _.get(this.props, 'labelStyle', {});
        const inputStyle = _.get(this.props, 'inputStyle', {});
        return (
            <View style={containerStyle}>
                <View style={labelStyle}>
                    <FormElementLabelWithDocumentation element={this.props.element} isTableView={this.props.isTableView}/>
                    <HelpText t={this.I18n.t} text={this.props.helpText}/>
                </View>
                <View style={inputStyle}>
                    {this.props.isSecureInput === true ?
                        <SecureTextInput {...this.props} style={[Styles.formBodyText, this.props.style]}
                                   underlineColorAndroid={this.borderColor} secureTextEntry={this.props.secureTextEntry}
                                   value={_.isNil(this.props.value) ? "" : this.props.value.answer}
                                   onChangeText={(text) => this.onInputChange(text)} multiline={this.props.multiline}
                                   numberOfLines={this.props.multiline ? 4 : 1}
                                   keyboardType={this.props.keyboardType || 'default'}
                        />
                        :
                        <TextInput {...this.props} style={[Styles.formBodyText, this.props.style]}
                                         underlineColorAndroid={this.borderColor}
                                         secureTextEntry={this.props.secureTextEntry}
                                         value={_.isNil(this.props.value) ? "" : this.props.value.answer}
                                         onChangeText={(text) => this.onInputChange(text)}
                                         multiline={this.props.multiline}
                                         numberOfLines={this.props.multiline ? 4 : 1}
                                         keyboardType={this.props.keyboardType || 'default'}
                        />
                    }
                        <ValidationErrorMessage validationResult={this.props.validationResult}/>
                </View>
            </View>);
    }

    renderNormalView() {
        return this.props.element.editable === false ? this.renderReadOnly() : this.renderWritable();
    }

    onInputChange(text) {
        this.dispatchAction(this.props.actionName, {formElement: this.props.element, parentFormElement: this.props.parentElement, value: text, questionGroupIndex: this.props.questionGroupIndex});
    }

    renderOptionView() {
        return <ValueSelectFormElement
            onPress={(text) => this.onInputChange(text)}
            values={this.props.allowedValues}
            {...this.props}
        />
    }

    render() {
        return _.isNil(this.props.allowedValues) ? this.renderNormalView() : this.renderOptionView()
    }
}

export default TextFormElement;
