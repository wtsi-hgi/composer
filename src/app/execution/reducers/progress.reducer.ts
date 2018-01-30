import {
    EXECUTION_START,
    ExecutionStartAction,
    EXECUTION_COMPLETE,
    ExecutionCompleteAction,
    EXECUTION_ERROR,
    ExecutionErrorAction,
    EXECUTION_STOP,
    EXECUTION_REQUIREMENT_ERROR,
    ExecutionRequirementErrorAction,
    EXECUTION_STEP_START,
    EXECUTION_STEP_FAIL,
    EXECUTION_STEP_COMPLETE,
    ExecutionStepFailAction
} from "../actions/execution.actions";
import {ProgressState} from "./index";
import {TAB_CLOSE, TabCloseAction} from "../../core/actions/core.actions";
import {AppExecution, ExecutionError, ExecutionState, StepExecution} from "../models";


export function reducer<T extends { type: string | any }>(state: ProgressState = {}, action: T): ProgressState {

    switch (action.type) {

        /**
         * When app tab is closed, execution state should be cleared so it doesn't show up again when the app is reopened
         *
         * @name progress.reducer.tabClose
         * @see progress.reducer.tabCloseTest
         */
        case TAB_CLOSE: {
            const {tabID} = action as Partial<TabCloseAction>;

            if (!state[tabID]) {
                return state;
            }

            const stateUpdate = {...state};
            delete stateUpdate[tabID];

            return stateUpdate;
        }

        case EXECUTION_START: {

            const {steps, appID, outDirPath} = action as Partial<ExecutionStartAction>;

            const stepExecution = steps.map(step => new StepExecution(step.id, step.label));
            const app           = new AppExecution(outDirPath, stepExecution);

            return {...state, [appID]: app};
        }

        case EXECUTION_COMPLETE: {

            const {appID} = action as Partial<ExecutionCompleteAction>;
            return {...state, [appID]: state[appID].complete()};
        }

        case EXECUTION_ERROR: {

            const {appID, exitCode} = action as Partial<ExecutionErrorAction>;

            const app = state[appID].failProcess(new ExecutionError(exitCode, undefined, "execution"));
            return {...state, [appID]: app};
        }

        case EXECUTION_REQUIREMENT_ERROR: {
            const {appID, message} = action as Partial<ExecutionRequirementErrorAction>;

            const app = state[appID].failProcess(new ExecutionError(1, message, "requirement"));
            return {...state, [appID]: app};
        }

        case EXECUTION_STOP: {

            const {appID} = action as Partial<ExecutionErrorAction>;

            return {...state, [appID]: state[appID].stop()};
        }

        case EXECUTION_STEP_START:
        case EXECUTION_STEP_FAIL:
        case EXECUTION_STEP_COMPLETE: {
            const {appID, stepID} = action as Partial<ExecutionStepFailAction>;

            const app = state[appID];

            const update = app.update({
                stepExecution: app.stepExecution.map(step => {
                    if (step.id === stepID) {

                        let state: ExecutionState;
                        if (action.type === EXECUTION_STEP_START) {
                            state = "started";
                        } else if (action.type === EXECUTION_STEP_COMPLETE) {
                            state = "completed";
                        } else if (action.type === EXECUTION_STEP_FAIL) {
                            state = "failed";
                        }

                        return step.transitionTo(state);
                    }

                    return step;
                })
            });


            return {...state, [appID]: update};
        }


        default:
            return state;
    }

}
