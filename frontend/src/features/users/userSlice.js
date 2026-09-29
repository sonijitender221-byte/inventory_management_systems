import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const fetchUsers = createAsyncThunk("users/fetch", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/users"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const createUser = createAsyncThunk("users/create", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/users", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const updateUser = createAsyncThunk("users/update", async ({ id, body }, { rejectWithValue }) => {
  try { const { data } = await api.patch(`/users/${id}`, body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});

const userSlice = createSlice({
  name: "users",
  initialState: { items: [], loading: false, saving: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.loading = true; })
      .addCase(fetchUsers.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload; })
      .addCase(fetchUsers.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createUser.fulfilled, (s, { payload }) => { s.items.unshift(payload); })
      .addCase(updateUser.fulfilled, (s, { payload }) => {
        const i = s.items.findIndex((u) => u._id === payload._id);
        if (i !== -1) s.items[i] = payload;
      })
      .addMatcher((a) => /^users\/(create|update)\/pending$/.test(a.type), (s) => { s.saving = true; })
      .addMatcher((a) => /^users\/(create|update)\/(fulfilled|rejected)$/.test(a.type), (s) => { s.saving = false; });
  },
});

export default userSlice.reducer;