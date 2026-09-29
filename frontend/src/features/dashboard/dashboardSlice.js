import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchDashboard = createAsyncThunk("dashboard/fetch", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/dashboard"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (s) => { s.loading = true; })
      .addCase(fetchDashboard.fulfilled, (s, { payload }) => { s.loading = false; s.data = payload; })
      .addCase(fetchDashboard.rejected, (s, { payload }) => { s.loading = false; s.error = payload; });
  },
});

export default dashboardSlice.reducer;