import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { errMsg } from "../../api/axios";

export const checkSetup = createAsyncThunk("auth/checkSetup", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/auth/setup-status"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const setupAdmin = createAsyncThunk("auth/setup", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/auth/setup", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const login = createAsyncThunk("auth/login", async (body, { rejectWithValue }) => {
  try { const { data } = await api.post("/auth/login", body); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try { const { data } = await api.get("/auth/me"); return data; }
  catch (err) { return rejectWithValue(errMsg(err)); }
});
export const register = createAsyncThunk("auth/register", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", body);
    return data;
  } catch (e) {
    return rejectWithValue(errMsg(e));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token"),
    needsSetup: false,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null; state.token = null;
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(register.pending, (st) => { st.loading = true; st.error = null; })
.addCase(register.fulfilled, (st, { payload }) => {
  st.loading = false;
  st.user = payload.user;
  st.token = payload.token;
  localStorage.setItem("token", payload.token);
})
.addCase(register.rejected, (st, { payload }) => {
  st.loading = false;
  st.error = payload;
})
      .addCase(checkSetup.fulfilled, (s, { payload }) => { s.needsSetup = payload.needsSetup; })
      .addCase(setupAdmin.fulfilled, (s, { payload }) => {
        s.user = payload.user; s.token = payload.token; s.needsSetup = false;
        localStorage.setItem("token", payload.token);
      })
      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.loading = false; s.user = payload.user; s.token = payload.token;
        localStorage.setItem("token", payload.token);
      })
      .addCase(login.rejected, (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchMe.fulfilled, (s, { payload }) => { s.user = payload.user; })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null; s.token = null;
        localStorage.removeItem("token");
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;