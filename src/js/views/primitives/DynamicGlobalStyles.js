import {Dimensions} from "react-native";

class DynamicGlobalStyles {
    constructor() {
        this.windowWidth = Dimensions.get('window').width;
        this.windowHeight = Dimensions.get('window').height;
        // @formatter:off
        this.mainContent = {marginHorizontal: this.resizeWidth(24)};
            this.formRow = {marginTop: this.resizeHeight(16)};
                this.formTextElement = {marginLeft: 0, height: this.resizeHeight(76)};
                    this.formElementLabel = {fontSize: 12, height: this.resizeHeight(38), textAlignVertical: 'center', color: '#15151575'};
                    this.formElementTextInput = {flex: 1, height: this.resizeHeight(44)};
                this.formCheckboxElement = {marginLeft: 0, marginTop: this.resizeHeight(16)};
                this.formRadioText = {fontSize: 16, marginLeft: this.resizeWidth(10)}
        // @formatter:on
        this.createObservationsStyles();
    }

    createObservationsStyles() {
        this.observations = {
            observationRow: {height: this.resizeHeight(44), borderWidth: 1, borderColor: '#00000012'}
        }
    }

    resizeWidth(size) {
        return size * this.windowWidth / 600;
    }

    resizeHeight(size) {
        return size * this.windowHeight / 960;
    }

    resizeTextInputHeight(size) {
        const resizedHeight = this.resizeHeight(size);
        return resizedHeight < 26 ? 26 : resizedHeight;
    }

    numberOfTableColumns() {
        return this.windowWidth / 110;
    }

    numberOfRows(numberOfCells) {
        return numberOfCells % this.numberOfTableColumns() + 1;
    }
}

export default new DynamicGlobalStyles();