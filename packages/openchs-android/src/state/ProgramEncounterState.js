import AbstractDataEntryState from "./AbstractDataEntryState";
import Wizard from "./Wizard";
import {AbstractEncounter, ObservationsHolder, ProgramEncounter, ProgramConfig, StaticFormElementGroup} from "avni-models";
import ConceptService from "../service/ConceptService";
import _ from 'lodash';

class ProgramEncounterState extends AbstractDataEntryState {
    constructor(formElementGroup, wizard, isNewEntity, programEncounter, filteredFormElements, workLists, messageDisplayed) {
        super([], formElementGroup, wizard, isNewEntity, filteredFormElements, workLists);
        this.programEncounter = programEncounter;
        this.messageDisplayed = messageDisplayed;
    }

    getEntity() {
        return this.programEncounter;
    }

    getEntityType() {
        return ProgramEncounter.schema.name;
    }

    static createOnLoad(programEncounter, form, isNewEntity, formElementGroup, filteredFormElements, formElementStatuses, workLists, messageDisplayed) {
        let indexOfGroup = _.findIndex(form.formElementGroups, (feg) => feg.uuid === formElementGroup.uuid) + 1;
        let state = new ProgramEncounterState(formElementGroup, new Wizard(form.numberOfPages, indexOfGroup, indexOfGroup), isNewEntity, programEncounter, filteredFormElements, workLists, messageDisplayed);
        state.observationsHolder.updatePrimitiveObs(filteredFormElements, formElementStatuses);
        return state;
    }

    static createOnLoadStateForEmptyForm(programEncounter, form, isNewEntity, workLists, messageDisplayed) {
        let state = new ProgramEncounterState(new StaticFormElementGroup(form), new Wizard(1), isNewEntity, programEncounter, [], workLists, messageDisplayed);
        return state;
    }

    clone() {
        const programEncounterState = super.clone(new ProgramEncounterState());
        programEncounterState.locationError = this.locationError;
        programEncounterState.programEncounter = this.programEncounter;
        programEncounterState.messageDisplayed = this.messageDisplayed;
        return programEncounterState;
    }

    getWorkContext() {
        return {
            subjectUUID: this.programEncounter.programEnrolment.individual.uuid,
            programEnrolmentUUID: this.programEncounter.programEnrolment.uuid,
        };
    }

    get observationsHolder() {
        return new ObservationsHolder(this.programEncounter.observations);
    }

    validateEntity(context) {
        const validationResults = this.programEncounter.validate();
        const locationValidation = this.validateLocation(
            this.programEncounter.encounterLocation,
            ProgramEncounter.validationKeys.ENCOUNTER_LOCATION,
            context
        );
        console.log(`PE error ${this.locationError} ${JSON.stringify(this.programEncounter.encounterLocation)} ${JSON.stringify(locationValidation)}`)
        validationResults.push(locationValidation);
        return validationResults;
    }

    get staticFormElementIds() {
        if (this.wizard.isFirstPage()) {
            return [AbstractEncounter.fieldKeys.ENCOUNTER_DATE_TIME, ProgramEncounter.validationKeys.ENCOUNTER_LOCATION];
        } else {
            return [];
        }
    }

    validateEntityAgainstRule(ruleService) {
        return ruleService.validateAgainstRule(this.programEncounter, this.formElementGroup.form, ProgramEncounter.schema.name);
    }

    executeRule(ruleService, context) {
        let decisions = ruleService.getDecisions(this.programEncounter, ProgramEncounter.schema.name);
        context.get(ConceptService).addDecisions(this.programEncounter.observations, decisions.encounterDecisions);

        const enrolment = this.programEncounter.programEnrolment.cloneForEdit();
        context.get(ConceptService).addDecisions(enrolment.observations, decisions.enrolmentDecisions);
        this.programEncounter.programEnrolment = enrolment;

        return decisions;
    }

    getNextScheduledVisits(ruleService, context) {
        const programConfig = ruleService
                .findByKey("program.uuid", this.programEncounter.programEnrolment.program.uuid, ProgramConfig.schema.name);
        return ruleService.getNextScheduledVisits(this.programEncounter, ProgramEncounter.schema.name, [..._.get(programConfig, "visitSchedule", [])]
            .map(k => _.assignIn({}, k)));
    }

    getEffectiveDataEntryDate() {
        return this.programEncounter.encounterDateTime;
    }
}

export default ProgramEncounterState;
