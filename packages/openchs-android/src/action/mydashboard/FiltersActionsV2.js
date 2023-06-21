import DashboardFilterService from "../../service/reports/DashboardFilterService";
import _ from "lodash";
 import {ArrayUtil, Concept, CustomDashboardCache, CustomFilter, ModelGeneral} from 'openchs-models';
import {CustomDashboardActions} from '../customDashboard/CustomDashboardActions';
import CustomDashboardCacheService from '../../service/CustomDashboardCacheService';
import CryptoUtils from '../../utility/CryptoUtils';

class FiltersActionsV2 {
    static getInitialState() {
        return {
            dashboardUUID : '',
            filterConfigsChecksum : '',
            loading: false,
            filters: [],
            filterConfigs: {},
            filterErrors: {},
            selectedValues: {},
            filterApplied: false
        };
    }

    static onLoad(state, action, context) {
        const dashboardFilterService = context.get(DashboardFilterService);
        const filterConfigs = dashboardFilterService.getFilterConfigsForDashboard(action.dashboardUUID);
        const filters = dashboardFilterService.getFilters(action.dashboardUUID);
        let newState = {...state, filterConfigs: filterConfigs, filters: filters, loading: false};
        let filterConfigsJSON = JSON.stringify(newState.filterConfigs, Realm.JsonSerializationReplacer);
        newState.filterConfigsChecksum = CryptoUtils.computeHash(filterConfigsJSON);
        const cachedData = context.get(CustomDashboardCacheService).cachedData(action.dashboardUUID, newState.filterConfigsChecksum);
        if(state.dashboardUUID !== action.dashboardUUID) {
            newState = {...newState, dashboardUUID: action.dashboardUUID, filterApplied: cachedData.filterApplied,
                selectedValues: cachedData.getSelectedValues(), filterErrors: cachedData.getFilterErrors()};
        }
        return newState;
    }

    // minValue: value.replace(/[^0-9.]/g, '')
    static onFilterUpdate(state, action) {
        const {filter, value} = action;
        const {filterConfigs} = state;

        const filterConfig = filterConfigs[filter.uuid];
        const inputDataType = filterConfig.getInputDataType();
        const currentFilterValue = state.selectedValues[filter.uuid];
        const isRange = filterConfig.widget === CustomFilter.widget.Range;

        const newState = {...state};
        newState.selectedValues = {...state.selectedValues};
        let updatedValue;
        switch (inputDataType) {
            case Concept.dataType.Coded:
            case CustomFilter.type.Gender:
                updatedValue = _.isNil(currentFilterValue) ? [] : [...currentFilterValue];
                ArrayUtil.toggle(updatedValue, value, (a, b) => a.uuid === b.uuid);
                break;

            case CustomFilter.type.Address:
            case Concept.dataType.Subject:
            case Concept.dataType.Text :
            case Concept.dataType.Notes :
            case Concept.dataType.Id :
                updatedValue = value;
                break;

            case Concept.dataType.Numeric:
            case Concept.dataType.Date:
            case Concept.dataType.DateTime:
            case Concept.dataType.Time:
                updatedValue = isRange ? {...currentFilterValue, ...value} : value;
                break;
        }

        newState.selectedValues[filter.uuid] = updatedValue;
        return newState;
    }

    static beforeFilterApply(state) {
        return {...state, loading: true};
    }

    static transformFilters(filledFilterValues, filterConfigs, selectedValues) {
        let selectedFilters = CustomDashboardActions.getDefaultCustomDashboardFilters();

        filledFilterValues.forEach(([filterUUID, filterValue]) => {
            selectedFilters.applied = true; //At-least one of the filters have been set
            const filterConfig = filterConfigs[filterUUID];
            const inputDataType = filterConfig.getInputDataType();
            const currentFilterValue = selectedValues[filterUUID];
            switch (inputDataType) {
                case Concept.dataType.Subject:
                case Concept.dataType.Program:
                case Concept.dataType.Encounter:
                case Concept.dataType.ProgramEncounter:
                case Concept.dataType.Image:
                case Concept.dataType.Video:
                case Concept.dataType.Audio:
                case Concept.dataType.File:
                case Concept.dataType.NA:
                case Concept.dataType.PhoneNumber:
                case Concept.dataType.GroupAffiliation:
                case Concept.dataType.QuestionGroup:
                case Concept.dataType.Duration:
                case Concept.dataType.Location:
                    //Not supported
                    break;
                case Concept.dataType.Time:
                case Concept.dataType.DateTime:
                    let customDateValue = [{dateType: inputDataType,
                        minValue: filterConfig.widget == CustomFilter.widget.Range ? currentFilterValue.minValue : currentFilterValue,
                        maxValue: filterConfig.widget == CustomFilter.widget.Range ? currentFilterValue.maxValue : ''}];
                    selectedFilters.selectedCustomFilters = {...selectedFilters.selectedCustomFilters,
                        [filterConfig.observationBasedFilter.concept.name] : customDateValue};
                    break;
                case Concept.dataType.Date:
                    selectedFilters.selectedCustomFilters = {...selectedFilters.selectedCustomFilters,
                        [filterConfig.type] : [{dateType: inputDataType, minValue: currentFilterValue}]};
                    break;
                case CustomFilter.type.Gender:
                    selectedFilters.selectedGenders = currentFilterValue;
                    break;
                case CustomFilter.type.Address:
                    selectedFilters.selectedLocations = _.flatMap(currentFilterValue.levels, (level) => {return level[1]});
                    break;
                default:
                    selectedFilters.selectedCustomFilters = {...selectedFilters.selectedCustomFilters,
                        [filterConfig.observationBasedFilter.concept.name] : [{value: currentFilterValue}]};
                    break;
            }

        });
        return selectedFilters;
    };

    static appliedFilter(state, action, context) {
        const {dashboardUUID, filterConfigs, selectedValues} = state;
        const {navigateToDashboardView, setFiltersDataOnDashboardView} = action;
        const newState = {...state};

        newState.filterErrors = {};
        const filledFilterValues = _.filter(Object.entries(selectedValues), ([, filterValue]) => !ModelGeneral.isDeepEmpty(filterValue));

        filledFilterValues.forEach(([filterUUID, filterValue]) => {
            const [success, message] = filterConfigs[filterUUID].validate(filterValue);
            if (!success)
                newState.filterErrors[filterUUID] = message;
        });
        if (Object.keys(newState.filterErrors).length > 0) {
            newState.filterApplied = false;
            newState.loading = false;
            // setFiltersDataOnDashboardView(CustomDashboardActions.getDefaultCustomDashboardFilters());
            return newState;
        }

        const dashboardFilterService = context.get(DashboardFilterService);
        const ruleInputArray = filledFilterValues
            .map(([filterUUID, filterValue]) => dashboardFilterService.toRuleInputObject(filterConfigs[filterUUID], filterValue));
        let transformedFilters = FiltersActionsV2.transformFilters(filledFilterValues, filterConfigs, selectedValues);
        newState.filterApplied = true;
        const customDashboardCache = FiltersActionsV2.createCustomDashboardCache(newState, dashboardUUID, transformedFilters, ruleInputArray);
        context.get(CustomDashboardCacheService).saveOrUpdate(customDashboardCache);

        setFiltersDataOnDashboardView(transformedFilters);
        navigateToDashboardView(ruleInputArray);
        return newState;
    }

    static createCustomDashboardCache(newState, dashboardUUID, transformedFilters, ruleInputArray) {
        let selectValueJSON = JSON.stringify(newState.selectedValues, Realm.JsonSerializationReplacer);
        let filteredErrorsJSON = JSON.stringify(newState.filterErrors, Realm.JsonSerializationReplacer);
        let transformedFiltersJSON = JSON.stringify(transformedFilters, Realm.JsonSerializationReplacer);
        let ruleInputJSON = JSON.stringify({ruleInputArray: ruleInputArray}, Realm.JsonSerializationReplacer);
        const customDashboardCache = CustomDashboardCache.create(dashboardUUID, newState.filterConfigsChecksum, new Date(), selectValueJSON,
          newState.filterApplied, filteredErrorsJSON, ruleInputJSON, transformedFiltersJSON);
        return customDashboardCache;
    }

    static clearFilter(state, action, context) {
        let newState = {...state};
        newState = {...newState, filterApplied: false, selectedValues: {}, filterErrors: {}};
        const customDashboardCache = FiltersActionsV2.createCustomDashboardCache(newState, newState.dashboardUUID,
          CustomDashboardActions.getDefaultCustomDashboardFilters(), null);
        context.get(CustomDashboardCacheService).saveOrUpdate(customDashboardCache);
        return newState;
    }
}

const FilterActionPrefix = 'FilterAV2';
const FilterActionNames = {
    ON_LOAD: `${FilterActionPrefix}.ON_LOAD`,
    ON_FILTER_UPDATE: `${FilterActionPrefix}.ON_FILTER_UPDATE`,
    BEFORE_APPLY_FILTER: `${FilterActionPrefix}.BEFORE_APPLY_FILTER`,
    APPLIED_FILTER: `${FilterActionPrefix}.APPLIED_FILTER`,
    CLEAR_FILTER: `${FilterActionPrefix}.CLEAR_FILTER`,
};

const FilterActionMapV2 = new Map([
    [FilterActionNames.ON_LOAD, FiltersActionsV2.onLoad],
    [FilterActionNames.ON_FILTER_UPDATE, FiltersActionsV2.onFilterUpdate],
    [FilterActionNames.BEFORE_APPLY_FILTER, FiltersActionsV2.beforeFilterApply],
    [FilterActionNames.APPLIED_FILTER, FiltersActionsV2.appliedFilter],
    [FilterActionNames.CLEAR_FILTER, FiltersActionsV2.clearFilter],
]);

export {
    FiltersActionsV2, FilterActionPrefix, FilterActionMapV2, FilterActionNames
}
