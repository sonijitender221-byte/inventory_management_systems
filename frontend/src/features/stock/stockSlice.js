import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchMovements = createAsyncThunk("stock/fetch", async (params, { rejectWithValue }) => {
  try { const { data } = await api.get("/stock", { params }); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const createMovement = createAsyncThunk("stock/create", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/stock", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const stockSlice = createSlice({
  name: "stock",
  initialState: { items: [], total: 0, page: 1, pages: 1, loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovements.pending, (s) => { s.loading = true; })
      .addCase(fetchMovements.fulfilled, (s, { payload }) => { s.loading = false; Object.assign(s, payload); })
      .addCase(fetchMovements.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createMovement.pending, (s) => { s.saving = true; })
      .addCase(createMovement.fulfilled, (s, { payload }) => {
        s.saving = false;
        s.items.unshift(payload.movement);
        s.total += 1;
      })
      .addCase(createMovement.rejected, (s) => { s.saving = false; });
  },
});

export default stockSlice.reducer;