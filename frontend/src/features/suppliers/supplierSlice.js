import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchSuppliers = createAsyncThunk("suppliers/fetch", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/suppliers"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const createSupplier = createAsyncThunk("suppliers/create", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/suppliers", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const updateSupplier = createAsyncThunk("suppliers/update", async ({ id, body }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/suppliers/${id}`, body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const deleteSupplier = createAsyncThunk("suppliers/delete", async (id, { rejectWithValue }) => {
  try { await api.delete(`/suppliers/${id}`); return id; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const supplierSlice = createSlice({
  name: "suppliers",
  initialState: { items: [], loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (s) => { s.loading = true; })
      .addCase(fetchSuppliers.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload; })
      .addCase(fetchSuppliers.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createSupplier.fulfilled, (s, { payload }) => { s.items.push(payload); })
      .addCase(updateSupplier.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((x) => x._id === payload._id);
        if (i !== -1) s.items[i] = payload;
      })
      .addCase(deleteSupplier.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((x) => x._id !== payload);
      })
      .addMatcher((a) => /^suppliers\/(create|update|delete)\/pending$/.test(a.type), (s) => { s.saving = true; })
      .addMatcher((a) => /^suppliers\/(create|update|delete)\/(fulfilled|rejected)$/.test(a.type), (s) => { s.saving = false; });
  },
});

export default supplierSlice.reducer;