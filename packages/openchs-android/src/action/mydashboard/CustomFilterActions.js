import _ from "lodash";
import CustomFilterService from "../../service/CustomFilterService";
import moment from "moment";


class CustomFilterActions {

    static getInitialState() {
        return {
            selectedCustomFilters: {}

        }
    }

    static onLoad(state, action, context) {
        const customFilterService = context.get(CustomFilterService);
        const selectedCustomFilters = {};
        const alreadySelected = action.props.selectedCustomFilters;
        _.forEach(customFilterService.getFilterNames(), name => selectedCustomFilters[name] = alreadySelected && alreadySelected[name] || []);
        return {...state, selectedCustomFilters};
    }

    static onCodedCustomFilterSelect(state, action, context) {
        const {conceptAnswerName, conceptAnswers, titleKey, subjectTypeUUID} = action;
        const selectedConceptAnswer = conceptAnswers.filter(a => a.concept.name === conceptAnswerName).map(c => ({
            uuid: c.concept.uuid,
            name: conceptAnswerName,
            subjectTypeUUID
        }));
        const addAnswer = [...state.selectedCustomFilters[titleKey], ...selectedConceptAnswer];
        const removeAnswer = state.selectedCustomFilters[titleKey].filter(a => a.name !== conceptAnswerName);
        const selectedCustomFilters = _.intersectionBy(state.selectedCustomFilters[titleKey], selectedConceptAnswer, "uuid").length > 0 ?
            {...state.selectedCustomFilters, [titleKey]: removeAnswer} : {
                ...state.selectedCustomFilters,
                [titleKey]: addAnswer
            };
        return {...state, selectedCustomFilters};
    }

    static onTextCustomFilterSelect(state, action) {
        const {titleKey, subjectTypeUUID, name} = action;
        const newState = _.isEmpty(name) ? {} : {subjectTypeUUID, name};
        const selectedCustomFilters = {...state.selectedCustomFilters, [titleKey]: [newState]};
        return {...state, selectedCustomFilters};
    }

    static onNumericFilterSelect(state, action) {
        const {titleKey, subjectTypeUUID, minValue, maxValue} = action;
        const prevValue = _.head(state.selectedCustomFilters[titleKey]);
        const newState = _.isEmpty(minValue) && _.isEmpty(maxValue) ? {} : {
            subjectTypeUUID,
            minValue: minValue || prevValue && prevValue.minValue,
            maxValue: maxValue || prevValue && prevValue.maxValue,
        };
        const selectedCustomFilters = {...state.selectedCustomFilters, [titleKey]: [newState]};
        return {...state, selectedCustomFilters};
    }

    static onMinDateFilterSelect(state, action) {
        const {titleKey, subjectTypeUUID, value} = action;
        const prevValue = _.head(state.selectedCustomFilters[titleKey]);
        const minDate = value;
        const newState = _.isNil(minDate) ? {} : {
            ...prevValue,
            subjectTypeUUID,
            minDate,
            minValue: minDate && moment(minDate, "YYYY-MM-DDTHH:mm:ss").utc().format(),
            dateType: true
        };
        const selectedCustomFilters = {...state.selectedCustomFilters, [titleKey]: [newState]};
        return {...state, selectedCustomFilters};
    }

    static onMaxDateFilterSelect(state, action) {
        const {titleKey, subjectTypeUUID, value} = action;
        const prevValue = _.head(state.selectedCustomFilters[titleKey]);
        const maxDate = value;
        const newState = _.isNil(maxDate) ? {} :{
            ...prevValue,
            subjectTypeUUID,
            maxDate,
            maxValue: maxDate && moment(maxDate, "YYYY-MM-DDTHH:mm:ss").utc().format(),
            dateType: true
        };
        const selectedCustomFilters = {...state.selectedCustomFilters, [titleKey]: [newState]};
        return {...state, selectedCustomFilters};
    }

    static onTimeFilterSelect(state, action) {
        const {titleKey, subjectTypeUUID, value} = action;
        const newState = _.isEmpty(value) ? {} : {subjectTypeUUID, value};
        const selectedCustomFilters = {...state.selectedCustomFilters, [titleKey]: [newState]};
        return {...state, selectedCustomFilters};
    }
}

const ActionPrefix = 'CustomFilters';
const CustomFilterNames = {
    ON_LOAD: `${ActionPrefix}.ON_LOAD`,
    ON_CODED_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_CODED_CUSTOM_FILTER_SELECT`,
    ON_TEXT_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_TEXT_CUSTOM_FILTER_SELECT`,
    ON_NUMERIC_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_NUMERIC_CUSTOM_FILTER_SELECT`,
    ON_MIN_DATE_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_MIN_DATE_CUSTOM_FILTER_SELECT`,
    ON_MAX_DATE_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_MAX_DATE_CUSTOM_FILTER_SELECT`,
    ON_TIME_CUSTOM_FILTER_SELECT: `${ActionPrefix}.ON_TIME_CUSTOM_FILTER_SELECT`,
};

const CustomFilterMap = new Map([
    [CustomFilterNames.ON_LOAD, CustomFilterActions.onLoad],
    [CustomFilterNames.ON_CODED_CUSTOM_FILTER_SELECT, CustomFilterActions.onCodedCustomFilterSelect],
    [CustomFilterNames.ON_TEXT_CUSTOM_FILTER_SELECT, CustomFilterActions.onTextCustomFilterSelect],
    [CustomFilterNames.ON_NUMERIC_CUSTOM_FILTER_SELECT, CustomFilterActions.onNumericFilterSelect],
    [CustomFilterNames.ON_MIN_DATE_CUSTOM_FILTER_SELECT, CustomFilterActions.onMinDateFilterSelect],
    [CustomFilterNames.ON_MAX_DATE_CUSTOM_FILTER_SELECT, CustomFilterActions.onMaxDateFilterSelect],
    [CustomFilterNames.ON_TIME_CUSTOM_FILTER_SELECT, CustomFilterActions.onTimeFilterSelect],
]);

export {
    CustomFilterActions, CustomFilterMap, CustomFilterNames, ActionPrefix
}