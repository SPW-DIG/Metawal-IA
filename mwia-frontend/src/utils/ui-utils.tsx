import * as React from 'react';
import {PromiseState, usePromise, usePromiseFn} from './hooks';
import {memo} from 'react';

export type Optional<T> = T | undefined | null;

export function renderPromiseFn<R>(
    promiseFn: () => Promise<R> | undefined,
    deps: any[],
    children: (result: R) => React.ReactElement | null,
    errorFn?: (error: string) => React.ReactElement | null,
    loadingFn?: () => React.ReactElement | null
): React.ReactElement | null {
    const state = usePromiseFn(promiseFn, deps);

    return renderPromiseState(state, children, errorFn, loadingFn);
}

export function renderPromise<R>(
    promise: Promise<R>,
    children: (result: R) => React.ReactElement | null,
    errorFn?: (error: string) => React.ReactElement | null,
    loadingFn?: () => React.ReactElement | null
): React.ReactElement | null {
    const state = usePromise(promise);

    return renderPromiseState(state, children, errorFn, loadingFn);
}

export function renderPromiseState<R>(
    state: PromiseState<R>,
    children: (result: R) => React.ReactElement | null,
    errorFn?: (error: string) => React.ReactElement | null,
    loadingFn?: () => React.ReactElement | null
): React.ReactElement | null {
    if (state.done) {
        if (state.success) {
            return children(state.result);
        } else {
            let msg;
            if (state.error instanceof Error) {
                console.warn(state.error);
                msg = state.error.message;
            } else {
                msg = state.error && state.error.toString();
            }

            return errorFn ? errorFn(msg) : <div>Error: {msg}</div>;
        }
    } else {
        return loadingFn ? loadingFn() : <Spinner/>;
    }
}

export function PromiseFnContainer<R>(props: {
    promiseFn: () => Promise<R> | undefined;
    deps: any[];
    children: (result: R) => React.ReactElement | null;
    errorFn?: (error: string) => React.ReactElement | null;
    loadingFn?: () => React.ReactElement | null;
}) {
    return renderPromiseFn(props.promiseFn, props.deps, props.children, props.errorFn, props.loadingFn);
}

export function PromiseContainer<R>(props: {
    promise: Promise<R>;
    children: (result: R) => React.ReactElement | null;
    errorFn?: (error: string) => React.ReactElement | null;
    loadingFn?: () => React.ReactElement | null;
}) {
    return renderPromise(props.promise, props.children, props.errorFn, props.loadingFn);
}

export function PromiseStateContainer<R>(props: {
    state: PromiseState<R>;
    children: (result: R) => React.ReactElement | null;
    errorFn?: (error: string) => React.ReactElement | null;
    loadingFn?: () => React.ReactElement | null;
}) {
    return renderPromiseState(props.state, props.children, props.errorFn, props.loadingFn);
}

export const ErrorMessage = memo((props: { message: string }) => {
    return <div className="error">${props.message}</div>;
});

export const Spinner = memo(() => {
    return (
        <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
});



const DefaultRenderError = (props: { error: Error }) => {
    console.warn(props.error);
    const message = parseError(props.error);
    return <ErrorBox message={message}/>;
};

export interface ErrorBoundaryProps {
    renderError?: (props: { error: Error }) => JSX.Element;
}

export interface ErrorBoundaryState {
    error: Error | undefined | null;
}

export class ErrorBoundary extends React.PureComponent<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        error: null
    };

    render() {
        const {error} = this.state;
        const RenderError = this.props.renderError || DefaultRenderError;

        if (error != null) {
            return <RenderError error={error}/>;
        } else return this.props.children;
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        error = error || new Error("Undefined Error : "+errorInfo.componentStack);
        this.setState({error});
        console.warn(error);
    }
}


export const ErrorText = (props: { message: Optional<string> }) => {
    return (
        <span>
{/*            <strong>
                <Icon value="exclamation-triangle" />
            </strong>*/}
            {props.message || 'Unknown error'}
        </span>
    );
};


export class ErrorBox extends React.PureComponent<{ message: Optional<string>; stack?: Optional<string> }, any> {
    render() {
        return (
            <div className="error-box">
                <ErrorText message={this.props.message}/>
            </div>
        );
    }
}


export function parseError(error: any): string {
    // TODO error.message may be an object, when server responds e.g. with
    // {"error" : {"code" : 500, "message" : "..."} }

    let message;

    if (typeof error == "string") {
        message = error;
    } else if (
        error &&
        error.xhr &&
        error.xhr.response &&
        error.xhr.response.error &&
        error.xhr.response.error &&
        error.xhr.response.error.message
    ) {
        message = error.xhr.response.error.message;
    } else {
        message = (error && (error.message || error.toString())) || 'Unknown error';
    }

    return message;
}


/**
 * sends a request to the specified url from a form. this will change the window location.
 * @param {string} path the path to send the post request to
 * @param {object} params the parameters to add to the url
 * @param {string} [method=post] the method to use on the form
 */

export function post(path: string, params: any, method='post') {

    // The rest of this code assumes you are not using a library.
    // It can be made less verbose if you use one.
    const form = document.createElement('form');
    form.method = method;
    form.action = path;

    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

