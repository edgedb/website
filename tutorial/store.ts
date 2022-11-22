import {createStore, applyMiddleware} from "redux";
import thunk from "redux-thunk";

import {reducer} from "./state";

const store = createStore(reducer, applyMiddleware(thunk));

export type AppDispatch = typeof store.dispatch;

export type GetState = typeof store.getState;

export default store;
