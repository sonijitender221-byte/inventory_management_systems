import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchCategories = createAsyncThunk("categories/fetch", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/categories"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const createCategory = createAsyncThunk("categories/create", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/categories", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const updateCategory = createAsyncThunk("categories/update", async ({ id, body }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/categories/${id}`, body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const deleteCategory = createAsyncThunk("categories/delete", async (id, { rejectWithValue }) => {
  try { await api.delete(`/categories/${id}`); return id; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const categorySlice = createSlice({
  name: "categories",
  initialState: { items: [], loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (s) => { s.loading = true; })
      .addCase(fetchCategories.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload; })
      .addCase(fetchCategories.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createCategory.fulfilled, (s, { payload }) => { s.items.push(payload); })
      .addCase(updateCategory.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((c) => c._id === payload._id);
        if (i !== -1) s.items[i] = { ...s.items[i], ...payload };
      })
      .addCase(deleteCategory.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((c) => c._id !== payload);
      })
      .addMatcher((a) => /^categories\/(create|update|delete)\/pending$/.test(a.type), (s) => { s.saving = true; })
      .addMatcher((a) => /^categories\/(create|update|delete)\/(fulfilled|rejected)$/.test(a.type), (s) => { s.saving = false; });
  },
});

export default categorySlice.reducer;