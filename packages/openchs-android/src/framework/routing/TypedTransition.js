import invariant from "invariant";
import _ from "lodash";
import General from "../../utility/General";
import {Keyboard} from 'react-native';

// navigator commands are async in their actual effect of their execution. so if you run more than one navigator action one after other the output is indeterminate
export default class TypedTransition {
    constructor(view) {
        this.view = view;
    }

    with(queryParams) {
        this.queryParams = queryParams;
        return this;
    }

    to(viewClass, isTyped, replace) {
        this.safeDismissKeyboard();
        invariant(viewClass.path, 'Parameter `viewClass` should have a function called `path`');
        const route = TypedTransition.createRoute(viewClass, this.queryParams, isTyped);
        General.logDebug('TypedTransition', `Route size: ${this.navigator.getCurrentRoutes().length}. To: ${route.path} Param Keys: ${General.stringify(this.queryParams, 3)}`);
        if (replace) {
            this.navigator.replace(route);
        } else {
            this.navigator.push(route);
        }
        return this;
    }

    static createRoute(viewClass, queryParams = {}, isTyped = false) {
        return {path: viewClass.path(), queryParams, isTyped};
    }

    get navigator() {
        return this.view.context.navigator();
    }

    goBack() {
        this.safeDismissKeyboard();
        //This is a quick fix until we upgrade
        try {
            this.navigator.pop();
        } catch (e) {
        }
    }

    safeDismissKeyboard() {
        try {
            Keyboard.dismiss();
        } catch (e) {
        }
    }

    static from(view) {
        invariant(view, 'Required parameter `{view}`');
        invariant(view.context.navigator, 'Parameter `{view}` should be a React component and have a navigator context');

        return new TypedTransition(view);
    }

    toBeginning() {
        this.safeDismissKeyboard();
        this.navigator.popToTop();
        return this;
    }

    resetStack(toBePopped, toBePushed = []) {
        this.safeDismissKeyboard();
        const currentRoutes = this.navigator.getCurrentRoutes();
        const newRouteStack = _.filter(currentRoutes, (route) => !_.some(toBePopped, item => item.path() === route.path));

        if (_.isEmpty(toBePushed)) {
            this._popN(currentRoutes.length - newRouteStack.length);
            return;
        }
        General.logDebug('TypedTransition', `Initial: ${currentRoutes.length}, Final before push: ${newRouteStack.length},
        To/ParamKeys: ${_.join(toBePushed.map((x) => `${x.path}, ${General.stringify(x.queryParams, 3)}`), ";\n")}`);
        newRouteStack.push(...toBePushed);
        this.navigator.immediatelyResetRouteStack(_.uniq(newRouteStack));
    }

    _popN(n) {
        this.safeDismissKeyboard();
        try {
            this.navigator.popN(n);
        } catch (e) {
        }
        return this;
    }

    popToBookmark() {
        if (!_.isNil(this.navigator.countOfRoutes)) {
            this._popN(this.navigator.getCurrentRoutes().length - this.navigator.countOfRoutes);
            this.navigator.countOfRoutes = null;
        }
    }

    bookmark() {
        this.navigator.countOfRoutes = this.navigator.getCurrentRoutes().length;
        return this;
    }
}
