import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchProducts = createAsyncThunk("products/fetch", async (params, { rejectWithValue }) => {
  try { const { data } = await api.get("/products", { params }); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const createProduct = createAsyncThunk("products/create", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/products", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const updateProduct = createAsyncThunk("products/update", async ({ id, body }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/products/${id}`, body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const deleteProduct = createAsyncThunk("products/delete", async (id, { rejectWithValue }) => {
  try { await api.delete(`/products/${id}`); return id; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const productSlice = createSlice({
  name: "products",
  initialState: { items: [], total: 0, page: 1, pages: 1, loading: false, saving: false, error: null },
  reducers: {
    setQuantity: (state, { payload }) => {
      const p = state.items.find((i) => i._id === payload._id);
      if (p) p.quantity = payload.quantity;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => { s.loading = false; Object.assign(s, payload); })
      .addCase(fetchProducts.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createProduct.fulfilled, (s, { payload }) => { s.items.unshift(payload); s.total += 1; })
      .addCase(updateProduct.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((p) => p._id === payload._id);
        if (i !== -1) s.items[i] = payload;
      })
      .addCase(deleteProduct.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((p) => p._id !== payload);
        s.total -= 1;
      })
      .addMatcher((a) => /^products\/(create|update|delete)\/pending$/.test(a.type), (s) => { s.saving = true; })
      .addMatcher((a) => /^products\/(create|update|delete)\/(fulfilled|rejected)$/.test(a.type), (s) => { s.saving = false; });
  },
});

export const { setQuantity } = productSlice.actions;
export default productSlice.reducer;