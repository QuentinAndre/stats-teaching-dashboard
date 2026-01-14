import { configureStore } from '@reduxjs/toolkit';
import samplingReducer from './slices/samplingSlice';

export const store = configureStore({
  reducer: {
    sampling: samplingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
